import { Router } from "express";
import { getAuthenticatedUser } from "../lib/auth.js";
import { getOpenAIClient } from "../lib/openai.js";
import { requireProFeature } from "../lib/planAccess.js";
import { rateLimit } from "../middlewares/rateLimit.js";

const router = Router();
const MAX_INPUT_LENGTH = 180;

function bounded(value: unknown) {
  return typeof value !== "string" || value.length <= MAX_INPUT_LENGTH;
}

// POST /wines/suggest-drink-until
router.post("/wines/suggest-drink-until", rateLimit({ keyPrefix: "drink-ai", windowMs: 60_000, max: 12 }), async (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const proGate = requireProFeature(user, "drink_until_suggestion");
  if (proGate) return res.status(proGate.status).json(proGate.body);

  const { name, producer, grape, vintage, country, region } = req.body as {
    name?: string;
    producer?: string;
    grape?: string;
    vintage?: number;
    country?: string;
    region?: string;
  };

  if (!name && !grape && !country) {
    return res.status(400).json({ error: "Provide at least name, grape or country" });
  }

  if (![name, producer, grape, country, region].every(bounded)) {
    return res.status(400).json({ error: "Input is too long" });
  }

  const wineDescription = [
    name && `Nome: ${name}`,
    producer && `Produtor: ${producer}`,
    grape && `Uva: ${grape}`,
    vintage && `Safra: ${vintage}`,
    country && `País: ${country}`,
    region && `Região: ${region}`,
  ]
    .filter(Boolean)
    .join(", ");

  try {
    const openai = getOpenAIClient();
    if (!openai) {
      return res.status(503).json({ error: "AI service is not configured" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content: `You are a sommelier expert. Given wine details, estimate the ideal drinking window and return ONLY a JSON object with no markdown.
Format: {"suggestedDate": "YYYY-MM-DD", "reason": "brief explanation in Portuguese, max 2 sentences"}
The suggestedDate should be the LAST date of the ideal drinking window (the "drink by" date).
Base the estimate on wine type, grape variety, vintage year, and region. 
If vintage is recent (less than 2 years), add appropriate aging time.
Today's year is ${new Date().getFullYear()}.`,
        },
        {
          role: "user",
          content: `Estimate the drink-until date for this wine: ${wineDescription}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim() ?? "";

    let parsed: { suggestedDate: string; reason: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      req.log.warn({ content }, "Failed to parse drink-until suggestion");
      return res.status(422).json({ error: "Could not generate suggestion" });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(parsed.suggestedDate)) {
      return res.status(422).json({ error: "Invalid date in suggestion" });
    }

    return res.json({
      suggestedDate: parsed.suggestedDate,
      reason: parsed.reason,
    });
  } catch (err) {
    req.log.error({ err }, "OpenAI drink-until suggestion error");
    return res.status(500).json({ error: "Suggestion failed" });
  }
});

export default router;
