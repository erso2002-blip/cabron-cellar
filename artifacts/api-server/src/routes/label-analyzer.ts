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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 500,
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

Example response:
{"name":"Reserva Malbec","producer":"Catena Zapata","vintage":2019,"grape":"Malbec","country":"Argentina","region":"Mendoza","alcoholContent":"14.5%","wineryWebsiteUrl":"https://catenazapata.com"}`,
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

    const content = response.choices[0]?.message?.content?.trim() ?? "";

    let parsed: LabelData;
    try {
      parsed = JSON.parse(content);
    } catch {
      req.log.warn({ content }, "Failed to parse GPT response as JSON");
      return res.status(422).json({ error: "Could not extract label data from image" });
    }

    return res.json({
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
    });
  } catch (err) {
    req.log.error({ err }, "OpenAI label analysis error");
    return res.status(500).json({ error: "Label analysis failed" });
  }
});

export default router;
