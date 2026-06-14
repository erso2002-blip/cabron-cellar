import { useListConsumption } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/loading";
import { GlassWater, Calendar, Star, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function History() {
  const { data: history, isLoading } = useListConsumption({ limit: 50 });

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
              <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(record.consumedAt).toLocaleDateString('pt-BR')}
                    </div>
                    {record.wouldBuyAgain && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">
                        <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />
                        Compraria de novo
                      </Badge>
                    )}
                  </div>
                  
                  <h4 className="font-serif font-bold text-lg leading-tight mb-1">
                    {record.wineName} {record.wineVintage && <span className="font-mono text-sm font-normal text-muted-foreground ml-2">{record.wineVintage}</span>}
                  </h4>
                  <p className="text-sm text-muted-foreground italic mb-4">{record.wineProducer}</p>
                  
                  {record.occasion && (
                    <div className="text-sm bg-secondary/50 p-2 rounded mb-3 border border-border/50 inline-block">
                      <span className="font-medium text-foreground">Ocasião:</span> {record.occasion}
                    </div>
                  )}
                  
                  {record.personalNote && (
                    <div className="text-sm mt-3 pt-3 border-t flex gap-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-foreground/90 font-serif leading-relaxed">{record.personalNote}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
