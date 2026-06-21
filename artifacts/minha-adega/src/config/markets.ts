export type MarketCode = "BR" | "AR" | "CL";
export type MarketCurrency = "BRL" | "ARS" | "CLP";

export type MarketConfig = {
  code: MarketCode;
  countryName: string;
  locale: string;
  currency: MarketCurrency;
};

export const marketConfigs: Record<MarketCode, MarketConfig> = {
  BR: {
    code: "BR",
    countryName: "Brasil",
    locale: "pt-BR",
    currency: "BRL",
  },
  AR: {
    code: "AR",
    countryName: "Argentina",
    locale: "es-AR",
    currency: "ARS",
  },
  CL: {
    code: "CL",
    countryName: "Chile",
    locale: "es-CL",
    currency: "CLP",
  },
};

export function resolveMarket(value: unknown): MarketConfig {
  if (typeof value === "string" && value in marketConfigs) {
    return marketConfigs[value as MarketCode];
  }

  return marketConfigs.BR;
}

export const activeMarket = resolveMarket(import.meta.env.VITE_MYCELLAR_MARKET);
