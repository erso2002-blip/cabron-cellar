import { Router } from "express";
import { getAuthenticatedUser } from "../lib/auth.js";
import { getOpenAIClient } from "../lib/openai.js";
import { rateLimit } from "../middlewares/rateLimit.js";

const router = Router();
const MAX_IMAGE_BASE64_LENGTH = 6_500_000;

interface LabelData {
  name: string | null;
  producer: string | null;
  vintage: number | null;
  grape: string | null;
  country: string | null;
  region: string | null;
  alcoholContent: string | null;
  wineryWebsiteUrl: string | null;
  confidence?: "low" | "medium" | "high" | null;
  enrichmentSources?: string[] | null;
}

const labelDataSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: ["string", "null"] },
    producer: { type: ["string", "null"] },
    vintage: { type: ["number", "null"] },
    grape: { type: ["string", "null"] },
    country: { type: ["string", "null"] },
    region: { type: ["string", "null"] },
    alcoholContent: { type: ["string", "null"] },
    wineryWebsiteUrl: { type: ["string", "null"] },
    confidence: { type: ["string", "null"], enum: ["low", "medium", "high", null] },
    enrichmentSources: {
      type: ["array", "null"],
      items: { type: "string" },
      maxItems: 5,
    },
  },
  required: [
    "name",
    "producer",
    "vintage",
    "grape",
    "country",
    "region",
    "alcoholContent",
    "wineryWebsiteUrl",
    "confidence",
    "enrichmentSources",
  ],
} as const;

function sanitizeLabelData(parsed: LabelData) {
  return {
    name: parsed.name ?? null,
    producer: parsed.producer ?? null,
    vintage: typeof parsed.vintage === "number" ? parsed.vintage : null,
    grape: parsed.grape ?? null,
    country: parsed.country ?? null,
    region: parsed.region ?? null,
    alcoholContent: parsed.alcoholContent ?? null,
    wineryWebsiteUrl:
      typeof parsed.wineryWebsiteUrl === "string" && /^https?:\/\//i.test(parsed.wineryWebsiteUrl)
        ? parsed.wineryWebsiteUrl
        : null,
    confidence: parsed.confidence ?? null,
    enrichmentSources: Array.isArray(parsed.enrichmentSources)
      ? parsed.enrichmentSources.filter((source) => typeof source === "string").slice(0, 5)
      : [],
  };
}

async function analyzeLabelWithWebSearch(openai: NonNullable<ReturnType<typeof getOpenAIClient>>, imageBase64: string, mimeType: string) {
  const response = await openai.responses.create({
    model: "gpt-4o",
    max_output_tokens: 900,
    store: false,
    tools: [
      {
        type: "web_search_preview",
        search_context_size: "medium",
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "wine_label_data",
        strict: true,
        schema: labelDataSchema,
      },
    },
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Analyze this wine bottle label image and extract the wine record.

Use the web search tool when the label image is incomplete, ambiguous, partially hidden, or does not clearly show producer, region, grape, official website, or other common ficha fields.

Return only conservative, high-confidence data:
- Prefer official producer/winery sources for producer, website, region, country, grape, and label identity.
- Use reputable public wine references only to complement fields when official pages are unavailable.
- wineryWebsiteUrl must be the producer's official website URL only.
- Never return a retailer, marketplace, importer, distributor, review app, social network, tourism listing, Vivino, Wine-Searcher, Delectable, Total Wine, wine shop, or shopping URL as wineryWebsiteUrl.
- If a field is uncertain, return null.
- confidence is low, medium, or high for the overall record.
- enrichmentSources should list short source URLs used for enrichment, excluding search result pages.`,
          },
          {
            type: "input_image",
            image_url: `data:${mimeType};base64,${imageBase64}`,
            detail: "high",
          },
        ],
      },
    ],
  });

  return JSON.parse(response.output_text.trim()) as LabelData;
}

async function analyzeLabelFromImageOnly(openai: NonNullable<ReturnType<typeof getOpenAIClient>>, imageBase64: string, mimeType: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 500,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this wine bottle label image and extract the following information. 
Respond ONLY with a JSON object — no markdown, no explanation.
If a field cannot be identified, use null.

Fields:
- name: wine name (string or null)
- producer: winery/producer name (string or null)
- vintage: harvest year as integer (number or null)
- grape: grape variety or varieties, comma-separated (string or null)
- country: country of origin (string or null)
- region: wine region/appellation (string or null)
- alcoholContent: alcohol percentage e.g. "13.5%" (string or null)
- wineryWebsiteUrl: official winery/producer website URL (string or null). Use only the producer's official website domain. Never return a retailer, marketplace, importer, review site, tourism listing, social network, or shopping URL. If you are not confident it is official, return null.
- confidence: low, medium, or high
- enrichmentSources: []

Example response:
{"name":"Reserva Malbec","producer":"Catena Zapata","vintage":2019,"grape":"Malbec","country":"Argentina","region":"Mendoza","alcoholContent":"14.5%","wineryWebsiteUrl":"https://catenazapata.com","confidence":"high","enrichmentSources":[]}`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
              detail: "high",
            },
          },
        ],
      },
    ],
  });

  return JSON.parse(response.choices[0]?.message?.content?.trim() ?? "") as LabelData;
}

// POST /wines/analyze-label
router.post("/wines/analyze-label", rateLimit({ keyPrefix: "label-ai", windowMs: 60_000, max: 8 }), async (req: any, res: any) => {
  if (!getAuthenticatedUser(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { imageBase64, mimeType } = req.body as {
    imageBase64?: string;
    mimeType?: string;
  };

  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: "imageBase64 and mimeType are required" });
  }

  if (imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
    return res.status(413).json({ error: "Image is too large" });
  }

  const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedMimes.includes(mimeType)) {
    return res.status(400).json({ error: "Unsupported image type" });
  }

  try {
    const openai = getOpenAIClient();
    if (!openai) {
      return res.status(503).json({ error: "AI service is not configured" });
    }

    let parsed: LabelData;
    try {
      parsed = await analyzeLabelWithWebSearch(openai, imageBase64, mimeType);
    } catch {
      try {
        parsed = await analyzeLabelFromImageOnly(openai, imageBase64, mimeType);
      } catch (fallbackErr) {
        req.log.warn({ fallbackErr }, "Failed to extract label data");
        return res.status(422).json({ error: "Could not extract label data from image" });
      }
    }

    return res.json(sanitizeLabelData(parsed));
  } catch (err) {
    req.log.error({ err }, "OpenAI label analysis error");
    return res.status(500).json({ error: "Label analysis failed" });
  }
});

export default router;
