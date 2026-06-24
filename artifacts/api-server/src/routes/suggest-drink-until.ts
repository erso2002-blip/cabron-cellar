import { Router } from "express";
import { getAuthenticatedUser } from "../lib/auth.js";
import { getOpenAIClient } from "../lib/openai.js";
import { requireProFeature } from "../lib/planAccess.js";
import { rateLimit } from "../middlewares/rateLimit.js";

const router = Router();
const MAX_INPUT_LENGTH = 180;
const PROFILE_SOURCE_TITLE = "Estimativa estável por perfil do vinho";
const CURRENT_YEAR = new Date().getFullYear();

interface DrinkUntilSuggestion {
  suggestedDate: string;
  reason: string;
  sourceUrl: string | null;
  sourceTitle: string | null;
  sourceType:
    | "official_winery"
    | "producer_pdf"
    | "reputable_reference"
    | "profile_estimate";
  confidence: "low" | "medium" | "high";
}

const drinkUntilSuggestionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    suggestedDate: { type: "string" },
    reason: { type: "string" },
    sourceUrl: { type: ["string", "null"] },
    sourceTitle: { type: ["string", "null"] },
    sourceType: {
      type: "string",
      enum: [
        "official_winery",
        "producer_pdf",
        "reputable_reference",
        "profile_estimate",
      ],
    },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
  },
  required: [
    "suggestedDate",
    "reason",
    "sourceUrl",
    "sourceTitle",
    "sourceType",
    "confidence",
  ],
} as const;

function bounded(value: unknown) {
  return typeof value !== "string" || value.length <= MAX_INPUT_LENGTH;
}

function normalizeText(value: unknown) {
  return typeof value === "string"
    ? value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
    : "";
}

function profileAgingYears(input: {
  name?: string;
  producer?: string;
  grape?: string;
  vintage?: number;
  country?: string;
  region?: string;
}) {
  const profile = [
    input.name,
    input.producer,
    input.grape,
    input.country,
    input.region,
  ]
    .map(normalizeText)
    .join(" ");

  const includesAny = (terms: string[]) =>
    terms.some((term) => profile.includes(term));

  if (
    includesAny([
      "porto",
      "port wine",
      "madeira",
      "sauternes",
      "tokaji",
      "vin santo",
    ])
  )
    return 12;
  if (
    includesAny([
      "barolo",
      "barbaresco",
      "brunello",
      "bordeaux",
      "gran reserva",
    ])
  )
    return 10;
  if (
    includesAny([
      "cabernet sauvignon",
      "nebbiolo",
      "tannat",
      "tempranillo",
      "syrah",
      "shiraz",
    ])
  )
    return 8;
  if (
    includesAny([
      "malbec",
      "sangiovese",
      "rioja",
      "priorat",
      "merlot",
      "carmenere",
    ])
  )
    return 6;
  if (
    includesAny([
      "pinot noir",
      "chardonnay",
      "riesling",
      "chenin blanc",
      "reserva",
    ])
  )
    return 5;
  if (
    includesAny([
      "sauvignon blanc",
      "rose",
      "rosado",
      "vinho verde",
      "prosecco",
      "moscato",
      "espumante",
      "sparkling",
    ])
  )
    return 2;

  return input.vintage ? 4 : 2;
}

function stableProfileSuggestion(input: {
  name?: string;
  producer?: string;
  grape?: string;
  vintage?: number;
  country?: string;
  region?: string;
}): DrinkUntilSuggestion {
  const currentYear = new Date().getFullYear();
  const baseYear =
    input.vintage && input.vintage >= 1800 && input.vintage <= currentYear + 1
      ? input.vintage
      : currentYear;
  const suggestedYear = baseYear + profileAgingYears(input);

  return {
    suggestedDate: `${suggestedYear}-12-31`,
    reason:
      "Sem fonte confiável encontrada. Data estimada pelo perfil do vinho, considerando uva, região, safra e estilo.",
    sourceUrl: null,
    sourceTitle: PROFILE_SOURCE_TITLE,
    sourceType: "profile_estimate",
    confidence: "low",
  };
}

function sanitizeSuggestion(
  parsed: DrinkUntilSuggestion,
): DrinkUntilSuggestion | null {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(parsed.suggestedDate)) return null;

  const sourceUrl =
    typeof parsed.sourceUrl === "string" &&
    /^https?:\/\//i.test(parsed.sourceUrl)
      ? parsed.sourceUrl
      : null;

  const sourceTypes = [
    "official_winery",
    "producer_pdf",
    "reputable_reference",
    "profile_estimate",
  ];
  const confidences = ["low", "medium", "high"];

  return {
    suggestedDate: parsed.suggestedDate,
    reason:
      typeof parsed.reason === "string" ? parsed.reason.slice(0, 500) : "",
    sourceUrl,
    sourceTitle:
      typeof parsed.sourceTitle === "string"
        ? parsed.sourceTitle.slice(0, 180)
        : null,
    sourceType: sourceTypes.includes(parsed.sourceType)
      ? parsed.sourceType
      : "profile_estimate",
    confidence: confidences.includes(parsed.confidence)
      ? parsed.confidence
      : "low",
  };
}

function hasReliableSource(suggestion: DrinkUntilSuggestion) {
  return (
    suggestion.sourceType !== "profile_estimate" &&
    suggestion.confidence !== "low" &&
    Boolean(suggestion.sourceUrl)
  );
}

function buildDrinkUntilPrompt(input: {
  wineDescription: string;
  retry?: boolean;
}) {
  const retryInstructions = input.retry
    ? `
This is a second-pass verification because the first pass did not find a strong source.
Before using profile_estimate, broaden the search with variants:
- producer + wine name + vintage + drinking window
- producer + wine name + vintage + aging potential
- producer + wine name + vintage + fiche technique / technical sheet / PDF
- wine name + vintage + drink window / maturity / cellartracker / decanter / wine enthusiast / wine advocate
- Portuguese, English, Italian, French or Spanish equivalents when relevant: guarda, potencial de guarda, consumo ideal, apogee, drink from/to, à boire, boire jusqu'à, finestra di consumo.
Only return profile_estimate if this broader search still does not find a credible direct source.`
    : "";

  return `Research the best "drink by" date for this wine and return a conservative suggestion in Portuguese.

Wine: ${input.wineDescription}
Current year: ${CURRENT_YEAR}
${retryInstructions}

Rules:
- Search the web deeply for this exact wine, producer and vintage before estimating.
- Prioritize the official winery/producer page, technical sheet, PDF, or vintage note.
- If the producer has an official suggested drinking window, maturity window, aging potential, guarda, potencial de guarda, or consumo ideal, use that as the primary basis.
- If no producer source is available, use a reputable wine reference and clearly mark sourceType as "reputable_reference".
- If no reliable source gives a window after the full search, estimate from wine style, grape, vintage, country and region and mark sourceType as "profile_estimate" with confidence "low".
- suggestedDate must be the last day of the ideal drinking window.
- sourceUrl must be the direct source URL used. Do not use search result pages, retailers, marketplaces, Vivino, Wine-Searcher, shops, or social networks as the official winery source.
- reason must mention whether the date came from producer research, reputable reference, or profile estimate. Max 2 short sentences.`;
}

// POST /wines/suggest-drink-until
router.post(
  "/wines/suggest-drink-until",
  rateLimit({ keyPrefix: "drink-ai", windowMs: 60_000, max: 12 }),
  async (req: any, res: any) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const proGate = await requireProFeature(user, "drink_until_suggestion");
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
      return res
        .status(400)
        .json({ error: "Provide at least name, grape or country" });
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

      const requestSuggestion = async (retry = false) => {
        const response = await openai.responses.create({
          model: "gpt-4o-mini",
          max_output_tokens: 900,
          store: false,
          tools: [
            {
              type: "web_search_preview",
              search_context_size: "high",
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "drink_until_suggestion",
              strict: true,
              schema: drinkUntilSuggestionSchema,
            },
          },
          input: [
            {
              role: "user",
              content: buildDrinkUntilPrompt({ wineDescription, retry }),
            },
          ],
        });

        try {
          return sanitizeSuggestion(
            JSON.parse(response.output_text.trim()) as DrinkUntilSuggestion,
          );
        } catch {
          req.log.warn(
            { content: response.output_text, retry },
            "Failed to parse drink-until suggestion",
          );
          return null;
        }
      };

      const firstSuggestion = await requestSuggestion(false);
      const suggestion = hasReliableSource(
        firstSuggestion ?? stableProfileSuggestion({}),
      )
        ? firstSuggestion
        : await requestSuggestion(true);

      if (!suggestion) {
        return res.status(422).json({ error: "Could not generate suggestion" });
      }

      return res.json(
        hasReliableSource(suggestion)
          ? suggestion
          : stableProfileSuggestion({ name, producer, grape, vintage, country, region }),
      );
    } catch (err) {
      req.log.error({ err }, "OpenAI drink-until suggestion error");
      return res.status(500).json({ error: "Suggestion failed" });
    }
  },
);

export default router;
