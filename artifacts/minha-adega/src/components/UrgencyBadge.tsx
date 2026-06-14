import { WineDrinkSoonUrgency } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  urgency: WineDrinkSoonUrgency;
  className?: string;
}

export function UrgencyBadge({ urgency, className }: Props) {
  switch (urgency) {
    case "overdue":
      return <Badge variant="destructive" className={className}>Vencido</Badge>;
    case "critical":
      return <Badge variant="default" className={`bg-orange-600 hover:bg-orange-700 ${className}`}>Crítico</Badge>;
    case "soon":
      return <Badge variant="secondary" className={`bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 ${className}`}>Em breve</Badge>;
    case "ok":
    default:
      return null;
  }
}
