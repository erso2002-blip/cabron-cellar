import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  useGetWine,
  getGetWineQueryKey,
  useDeleteWine,
  useUpdateWine,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageSkeleton } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Wine,
  MapPin,
  Calendar,
  DollarSign,
  Thermometer,
  Tag,
  Clock,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ConsumeModal } from "@/components/ConsumeModal";
import { WineInsights } from "@/components/WineInsights";
import { authFetch } from "@/lib/auth";
import { normalizeWebsiteUrl, websiteHostname } from "@/lib/url";
import { formatCurrency, formatDate } from "@/lib/formatters";

const sourceTypeLabels = {
  official_winery: "Fonte oficial",
  producer_pdf: "Ficha técnica",
  reputable_reference: "Referência externa",
  profile_estimate: "Sem fonte oficial encontrada · estimativa aproximada",
} as const;

const confidenceLabels = {
  low: "baixa",
  medium: "média",
  high: "alta",
} as const;

function sourceTypeLabel(value: string | null | undefined) {
  return value && value in sourceTypeLabels
    ? sourceTypeLabels[value as keyof typeof sourceTypeLabels]
    : null;
}

function confidenceLabel(value: string | null | undefined) {
  return value && value in confidenceLabels
    ? confidenceLabels[value as keyof typeof confidenceLabels]
    : null;
}

interface DrinkUntilSuggestion {
  suggestedDate: string;
  reason: string;
  sourceUrl: string | null;
  sourceTitle: string | null;
  sourceType:
    | "official_winery"
    | "producer_pdf"
    | "reputable_reference"
    | "profile_estimate";
  confidence: "low" | "medium" | "high";
}

export default function WineDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const wineId = parseInt(params.id || "0");
  const [isSuggestingDrinkUntil, setIsSuggestingDrinkUntil] = useState(false);

  const { data: wine, isLoading } = useGetWine(wineId, {
    query: {
      enabled: !!wineId,
      queryKey: getGetWineQueryKey(wineId),
    },
  });

  const deleteMutation = useDeleteWine();
  const updateMutation = useUpdateWine();

  const handleDelete = () => {
    deleteMutation.mutate(
      { id: wineId },
      {
        onSuccess: () => {
          toast.success("Vinho removido da adega.");
          queryClient.invalidateQueries({ queryKey: ["/api/wines"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
          setLocation("/wines");
        },
        onError: () => {
          toast.error("Erro ao remover o vinho.");
        },
      },
    );
  };

  async function handleSuggestDrinkUntil() {
    if (!wine) return;
    if (!wine.name && !wine.grape && !wine.country) {
      toast.warning("Faltam dados do vinho para sugerir a melhor data.");
      return;
    }

    setIsSuggestingDrinkUntil(true);
    try {
      const resp = await authFetch("/api/wines/suggest-drink-until", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: wine.name || undefined,
          producer: wine.producer || undefined,
          grape: wine.grape || undefined,
          vintage: wine.vintage || undefined,
          country: wine.country || undefined,
          region: wine.region || undefined,
        }),
      });

      if (resp.status === 402) {
        throw new Error(
          "Sugestão de data ideal de consumo está disponível no plano Pro.",
        );
      }
      if (!resp.ok) throw new Error("Falha na sugestão");

      const suggestion = (await resp.json()) as DrinkUntilSuggestion;
      await updateMutation.mutateAsync({
        id: wine.id,
        data: {
          drinkUntil: suggestion.suggestedDate,
          drinkUntilSourceUrl: suggestion.sourceUrl || undefined,
          drinkUntilSourceTitle: suggestion.sourceTitle || undefined,
          drinkUntilSourceType: suggestion.sourceType,
          drinkUntilConfidence: suggestion.confidence,
          drinkUntilReason: suggestion.reason || undefined,
        },
      });

      await queryClient.invalidateQueries({
        queryKey: getGetWineQueryKey(wine.id),
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/wines"] });
      await queryClient.invalidateQueries({
        queryKey: ["/api/dashboard/stats"],
      });
      toast.success("Melhor data aplicada à ficha.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível buscar a melhor data agora",
      );
    } finally {
      setIsSuggestingDrinkUntil(false);
    }
  }

  if (isLoading) return <PageSkeleton />;
  if (!wine) return <div>Vinho não encontrado</div>;

  const wineryWebsiteUrl = normalizeWebsiteUrl(wine.wineryWebsiteUrl);
  const drinkUntilSourceLabel = sourceTypeLabel(wine.drinkUntilSourceType);
  const drinkUntilConfidenceLabel = confidenceLabel(wine.drinkUntilConfidence);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <Link href="/wines">
          <Button
            variant="ghost"
            size="sm"
            className="pl-0 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Adega
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/wines/${wine.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover vinho?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O vinho será removido do seu
                  acervo. Se você consumiu esta garrafa, use a opção "Consumir"
                  em vez disso.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 lg:col-span-3 space-y-4">
          <div className="bg-secondary rounded-xl aspect-[3/4] flex items-center justify-center overflow-hidden border border-border shadow-md relative">
            {wine.labelPhotoUrl ? (
              <img
                src={wine.labelPhotoUrl}
                alt={wine.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 flex flex-col items-center opacity-50">
                <Wine className="w-16 h-16 mb-4 text-muted-foreground" />
                <span className="text-sm font-serif italic text-muted-foreground">
                  Sem foto do rótulo
                </span>
              </div>
            )}
          </div>

          <ConsumeModal wine={wine} />

          {wine.additionalPhotoUrl && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Foto adicional
              </h3>
              <div className="bg-secondary rounded-lg aspect-[4/3] flex items-center justify-center overflow-hidden border border-border shadow-sm">
                <img
                  src={wine.additionalPhotoUrl}
                  alt={`Foto adicional de ${wine.name}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-8 lg:col-span-9 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono bg-primary/10 text-primary px-3 py-1 rounded text-sm font-bold border border-primary/20">
                {wine.quantity} GARRAFAS
              </span>
              {wine.vintage && (
                <span className="font-mono bg-secondary px-3 py-1 rounded text-sm">
                  {wine.vintage}
                </span>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-foreground leading-tight mb-2">
              {wine.name}
            </h1>
            <p className="text-xl text-muted-foreground font-serif italic">
              {wine.producer}
            </p>
            {wineryWebsiteUrl && (
              <a
                href={wineryWebsiteUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
              >
                Site da vinícola
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-6 border-y border-border/50">
            {wine.country && (
              <div className="space-y-1">
                <div className="flex items-center text-muted-foreground text-sm gap-1.5 mb-1 uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5" /> Origem
                </div>
                <div className="font-medium">
                  {wine.region ? `${wine.region}, ` : ""}
                  {wine.country}
                </div>
              </div>
            )}

            {wine.grape && (
              <div className="space-y-1">
                <div className="flex items-center text-muted-foreground text-sm gap-1.5 mb-1 uppercase tracking-wider">
                  <Tag className="w-3.5 h-3.5" /> Uva(s)
                </div>
                <div className="font-medium">{wine.grape}</div>
              </div>
            )}

            {wine.pricePaid !== null && wine.pricePaid !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center text-muted-foreground text-sm gap-1.5 mb-1 uppercase tracking-wider">
                  <DollarSign className="w-3.5 h-3.5" /> Preço Pago
                </div>
                <div className="font-medium">
                  {formatCurrency(wine.pricePaid)}
                </div>
              </div>
            )}

            {(() => {
              const location =
                [wine.locationPlace, wine.cellarName, wine.shelf]
                  .filter(Boolean)
                  .join(" · ") || wine.cellarLocation;
              return location ? (
                <div className="space-y-1">
                  <div className="flex items-center text-muted-foreground text-sm gap-1.5 mb-1 uppercase tracking-wider">
                    <Thermometer className="w-3.5 h-3.5" /> Localização
                  </div>
                  <div className="font-medium font-mono bg-secondary/50 px-2 py-0.5 rounded inline-block">
                    {location}
                  </div>
                </div>
              ) : null;
            })()}

            {wine.drinkUntil && (
              <div className="space-y-1">
                <div className="flex items-center text-muted-foreground text-sm gap-1.5 mb-1 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" /> Beber até
                </div>
                <div className="font-medium">{formatDate(wine.drinkUntil)}</div>
                {(wine.drinkUntilReason ||
                  drinkUntilSourceLabel ||
                  drinkUntilConfidenceLabel ||
                  wine.drinkUntilSourceUrl) && (
                  <div className="text-xs text-muted-foreground leading-snug space-y-1">
                    {wine.drinkUntilReason && (
                      <div>{wine.drinkUntilReason}</div>
                    )}
                    {wine.drinkUntilSourceType !== "profile_estimate" &&
                      (drinkUntilSourceLabel || drinkUntilConfidenceLabel) && (
                        <div>
                          {[
                            drinkUntilSourceLabel,
                            drinkUntilConfidenceLabel
                              ? `confiança ${drinkUntilConfidenceLabel}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      )}
                      {wine.drinkUntilSourceUrl && (
                        <a
                          href={wine.drinkUntilSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                        >
                          {websiteHostname(wine.drinkUntilSourceUrl) ||
                            "Ver fonte"}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                  </div>
                )}
              </div>
            )}

            {!wine.drinkUntil && (
              <div className="space-y-2">
                <div className="flex items-center text-muted-foreground text-sm gap-1.5 mb-1 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" /> Melhor data
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSuggestDrinkUntil}
                  disabled={isSuggestingDrinkUntil}
                  className="h-9"
                >
                  {isSuggestingDrinkUntil ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {isSuggestingDrinkUntil
                    ? "Consultando..."
                    : "Buscar melhor data"}
                </Button>
              </div>
            )}
          </div>

          {wine.notes && (
            <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                Notas Pessoais
              </h3>
              <p className="whitespace-pre-wrap font-serif leading-relaxed text-foreground/90">
                {wine.notes}
              </p>
            </div>
          )}

          <WineInsights wine={wine} />
        </div>
      </div>
    </div>
  );
}
