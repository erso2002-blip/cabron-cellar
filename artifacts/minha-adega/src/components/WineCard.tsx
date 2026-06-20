import { Link } from "wouter";
import { Wine as WineType } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Wine, MapPin, Calendar, Warehouse, ExternalLink } from "lucide-react";
import { websiteHostname } from "@/lib/url";

interface WineCardProps {
  wine: WineType;
  viewMode: "grid" | "list";
}

function LabelPhoto({ wine, compact = false }: { wine: WineType; compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "w-16 h-20 bg-secondary rounded flex-shrink-0 flex items-center justify-center overflow-hidden border border-border"
          : "w-20 h-24 sm:w-24 sm:h-28 bg-secondary rounded flex-shrink-0 flex items-center justify-center overflow-hidden border border-border"
      }
    >
      {wine.labelPhotoUrl ? (
        <img
          src={wine.labelPhotoUrl}
          alt={wine.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <Wine className={compact ? "w-6 h-6 text-muted-foreground opacity-50" : "w-7 h-7 text-muted-foreground opacity-40"} />
      )}
    </div>
  );
}

export function WineCard({ wine, viewMode }: WineCardProps) {
  const isList = viewMode === "list";

  const location =
    [wine.locationPlace, wine.cellarName, wine.shelf]
      .filter(Boolean)
      .join(" · ") || wine.cellarLocation;
  const wineryWebsiteHost = websiteHostname(wine.wineryWebsiteUrl);

  if (isList) {
    return (
      <Link href={`/wines/${wine.id}`}>
        <Card className="hover:bg-secondary/50 transition-all cursor-pointer shadow-sm hover:shadow-md group">
          <CardContent className="p-3 sm:p-4 flex items-center gap-4 sm:gap-6">
            <LabelPhoto wine={wine} compact />

            <div className="flex-1 min-w-0">
              <h3 className="font-serif font-bold text-lg truncate group-hover:text-primary transition-colors">{wine.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{wine.producer}</p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-muted-foreground">
                {wine.country && (
                  <span className="flex items-center gap-1 min-w-0">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{wine.region ? `${wine.region}, ` : ""}{wine.country}</span>
                  </span>
                )}
                {wine.vintage && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {wine.vintage}
                  </span>
                )}
                {wine.grape && (
                  <span className="px-2 py-0.5 bg-background border border-border rounded-full truncate max-w-40">{wine.grape}</span>
                )}
              </div>
              {location && (
                <div className="flex items-center gap-1 mt-1.5 text-xs text-primary/70 font-medium">
                  <Warehouse className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
              )}
              {wineryWebsiteHost && (
                <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{wineryWebsiteHost}</span>
                </div>
              )}
            </div>

            <div className="flex-shrink-0 text-right">
              <div className="text-2xl font-serif font-bold">{wine.quantity}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Garrafas</div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/wines/${wine.id}`}>
      <Card className="h-full hover:bg-secondary/50 transition-all cursor-pointer shadow-sm hover:shadow-md group">
        <CardContent className="p-3 flex gap-4">
          <LabelPhoto wine={wine} />

          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-serif font-bold text-base line-clamp-2 group-hover:text-primary transition-colors leading-tight">{wine.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{wine.producer}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-xl font-serif font-bold">{wine.quantity}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">un.</div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {wine.vintage && (
                <span className="font-mono bg-secondary px-2 py-1 rounded">{wine.vintage}</span>
              )}
              {wine.country && (
                <span className="bg-background border border-border px-2 py-1 rounded truncate max-w-[120px]">{wine.country}</span>
              )}
              {wine.grape && (
                <span className="bg-background border border-border px-2 py-1 rounded truncate max-w-[100px]">{wine.grape}</span>
              )}
            </div>
            {location && (
              <div className="flex items-center gap-1 mt-2 text-xs text-primary/70 font-medium">
                <Warehouse className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            )}
            {wineryWebsiteHost && (
              <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{wineryWebsiteHost}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
