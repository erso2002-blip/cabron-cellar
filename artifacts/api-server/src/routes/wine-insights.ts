import { Router } from "express";
import { and, db, desc, eq, sql, winesTable } from "@workspace/db";
import { getAuthenticatedUser } from "../lib/auth.js";
import { getOpenAIClient } from "../lib/openai.js";
import { requireProFeature } from "../lib/planAccess.js";
import { rateLimit } from "../middlewares/rateLimit.js";

const router = Router();

interface DishPairingRecommendation {
  wineId: number;
  wineName: string;
  producer: string | null;
  vintage: number | null;
  country: string | null;
  region: string | null;
  grape: string | null;
  reason: string;
  servingNote: string;
}

interface DishPairingResponse {
  dish: string;
  recommendations: DishPairingRecommendation[];
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function coerceRecommendation(
  value: unknown,
  availableWineIds: Set<number>,
): DishPairingRecommendation | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Partial<DishPairingRecommendation>;
  const wineId = Number(item.wineId);
  if (!Number.isInteger(wineId) || !availableWineIds.has(wineId)) return null;

  return {
    wineId,
    wineName: cleanText(item.wineName, 160),
    producer: item.producer ? cleanText(item.producer, 160) : null,
    vintage: Number.isInteger(item.vintage) ? item.vintage! : null,
    country: item.country ? cleanText(item.country, 80) : null,
    region: item.region ? cleanText(item.region, 120) : null,
    grape: item.grape ? cleanText(item.grape, 160) : null,
    reason: cleanText(item.reason, 260),
    servingNote: cleanText(item.servingNote, 160),
  };
}

// POST /pairings/dish
router.post("/pairings/dish", rateLimit({ keyPrefix: "dish-pairing-ai", windowMs: 60_000, max: 12 }), async (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const proGate = requireProFeature(user, "dish_pairing");
  if (proGate) return res.status(proGate.status).json(proGate.body);

  const dish = cleanText(req.body?.dish, 160);
  if (dish.length < 2) {
    return res.status(400).json({ error: "Invalid dish" });
  }

  const wines = await db
    .select()
    .from(winesTable)
    .where(
      and(
        eq(winesTable.userId, user.id),
        sql`${winesTable.quantity} > 0`,
      ),
    )
    .orderBy(desc(winesTable.createdAt))
    .limit(80);

  if (!wines.length) {
    return res.status(409).json({ error: "No wines available" });
  }

  try {
    const openai = getOpenAIClient();
    if (!openai) {
      return res.status(503).json({ error: "AI service is not configured" });
    }

    const cellar = wines
      .map((wine) => ({
        wineId: wine.id,
        wineName: wine.name,
        producer: wine.producer,
        vintage: wine.vintage,
        country: wine.country,
        region: wine.region,
        grape: wine.grape,
        quantity: wine.quantity,
      }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a master sommelier. Given a dish and a user's available wines, pick the 3 best wine pairings from that exact list. Return ONLY a JSON object, no markdown.

Format:
{
  "recommendations": [
    {
      "wineId": 123,
      "wineName": "Wine name",
      "producer": "Producer or null",
      "vintage": 2020,
      "country": "Country or null",
      "region": "Region or null",
      "grape": "Grape or null",
      "reason": "1-sentence pairing reason in Portuguese",
      "servingNote": "Short serving note in Portuguese"
    }
  ]
}

Rules:
- Return exactly 3 recommendations when 3 or more wines are available.
- Only use wineId values from the provided cellar list.
- Rank the best pairing first.
- All user-facing text must be in Portuguese.`,
        },
        {
          role: "user",
          content: JSON.stringify({ dish, cellar }),
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim() ?? "";
    let parsed: { recommendations?: unknown[] };
    try {
      parsed = JSON.parse(content) as { recommendations?: unknown[] };
    } catch {
      req.log.warn({ content }, "Failed to parse dish pairing");
      return res.status(422).json({ error: "Could not generate dish pairing" });
    }

    const availableWineIds = new Set(wines.map((wine) => wine.id));
    const recommendations = (Array.isArray(parsed.recommendations) ? parsed.recommendations : [])
      .map((item) => coerceRecommendation(item, availableWineIds))
      .filter((item): item is DishPairingRecommendation => Boolean(item))
      .slice(0, 3);

    if (!recommendations.length) {
      return res.status(422).json({ error: "Could not generate dish pairing" });
    }

    return res.json({ dish, recommendations } satisfies DishPairingResponse);
  } catch (err) {
    req.log.error({ err }, "OpenAI dish pairing error");
    return res.status(500).json({ error: "Dish pairing generation failed" });
  }
});

// POST /wines/:id/insights
router.post("/wines/:id/insights", rateLimit({ keyPrefix: "insights-ai", windowMs: 60_000, max: 12 }), async (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const proGate = requireProFeature(user, "wine_harmonization");
  if (proGate) return res.status(proGate.status).json(proGate.body);

  const userId = user.id;
  const id = parseInt(req.params.id);

  const [wine] = await db
    .select()
    .from(winesTable)
    .where(and(eq(winesTable.id, id), eq(winesTable.userId, userId)));

  if (!wine) return res.status(404).json({ error: "Wine not found" });

  const wineDesc = [
    `Nome: ${wine.name}`,
    wine.producer && `Produtor: ${wine.producer}`,
    wine.grape && `Uva(s): ${wine.grape}`,
    wine.vintage && `Safra: ${wine.vintage}`,
    wine.country && `País de origem: ${wine.country}`,
    wine.region && `Região: ${wine.region}`,
  ]
    .filter(Boolean)
    .join(", ");

  try {
    const openai = getOpenAIClient();
    if (!openai) {
      return res.status(503).json({ error: "AI service is not configured" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a master sommelier. Given wine details, return ONLY a JSON object (no markdown).

Format:
{
  "harmonization": [
    { "food": "Food name in Portuguese", "note": "1-sentence pairing reason in Portuguese" }
  ],
  "servingTemp": "<e.g. 16–18°C>",
  "decanting": "<e.g. '30 minutos' or 'Não necessário'>"
}

Rules:
- harmonization: 4–5 dishes that genuinely pair well
- All text fields in Portuguese`,
        },
        {
          role: "user",
          content: `Wine: ${wineDesc}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim() ?? "";
    let parsed: WineInsights;
    try {
      parsed = JSON.parse(content) as WineInsights;
    } catch {
      req.log.warn({ content }, "Failed to parse wine insights");
      return res.status(422).json({ error: "Could not generate insights" });
    }

    return res.json({
      harmonization: Array.isArray(parsed.harmonization)
        ? parsed.harmonization
        : [],
      servingTemp: parsed.servingTemp ?? "",
      decanting: parsed.decanting ?? "",
    } satisfies WineInsights);
  } catch (err) {
    req.log.error({ err }, "OpenAI wine insights error");
    return res.status(500).json({ error: "Insights generation failed" });
  }
});

interface WineInsights {
  harmonization: Array<{ food: string; note: string }>;
  servingTemp: string;
  decanting: string;
}

export default router;
