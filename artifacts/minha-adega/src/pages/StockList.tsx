import { useState } from "react";
import { Link } from "wouter";
import { useListWines, getListWinesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, PlusCircle, LayoutGrid, List as ListIcon } from "lucide-react";
import { WineCard } from "@/components/WineCard";

export default function StockList() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const { data: wines, isLoading } = useListWines(
    { search: search || undefined }, 
    { query: { queryKey: getListWinesQueryKey({ search: search || undefined }) } }
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight">Sua Adega</h2>
          <p className="text-muted-foreground mt-1 font-serif italic">Acervo completo de rótulos.</p>
        </div>
        <Link href="/wines/new">
          <Button className="shrink-0" data-testid="button-add-wine">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Vinho
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg shadow-sm border">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome, produtor, uva..."
            className="pl-9 w-full bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-wines"
          />
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <Button 
            variant={viewMode === "grid" ? "secondary" : "ghost"} 
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === "list" ? "secondary" : "ghost"} 
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <PageSkeleton />
      ) : !wines?.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border rounded-xl bg-card">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-serif font-bold text-foreground">Nenhum vinho encontrado</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
            {search 
              ? "Não encontramos nenhum vinho correspondente à sua busca. Tente termos diferentes."
              : "Sua adega está vazia. Adicione sua primeira garrafa para começar a colecionar."}
          </p>
          {!search && (
            <Link href="/wines/new" className="mt-6">
              <Button>Adicionar Primeira Garrafa</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className={
          viewMode === "grid" 
            ? "grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "flex flex-col gap-4"
        }>
          {wines.map(wine => (
            <WineCard key={wine.id} wine={wine} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}
