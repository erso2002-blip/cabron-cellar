import { Router } from "express";
import OpenAI from "openai";
import { db } from "@workspace/db";
import { winesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Symbol per ISO currency code. Disambiguated symbols (US$, AR$, CLP$) avoid the
// "$ means USD" confusion.
const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "US$",
  BRL: "R$",
  ARS: "AR$",
  CLP: "CLP$",
  AUD: "A$",
  NZD: "NZ$",
  ZAR: "R",
  GBP: "£",
  CHF: "CHF",
  HUF: "Ft",
  CAD: "C$",
  CNY: "¥",
  JPY: "¥",
  MXN: "MX$",
  UYU: "$U",
  GEL: "₾",
};

// Maps a wine's country of origin (Portuguese, English, or native spelling) to
// its local currency. Resolved deterministically on the server instead of
// trusting the model, which frequently picked the wrong origin currency.
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // Eurozone wine countries
  franca: "EUR",
  france: "EUR",
  italia: "EUR",
  italy: "EUR",
  italie: "EUR",
  espanha: "EUR",
  spain: "EUR",
  espana: "EUR",
  portugal: "EUR",
  alemanha: "EUR",
  germany: "EUR",
  deutschland: "EUR",
  austria: "EUR",
  grecia: "EUR",
  greece: "EUR",
  holanda: "EUR",
  "paises baixos": "EUR",
  netherlands: "EUR",
  belgica: "EUR",
  belgium: "EUR",
  luxemburgo: "EUR",
  irlanda: "EUR",
  ireland: "EUR",
  // Americas
  argentina: "ARS",
  chile: "CLP",
  "estados unidos": "USD",
  eua: "USD",
  usa: "USD",
  "united states": "USD",
  uruguai: "UYU",
  uruguay: "UYU",
  canada: "CAD",
  mexico: "MXN",
  brasil: "BRL",
  brazil: "BRL",
  // Oceania
  australia: "AUD",
  "nova zelandia": "NZD",
  "new zealand": "NZD",
  // Rest of the world
  "africa do sul": "ZAR",
  "south africa": "ZAR",
  "reino unido": "GBP",
  inglaterra: "GBP",
  "united kingdom": "GBP",
  uk: "GBP",
  suica: "CHF",
  switzerland: "CHF",
  hungria: "HUF",
  hungary: "HUF",
  china: "CNY",
  japao: "JPY",
  japan: "JPY",
  georgia: "GEL",
};

function normalizeCountry(country: string): string {
  return country
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Resolve the origin country's currency + symbol. Returns null when the country
// is missing or unknown, so the model can fall back to choosing the currency.
function resolveOriginCurrency(
  country: string | null | undefined,
): { currency: string; symbol: string } | null {
  if (!country) return null;
  const currency = COUNTRY_TO_CURRENCY[normalizeCountry(country)];
  if (!currency) return null;
  return { currency, symbol: CURRENCY_SYMBOLS[currency] ?? currency };
}

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

  const origin = resolveOriginCurrency(wine.country);

  const priceInstruction = origin
    ? `This wine is produced in ${wine.country}. For "priceOrigin", give the realistic RETAIL price range as sold IN ${wine.country}, expressed strictly in ${origin.currency} (${origin.symbol}); set "currency" to "${origin.currency}". For "priceUsd", give the same wine's approximate retail price range in US dollars.`
    : `For "priceOrigin", give the realistic retail price range in the wine's country of origin in that country's local currency (set "currency" to the correct ISO code). For "priceUsd", give the same wine's approximate retail price range in US dollars.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a master sommelier with deep knowledge of regional wine retail prices. Given wine details, return ONLY a JSON object (no markdown).

Format:
{
  "harmonization": [
    { "food": "Food name in Portuguese", "note": "1-sentence pairing reason in Portuguese" }
  ],
  "priceOrigin": {
    "min": <number>,
    "max": <number>,
    "currency": "<ISO currency code of origin country>"
  },
  "priceUsd": {
    "min": <number>,
    "max": <number>
  },
  "priceNote": "<1 sentence in Portuguese explaining price range factors>",
  "servingTemp": "<e.g. 16–18°C>",
  "decanting": "<e.g. '30 minutos' or 'Não necessário'>"
}

Pricing rules (IMPORTANT):
${priceInstruction}
- Base prices on the wine's quality tier, producer reputation, and vintage.
- "min" and "max" are the realistic low/high retail estimate; min < max.

Other rules:
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
    let parsed: ModelResponse;
    try {
      parsed = JSON.parse(content) as ModelResponse;
    } catch {
      req.log.warn({ content }, "Failed to parse wine insights");
      return res.status(422).json({ error: "Could not generate insights" });
    }

    // Determine the origin currency: prefer the deterministic resolution, fall
    // back to whatever the model labeled it.
    const originCurrency = (
      origin?.currency ??
      parsed.priceOrigin?.currency ??
      ""
    )
      .trim()
      .toUpperCase();

    // Compute the single market price: the origin price converted to USD.
    let priceUsd = normalizeRange(parsed.priceUsd);
    if (parsed.priceOrigin) {
      const localRange = normalizeRange(parsed.priceOrigin);
      if (localRange) {
        if (originCurrency === "USD") {
          priceUsd = localRange;
        } else if (/^[A-Z]{3}$/.test(originCurrency)) {
          const rate = await getExchangeRate(originCurrency, "USD", req);
          if (rate) {
            priceUsd = {
              min: Math.round(localRange.min * rate),
              max: Math.round(localRange.max * rate),
            };
          }
        }
      }
    }

    if (!priceUsd) {
      req.log.warn({ content }, "No usable price in wine insights");
      return res.status(422).json({ error: "Could not estimate price" });
    }

    const result: WineInsights = {
      harmonization: Array.isArray(parsed.harmonization)
        ? parsed.harmonization
        : [],
      price: {
        min: priceUsd.min,
        max: priceUsd.max,
        currency: "USD",
        currencySymbol: "US$",
        market: wine.country || "Origem",
      },
      priceNote: parsed.priceNote ?? "",
      servingTemp: parsed.servingTemp ?? "",
      decanting: parsed.decanting ?? "",
    };

    return res.json(result);
  } catch (err) {
    req.log.error({ err }, "OpenAI wine insights error");
    return res.status(500).json({ error: "Insights generation failed" });
  }
});

// Coerces a raw {min,max} into a sane ascending numeric range, or null.
function normalizeRange(
  range: { min?: unknown; max?: unknown } | null | undefined,
): { min: number; max: number } | null {
  if (!range) return null;
  const min = Number(range.min);
  const max = Number(range.max);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return min <= max ? { min, max } : { min: max, max: min };
}

// Fetch current FX rate between two ISO currencies (free API, no key required).
async function getExchangeRate(
  from: string,
  to: string,
  req: { log: { warn: (obj: unknown, msg?: string) => void } },
): Promise<number | null> {
  const code = (from ?? "").trim().toUpperCase();
  const target = (to ?? "").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code) || !/^[A-Z]{3}$/.test(target)) return null;
  if (code === target) return 1;
  try {
    const resp = await fetch(`https://open.er-api.com/v6/latest/${code}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as {
      result?: string;
      rates?: Record<string, number>;
    };
    const rate = data?.rates?.[target];
    return data.result === "success" && typeof rate === "number" ? rate : null;
  } catch (err) {
    req.log.warn({ err, from: code, to: target }, "FX rate fetch failed");
    return null;
  }
}

interface ModelResponse {
  harmonization?: Array<{ food: string; note: string }>;
  priceOrigin?: { min?: unknown; max?: unknown; currency?: string } | null;
  priceUsd?: { min?: unknown; max?: unknown } | null;
  priceNote?: string;
  servingTemp?: string;
  decanting?: string;
}

interface WineInsights {
  harmonization: Array<{ food: string; note: string }>;
  price: {
    min: number;
    max: number;
    currency: string;
    currencySymbol: string;
    market: string;
  };
  priceNote: string;
  servingTemp: string;
  decanting: string;
}

export default router;
