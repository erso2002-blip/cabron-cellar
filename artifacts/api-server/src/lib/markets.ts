export type MarketCode = "BR" | "AR" | "CL";
export type MarketCurrency = "BRL" | "ARS" | "CLP";

export type MarketConfig = {
  code: MarketCode;
  countryName: string;
  locale: string;
  currency: MarketCurrency;
  paymentProvider: "mercado-pago";
};

export const marketConfigs: Record<MarketCode, MarketConfig> = {
  BR: {
    code: "BR",
    countryName: "Brasil",
    locale: "pt-BR",
    currency: "BRL",
    paymentProvider: "mercado-pago",
  },
  AR: {
    code: "AR",
    countryName: "Argentina",
    locale: "es-AR",
    currency: "ARS",
    paymentProvider: "mercado-pago",
  },
  CL: {
    code: "CL",
    countryName: "Chile",
    locale: "es-CL",
    currency: "CLP",
    paymentProvider: "mercado-pago",
  },
};

export function resolveMarket(value: unknown): MarketConfig {
  if (typeof value === "string" && value in marketConfigs) {
    return marketConfigs[value as MarketCode];
  }

  return marketConfigs.BR;
}

export const activeMarket = resolveMarket(process.env.MYCELLAR_MARKET);
