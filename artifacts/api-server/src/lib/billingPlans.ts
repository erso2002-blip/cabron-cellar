import { activeMarket, type MarketCurrency } from "./markets.js";

export type BillingPlanId = "free" | "pro-monthly" | "pro-annual";

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  description: string;
  amount: number;
  originalAmount?: number;
  promotionLabel?: string;
  currency: MarketCurrency;
  interval: "free" | "monthly" | "annual";
  bottlesLimit: number | null;
  features: string[];
};

export const billingPlans: BillingPlan[] = [
  {
    id: "free",
    name: "Gratuito",
    description: "Entrada para organizar uma adega pequena.",
    amount: 0,
    currency: activeMarket.currency,
    interval: "free",
    bottlesLimit: 30,
    features: [
      "Até 30 garrafas presentes na adega",
      "Leitura de rótulo por IA",
      "Cadastro manual",
      "Histórico básico",
    ],
  },
  {
    id: "pro-monthly",
    name: "Pro mensal",
    description: "Plano completo com flexibilidade mensal em promoção de lançamento.",
    amount: 25.45,
    originalAmount: 49.9,
    promotionLabel: "Promoção de lançamento",
    currency: activeMarket.currency,
    interval: "monthly",
    bottlesLimit: null,
    features: [
      "Garrafas ilimitadas",
      "Fotos ilimitadas",
      "Importação assistida de adega",
      "Harmonização de pratos",
      "Sugestão de data ideal de consumo",
      "Histórico e backup",
    ],
  },
  {
    id: "pro-annual",
    name: "Pro anual",
    description: "Plano completo anual com preço especial de lançamento.",
    amount: 254.5,
    originalAmount: 499,
    promotionLabel: "Promoção de lançamento",
    currency: activeMarket.currency,
    interval: "annual",
    bottlesLimit: null,
    features: [
      "Garrafas ilimitadas",
      "Fotos ilimitadas",
      "Importação assistida de adega",
      "Harmonização de pratos",
      "Sugestão de data ideal de consumo",
      "Histórico e backup",
      "Economia em relação ao mensal",
    ],
  },
];

export function getBillingPlan(planId: unknown) {
  return billingPlans.find((plan) => plan.id === planId) ?? null;
}
