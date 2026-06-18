export type BillingPlanId = "free" | "pro-monthly" | "pro-annual";

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  description: string;
  amount: number;
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
    features: ["Ate 30 garrafas", "Cadastro manual", "Historico basico"],
  },
  {
    id: "pro-monthly",
    name: "Pro Mensal",
    description: "Plano completo com flexibilidade mensal.",
    amount: 29,
    currency: "BRL",
    interval: "monthly",
    bottlesLimit: null,
    features: [
      "Garrafas ilimitadas",
      "Fotos ilimitadas",
      "IA, analise e recomendacao",
      "Historico e backup",
    ],
  },
  {
    id: "pro-annual",
    name: "Pro Anual",
    description: "Plano completo anual com desconto de fundador.",
    amount: 290,
    currency: "BRL",
    interval: "annual",
    bottlesLimit: null,
    features: [
      "Garrafas ilimitadas",
      "Fotos ilimitadas",
      "IA, analise e recomendacao",
      "Historico e backup",
      "Economia vs. mensal",
    ],
  },
];

export function getBillingPlan(planId: unknown) {
  return billingPlans.find((plan) => plan.id === planId) ?? null;
}

