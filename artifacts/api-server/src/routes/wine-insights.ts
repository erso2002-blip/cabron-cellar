import { Router } from "express";
import OpenAI from "openai";
import { db } from "@workspace/db";
import { winesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /wines/:id/insights
router.post("/wines/:id/insights", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = req.user!.id;
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
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content: `You are a master sommelier. Given wine details, return ONLY a JSON object (no markdown).

Format:
{
  "harmonization": [
    { "food": "Food name in Portuguese", "note": "1-sentence pairing reason in Portuguese" }
  ],
  "priceOrigin": {
    "min": <number>,
    "max": <number>,
    "currency": "<ISO currency code of origin country, e.g. EUR, USD, ARS>",
    "currencySymbol": "<symbol, e.g. €, $, ARS$>",
    "market": "<origin country in Portuguese>"
  },
  "priceLocal": {
    "min": <number>,
    "max": <number>,
    "currency": "BRL",
    "currencySymbol": "R$",
    "market": "Brasil"
  },
  "priceNote": "<1 sentence in Portuguese explaining price range factors>",
  "servingTemp": "<e.g. 16–18°C>",
  "decanting": "<e.g. '30 minutos' or 'Não necessário'>"
}

Rules:
- harmonization: 4–5 dishes that genuinely pair well
- Prices: realistic market estimates for the wine's quality tier and vintage
- If origin is Brazil, omit priceOrigin (set it to null)
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

    return res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "OpenAI wine insights error");
    return res.status(500).json({ error: "Insights generation failed" });
  }
});

interface PriceRange {
  min: number;
  max: number;
  currency: string;
  currencySymbol: string;
  market: string;
}

interface WineInsights {
  harmonization: Array<{ food: string; note: string }>;
  priceOrigin: PriceRange | null;
  priceLocal: PriceRange;
  priceNote: string;
  servingTemp: string;
  decanting: string;
}

export default router;
