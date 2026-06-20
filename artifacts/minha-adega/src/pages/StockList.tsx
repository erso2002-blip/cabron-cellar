import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useListWines, getListWinesQueryKey } from "@workspace/api-client-react";
import { PageSkeleton } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, PlusCircle, LayoutGrid, List as ListIcon } from "lucide-react";
import { WineCard } from "@/components/WineCard";

const ALL_CELLARS_VALUE = "__all_cellars__";
const PRESENT_WINES_PARAMS = { minQuantity: 1 } as const;

function normalizeSearchValue(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function StockList() {
  const [search, setSearch] = useState("");
  const [cellarFilter, setCellarFilter] = useState(ALL_CELLARS_VALUE);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const { data: wines, isLoading } = useListWines(
    PRESENT_WINES_PARAMS,
    { query: { queryKey: getListWinesQueryKey(PRESENT_WINES_PARAMS) } }
  );

  const cellarOptions = useMemo(() => {
    const names = (wines ?? [])
      .map((wine) => wine.cellarName?.trim())
      .filter((name): name is string => Boolean(name));

    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [wines]);

  const visibleWines = useMemo(() => {
    const normalizedSearch = normalizeSearchValue(search);
    const filteredBySearch = normalizedSearch
      ? (wines ?? []).filter((wine) =>
          [
            wine.name,
            wine.producer,
            wine.wineryWebsiteUrl,
            wine.grape,
            wine.country,
            wine.region,
          ]
            .map(normalizeSearchValue)
            .some((value) => value.includes(normalizedSearch))
        )
      : wines ?? [];

    if (cellarFilter === ALL_CELLARS_VALUE) return filteredBySearch;

    return filteredBySearch.filter((wine) => wine.cellarName?.trim() === cellarFilter);
  }, [cellarFilter, search, wines]);

  const hasActiveFilter = Boolean(search || cellarFilter !== ALL_CELLARS_VALUE);

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
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

      <div className="flex w-full min-w-0 flex-col gap-4 overflow-hidden rounded-lg border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row lg:flex-1">
          <div className="relative w-full min-w-0 sm:max-w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome, produtor, uva, país ou região..."
              className="w-full min-w-0 bg-background pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-wines"
            />
          </div>
          <Select value={cellarFilter} onValueChange={setCellarFilter}>
            <SelectTrigger className="w-full min-w-0 bg-background sm:w-56" data-testid="select-cellar-filter">
              <SelectValue placeholder="Filtrar por adega" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CELLARS_VALUE}>Todas as adegas</SelectItem>
              {cellarOptions.map((cellarName) => (
                <SelectItem key={cellarName} value={cellarName}>
                  {cellarName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-full items-center justify-end space-x-2 lg:w-auto">
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
      ) : !visibleWines.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border rounded-xl bg-card">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-serif font-bold text-foreground">Nenhum vinho encontrado</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
            {hasActiveFilter
              ? "Não encontramos nenhum vinho correspondente aos filtros selecionados."
              : "Sua adega está vazia. Adicione sua primeira garrafa para começar a colecionar."}
          </p>
          {!hasActiveFilter && (
            <Link href="/wines/new" className="mt-6">
              <Button>Adicionar Primeira Garrafa</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className={
          viewMode === "grid" 
            ? "grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "flex min-w-0 flex-col gap-4"
        }>
          {visibleWines.map(wine => (
            <WineCard key={wine.id} wine={wine} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}
