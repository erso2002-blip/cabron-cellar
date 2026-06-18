import { useListConsumption } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/loading";
import { normalizeWebsiteUrl } from "@/lib/url";
import { GlassWater, Calendar, Star, MessageSquare, RotateCcw, ExternalLink, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authFetch } from "@/lib/auth";
import { toast } from "sonner";

function Detail({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground break-words">{value}</div>
    </div>
  );
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export default function History() {
  const { data: history, isLoading } = useListConsumption({ limit: 50 });
  const queryClient = useQueryClient();
  const valueFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  async function restoreConsumption(id: number) {
    try {
      const resp = await authFetch(`/api/consumption/${id}/restore`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!resp.ok) throw new Error("Restore failed");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/consumption"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/wines"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] }),
      ]);

      toast.success("Garrafa voltou para a adega.");
    } catch {
      toast.error("Não foi possível desfazer este consumo.");
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight">Histórico de Consumo</h2>
        <p className="text-muted-foreground mt-1 font-serif italic">Os vinhos que você já abriu.</p>
      </div>

      {isLoading ? (
        <PageSkeleton />
      ) : !history?.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border rounded-xl bg-card">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            <GlassWater className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-serif font-bold text-foreground">Nenhum vinho consumido</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
            Você ainda não registrou nenhum consumo. Abra uma garrafa especial e registre-a aqui para criar seu diário de degustações.
          </p>
        </div>
      ) : (
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {history.map((record) => (
            <div key={record.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-secondary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-primary">
                <GlassWater className="w-4 h-4" />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Card
                    role="button"
                    tabIndex={0}
                    className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {record.labelPhotoUrl && (
                          <div className="h-24 w-16 shrink-0 overflow-hidden rounded-md border bg-secondary">
                            <img src={record.labelPhotoUrl} alt={record.wineName || "Rótulo"} className="h-full w-full object-cover" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              {formatDate(record.consumedAt)}
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          </div>

                          <h4 className="font-serif font-bold text-lg leading-tight">
                            {record.wineName} {record.wineVintage && <span className="font-mono text-sm font-normal text-muted-foreground ml-1">{record.wineVintage}</span>}
                          </h4>
                          <p className="mt-1 text-sm text-muted-foreground italic truncate">{record.wineProducer}</p>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {(record.wineCountry || record.wineRegion) && (
                              <span>{[record.wineRegion, record.wineCountry].filter(Boolean).join(", ")}</span>
                            )}
                            {record.quantity && <span>{record.quantity} consumida</span>}
                            {record.occasion && <span className="truncate">{record.occasion}</span>}
                          </div>

                          {record.wouldBuyAgain && (
                            <Badge variant="secondary" className="mt-3 bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">
                              <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />
                              Compraria de novo
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>

                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-2xl leading-tight">
                      {record.wineName} {record.wineVintage && <span className="font-mono text-base font-normal text-muted-foreground ml-1">{record.wineVintage}</span>}
                    </DialogTitle>
                    <DialogDescription>
                      Ficha completa da garrafa consumida em {formatDate(record.consumedAt)}.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-6 md:grid-cols-[160px_1fr]">
                    {record.labelPhotoUrl && (
                      <div className="h-52 w-36 overflow-hidden rounded-lg border bg-secondary md:h-60 md:w-40">
                        <img src={record.labelPhotoUrl} alt={record.wineName || "Rótulo"} className="h-full w-full object-cover" />
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <p className="text-lg font-serif italic text-muted-foreground">{record.wineProducer}</p>
                        {normalizeWebsiteUrl(record.wineryWebsiteUrl) && (
                          <a
                            href={normalizeWebsiteUrl(record.wineryWebsiteUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 break-all"
                          >
                            Site da vinícola
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        )}
                      </div>

                      <div>
                        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Dados do vinho
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Detail label="País" value={record.wineCountry} />
                          <Detail label="Região" value={record.wineRegion} />
                          <Detail label="Uva" value={record.wineGrape} />
                          <Detail label="Safra" value={record.wineVintage} />
                          <Detail
                            label="Preço pago"
                            value={record.winePricePaid !== null && record.winePricePaid !== undefined ? valueFormatter.format(record.winePricePaid) : null}
                          />
                          <Detail label="Beber até" value={record.wineDrinkUntil ? formatDate(record.wineDrinkUntil) : null} />
                          <Detail label="Adega" value={record.wineCellarName} />
                          <Detail label="Local" value={record.wineLocationPlace || record.wineCellarLocation} />
                          <Detail label="Prateleira" value={record.wineShelf} />
                          <Detail label="Estoque atual" value={record.wineQuantity} />
                        </div>
                      </div>

                      {(record.occasion || record.personalNote || record.quantity || record.wouldBuyAgain !== null) && (
                        <div className="pt-3 border-t">
                          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Consumo
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Detail label="Quantidade consumida" value={record.quantity} />
                            <Detail label="Ocasião" value={record.occasion} />
                            <Detail label="Compraria de novo" value={record.wouldBuyAgain === null || record.wouldBuyAgain === undefined ? null : record.wouldBuyAgain ? "Sim" : "Não"} />
                          </div>

                          {record.personalNote && (
                            <div className="text-sm mt-3 pt-3 border-t flex gap-2">
                              <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                              <p className="text-foreground/90 font-serif leading-relaxed">{record.personalNote}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {record.wineNotes && (
                        <div className="pt-3 border-t">
                          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Notas da garrafa
                          </div>
                          <p className="text-sm font-serif leading-relaxed text-foreground/90 whitespace-pre-wrap">
                            {record.wineNotes}
                          </p>
                        </div>
                      )}

                      <div className="pt-3 border-t flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => restoreConsumption(record.id)}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-2" />
                          Voltar para adega
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
