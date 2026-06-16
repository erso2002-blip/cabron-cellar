import { Router } from "express";
import { and, db, eq, winesTable } from "@workspace/db";
import { getAuthenticatedUser } from "../lib/auth.js";
import { getOpenAIClient } from "../lib/openai.js";

const router = Router();

// POST /wines/:id/insights
router.post("/wines/:id/insights", async (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

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
