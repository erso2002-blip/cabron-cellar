import { useState } from "react";
import { Sparkles, Loader2, Utensils, TrendingUp, Thermometer, Wind, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wine } from "@workspace/api-client-react";

interface PriceRange {
  min: number;
  max: number;
  currency: string;
  currencySymbol: string;
  market: string;
}

interface Insights {
  harmonization: Array<{ food: string; note: string }>;
  price: PriceRange;
  priceNote: string;
  servingTemp: string;
  decanting: string;
}

interface Props {
  wine: Wine;
}

function formatPrice(range: PriceRange) {
  const fmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  return `${range.currencySymbol} ${fmt.format(range.min)} – ${range.currencySymbol} ${fmt.format(range.max)}`;
}

const FOOD_EMOJIS: Record<string, string> = {
  carne: "🥩", frango: "🍗", peixe: "🐟", salmão: "🍣", atum: "🐟",
  queijo: "🧀", massa: "🍝", pizza: "🍕", risoto: "🍚", cordeiro: "🍖",
  chocolate: "🍫", sobremesa: "🍮", salada: "🥗", vegetariano: "🥦",
  camarão: "🍤", frutos: "🦞", porco: "🥓", costela: "🍖", pato: "🦆",
  paella: "🥘", tapas: "🫙", charcut: "🥓", aves: "🍗",
};

function getFoodEmoji(food: string): string {
  const lower = food.toLowerCase();
  for (const [key, emoji] of Object.entries(FOOD_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return "🍽️";
}

export function WineInsights({ wine }: Props) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function loadInsights() {
    if (insights) {
      setOpen((o) => !o);
      return;
    }
    setLoading(true);
    setError(null);
    setOpen(true);
    try {
      const resp = await fetch(`/api/wines/${wine.id}/insights`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!resp.ok) throw new Error("Falha ao carregar insights");
      const data = (await resp.json()) as Insights;
      setInsights(data);
    } catch {
      setError("Não foi possível carregar os insights agora. Tente novamente.");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-primary/20 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={loadInsights}
        className="w-full flex items-center justify-between px-5 py-4 bg-primary/5 hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm text-primary">
            Insights do Sommelier
          </span>
          <span className="text-xs text-muted-foreground">
            — harmonização, temperatura e preços
          </span>
        </div>
        {loading ? (
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
        ) : insights ? (
          open ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />
        ) : (
          <span className="text-xs text-primary font-medium border border-primary/30 rounded px-2 py-0.5 hover:bg-primary/10">
            Consultar IA
          </span>
        )}
      </button>

      {error && (
        <div className="px-5 py-3 text-sm text-destructive bg-destructive/5">
          {error}
        </div>
      )}

      {open && insights && (
        <div className="p-5 space-y-6 bg-card">

          {/* Harmonização */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Utensils className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Harmonização
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {insights.harmonization.map((item, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50"
                >
                  <span className="text-xl shrink-0 mt-0.5">{getFoodEmoji(item.food)}</span>
                  <div>
                    <div className="font-medium text-sm leading-tight">{item.food}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preço */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Preço Médio na Origem
              </h4>
            </div>
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
              <div className="text-xs text-primary/70 uppercase tracking-wider mb-1">
                {insights.price.market} · em dólar
              </div>
              <div className="text-xl font-mono font-bold text-primary">
                {formatPrice(insights.price)}
              </div>
              <div className="text-xs text-primary/60 mt-1">
                {insights.price.currency}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 italic">
              * {insights.priceNote}
            </p>
          </div>

          {/* Serviço */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
              <Thermometer className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Temperatura</div>
                <div className="font-medium text-sm">{insights.servingTemp}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
              <Wind className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Decantação</div>
                <div className="font-medium text-sm">{insights.decanting}</div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
