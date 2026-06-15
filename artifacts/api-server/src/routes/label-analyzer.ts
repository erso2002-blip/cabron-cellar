import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface LabelData {
  name: string | null;
  producer: string | null;
  vintage: number | null;
  grape: string | null;
  country: string | null;
  region: string | null;
  alcoholContent: string | null;
}

// POST /wines/analyze-label
router.post("/wines/analyze-label", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { imageBase64, mimeType } = req.body as {
    imageBase64?: string;
    mimeType?: string;
  };

  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: "imageBase64 and mimeType are required" });
  }

  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedMimes.includes(mimeType)) {
    return res.status(400).json({ error: "Unsupported image type" });
  }

  try {
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

Example response:
{"name":"Reserva Malbec","producer":"Catena Zapata","vintage":2019,"grape":"Malbec","country":"Argentina","region":"Mendoza","alcoholContent":"14.5%"}`,
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
    });
  } catch (err) {
    req.log.error({ err }, "OpenAI label analysis error");
    return res.status(500).json({ error: "Label analysis failed" });
  }
});

export default router;
