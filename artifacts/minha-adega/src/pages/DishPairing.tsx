import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { ChefHat, Loader2, Sparkles, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { authFetch } from "@/lib/auth";

type DishPairingRecommendation = {
  wineId: number;
  wineName: string;
  producer: string | null;
  vintage: number | null;
  country: string | null;
  region: string | null;
  grape: string | null;
  reason: string;
  servingNote: string;
};

type DishPairingResponse = {
  dish: string;
  recommendations: DishPairingRecommendation[];
};

function wineMeta(recommendation: DishPairingRecommendation) {
  return [
    recommendation.producer,
    recommendation.vintage,
    recommendation.grape,
    recommendation.region,
    recommendation.country,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function DishPairing() {
  const [dish, setDish] = useState("");
  const [result, setResult] = useState<DishPairingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedDish = dish.trim();
    if (trimmedDish.length < 2) {
      setError("Informe um prato ou tipo de comida.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await authFetch("/api/pairings/dish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dish: trimmedDish }),
      });

      if (response.status === 409) {
        throw new Error("Sua adega ainda não tem garrafas disponíveis para harmonizar.");
      }
      if (response.status === 402) {
        throw new Error("Harmonização de pratos está disponível no plano Pro.");
      }
      if (!response.ok) {
        throw new Error("Não foi possível gerar a harmonização agora.");
      }

      const data = (await response.json()) as DishPairingResponse;
      setResult(data);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Não foi possível gerar a harmonização agora.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight">Harmonizar Prato</h2>
          <p className="mt-1 font-serif italic text-muted-foreground">
            Escolha entre os vinhos que já estão na sua adega.
          </p>
        </div>
        <Link href="/wines">
          <Button variant="outline" className="shrink-0">
            <Wine className="mr-2 h-4 w-4" />
            Ver adega
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-xl">
            <ChefHat className="h-5 w-5 text-primary" />
            Prato ou cozinha
          </CardTitle>
          <CardDescription>
            Ex.: risoto de funghi, churrasco, massa ao molho vermelho, comida japonesa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={dish}
              onChange={(event) => setDish(event.target.value)}
              placeholder="O que vai ser servido?"
              className="min-h-28 resize-none bg-background"
              maxLength={160}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {error ? <p className="text-sm text-destructive">{error}</p> : <span />}
              <Button type="submit" disabled={loading} className="sm:w-auto">
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Sugerir 3 vinhos
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {result ? (
        <div className="space-y-4">
          <div>
            <h3 className="font-serif text-2xl font-bold">Melhores opções</h3>
            <p className="text-sm text-muted-foreground">Para: {result.dish}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {result.recommendations.map((recommendation, index) => (
              <Card key={recommendation.wineId} className="shadow-sm">
                <CardHeader>
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <CardTitle className="font-serif text-xl leading-tight">
                    {recommendation.wineName}
                  </CardTitle>
                  <CardDescription>{wineMeta(recommendation)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed">{recommendation.reason}</p>
                  {recommendation.servingNote ? (
                    <p className="rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
                      {recommendation.servingNote}
                    </p>
                  ) : null}
                  <Link href={`/wines/${recommendation.wineId}`}>
                    <Button variant="outline" className="w-full">
                      Ver vinho
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
