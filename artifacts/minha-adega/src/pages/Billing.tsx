import { useEffect, useMemo, useState } from "react";
import { Check, CreditCard, LoaderCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authFetch } from "@/lib/auth";

type BillingPlan = {
  id: "free" | "pro-monthly" | "pro-annual";
  name: string;
  description: string;
  amount: number;
  currency: "BRL";
  interval: "free" | "monthly" | "annual";
  bottlesLimit: number | null;
  features: string[];
};

type BillingPlansResponse = {
  plans: BillingPlan[];
  provider: {
    name: string;
    configured: boolean;
  };
};

const intervalLabel: Record<BillingPlan["interval"], string> = {
  free: "Gratis",
  monthly: "por mes",
  annual: "por ano",
};

export default function Billing() {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [providerConfigured, setProviderConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatter = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      setLoading(true);
      setError(null);
      try {
        const response = await authFetch("/api/billing/plans");
        if (!response.ok) throw new Error("Nao foi possivel carregar os planos");
        const data = (await response.json()) as BillingPlansResponse;
        if (cancelled) return;
        setPlans(data.plans);
        setProviderConfigured(data.provider.configured);
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Falha ao carregar planos");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  async function startCheckout(planId: BillingPlan["id"]) {
    setCheckoutPlanId(planId);
    setError(null);

    try {
      const response = await authFetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel abrir o checkout do Mercado Pago");
      }

      const data = (await response.json()) as { checkoutUrl?: string };
      if (!data.checkoutUrl) throw new Error("Checkout indisponivel");
      window.location.assign(data.checkoutUrl);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Falha ao iniciar checkout");
      setCheckoutPlanId(null);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight">Assinatura</h2>
          <p className="text-muted-foreground mt-1 font-serif italic">
            Planos MyCellar conforme o business plan.
          </p>
        </div>
        <Badge variant={providerConfigured ? "default" : "secondary"} className="w-fit">
          Mercado Pago {providerConfigured ? "configurado" : "pendente"}
        </Badge>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {(loading ? [] : plans).map((plan) => {
          const isPaid = plan.amount > 0;
          const isFeatured = plan.id === "pro-annual";
          const isCheckingOut = checkoutPlanId === plan.id;

          return (
            <Card
              key={plan.id}
              className={`shadow-sm ${isFeatured ? "border-primary" : "border-border"}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="font-serif text-xl">{plan.name}</CardTitle>
                  {isFeatured ? <Badge>Melhor valor</Badge> : null}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="font-serif text-3xl font-bold">
                    {formatter.format(plan.amount)}
                  </div>
                  <div className="text-sm text-muted-foreground">{intervalLabel[plan.interval]}</div>
                </div>

                <div className="space-y-2">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  variant={isPaid ? "default" : "outline"}
                  disabled={!isPaid || !providerConfigured || Boolean(checkoutPlanId)}
                  onClick={() => startCheckout(plan.id)}
                >
                  {isCheckingOut ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  {isPaid ? "Assinar com Mercado Pago" : "Plano atual"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Card key={item} className="h-80 animate-pulse bg-card/70" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

