import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authFetch, useAuth } from "@/lib/auth";

type BillingPlan = {
  id: "free" | "pro-monthly" | "pro-annual";
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
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [providerConfigured, setProviderConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
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

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Button
              className="mb-4 px-0"
              onClick={() => setLocation(user ? "/" : "/waitlist")}
              variant="link"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h2 className="text-3xl font-serif font-bold tracking-tight">Assinatura</h2>
            <p className="text-muted-foreground mt-1 font-serif italic">
              Promocao de lancamento por tempo limitado.
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
                  {plan.promotionLabel && plan.originalAmount ? (
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{plan.promotionLabel}</Badge>
                      <span className="text-sm text-muted-foreground line-through">
                        De {formatter.format(plan.originalAmount)}
                      </span>
                    </div>
                  ) : null}
                  <div className="font-serif text-3xl font-bold">
                    {isPaid && plan.originalAmount ? "Por " : ""}
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
                  disabled
                >
                  {isPaid ? <Clock className="mr-2 h-4 w-4" /> : null}
                  {isPaid ? "Em breve" : "Plano atual"}
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
    </main>
  );
}
