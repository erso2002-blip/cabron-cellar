import { useGetDashboardStats, useGetWinesDrinkSoon } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/loading";
import { Link } from "wouter";
import { Wine, TrendingUp, AlertTriangle, Clock, MapPin, Plus } from "lucide-react";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { formatCurrency } from "@/lib/formatters";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: drinkSoon, isLoading: drinkSoonLoading } = useGetWinesDrinkSoon({ limit: 5 });

  if (statsLoading || drinkSoonLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1 font-serif italic">Uma visão geral do seu acervo.</p>
        </div>
        <Link href="/wines/new">
          <Button size="lg" className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Garrafa
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card hover:bg-secondary/50 transition-colors shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Garrafas</CardTitle>
            <Wine className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">{stats?.totalBottles || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Em {stats?.totalWines || 0} rótulos únicos</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-secondary/50 transition-colors shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Estimado</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">{formatCurrency(stats?.estimatedValue || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Baseado no preço pago</p>
          </CardContent>
        </Card>

        <Card className="bg-card hover:bg-secondary/50 transition-colors shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atenção 12 Meses</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">{stats?.winesDrinkSoonCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Garrafas que requerem atenção</p>
          </CardContent>
        </Card>

        <Card className="bg-card hover:bg-secondary/50 transition-colors shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Histórico</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">{stats?.recentConsumptions?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Garrafas consumidas recentemente</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm border-border">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Atenção nos Próximos 12 Meses
            </CardTitle>
            <CardDescription>Garrafas que devem ser avaliadas ou consumidas dentro dos próximos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {!drinkSoon?.length ? (
              <div className="text-center py-8 text-muted-foreground italic font-serif">
                Sua adega está em dia. Nenhuma garrafa requer atenção nos próximos 12 meses.
              </div>
            ) : (
              <div className="space-y-4">
                {drinkSoon.map(wine => (
                  <Link key={wine.id} href={`/wines/${wine.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-md hover:bg-secondary transition-colors cursor-pointer border border-transparent hover:border-border">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-foreground">{wine.name}</span>
                        <span className="text-xs text-muted-foreground">{wine.producer} {wine.vintage && `· ${wine.vintage}`}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono bg-background px-2 py-1 rounded border border-border">
                          {wine.quantity} unid.
                        </span>
                        <UrgencyBadge urgency={wine.urgency} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm border-border">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Principais Regiões
            </CardTitle>
            <CardDescription>Origem dos vinhos na sua adega</CardDescription>
          </CardHeader>
          <CardContent>
            {!stats?.topCountries?.length ? (
              <div className="text-center py-8 text-muted-foreground italic font-serif">
                Ainda não há dados suficientes.
              </div>
            ) : (
              <div className="space-y-4">
                {stats.topCountries.map(stat => (
                  <div key={stat.country} className="flex items-center">
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{stat.country || 'Desconhecido'}</span>
                        <span className="text-sm text-muted-foreground">{stat.count} garrafas</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all" 
                          style={{ width: `${Math.min(100, (stat.count / (stats.totalBottles || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
