import { activeMarket, type MarketCurrency } from "@/config/markets";

export function formatCurrency(value: number, currency: MarketCurrency = activeMarket.currency) {
  return new Intl.NumberFormat(activeMarket.locale, {
    style: "currency",
    currency,
  }).format(value);
}

export function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString(activeMarket.locale);
}
