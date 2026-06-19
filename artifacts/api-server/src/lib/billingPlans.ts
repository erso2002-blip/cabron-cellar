export type BillingPlanId = "free" | "pro-monthly" | "pro-annual";

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  description: string;
  amount: number;
  originalAmount?: number;
  promotionLabel?: string;
  currency: "BRL";
  interval: "free" | "monthly" | "annual";
  bottlesLimit: number | null;
  features: string[];
};

export const billingPlans: BillingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Entrada para organizar uma adega pequena.",
    amount: 0,
    currency: "BRL",
    interval: "free",
    bottlesLimit: 30,
    features: [
      "Ate 30 garrafas presentes na adega",
      "Leitura de rotulo por IA",
      "Cadastro manual",
      "Historico basico",
    ],
  },
  {
    id: "pro-monthly",
    name: "Pro Mensal",
    description: "Plano completo com flexibilidade mensal em promocao de lancamento.",
    amount: 25.45,
    originalAmount: 49.9,
    promotionLabel: "Promocao de lancamento",
    currency: "BRL",
    interval: "monthly",
    bottlesLimit: null,
    features: [
      "Garrafas ilimitadas",
      "Fotos ilimitadas",
      "Harmonizacao de pratos",
      "Sugestao de data ideal de consumo",
      "Historico e backup",
    ],
  },
  {
    id: "pro-annual",
    name: "Pro Anual",
    description: "Plano completo anual com preco especial de lancamento.",
    amount: 254.5,
    originalAmount: 499,
    promotionLabel: "Promocao de lancamento",
    currency: "BRL",
    interval: "annual",
    bottlesLimit: null,
    features: [
      "Garrafas ilimitadas",
      "Fotos ilimitadas",
      "Harmonizacao de pratos",
      "Sugestao de data ideal de consumo",
      "Historico e backup",
      "Economia vs. mensal",
    ],
  },
];

export function getBillingPlan(planId: unknown) {
  return billingPlans.find((plan) => plan.id === planId) ?? null;
}
