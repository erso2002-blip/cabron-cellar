---
name: Wine insights market pricing
description: How the "preço de mercado" (market price) is derived — origin price converted to USD
---

# Wine market price (insights endpoint)

The market price shows **only** the wine's retail price at its country of origin, **converted to US dollars (US$)**. (Earlier iterations showed local-currency + BRL cards; that was dropped — a single USD figure is the current requirement.)

**Rule:** Do NOT let the LLM pick the origin currency. Resolve it deterministically on the server from the wine's `country` (accent-normalized, PT/EN/native aliases → ISO code), ask the model for the origin retail price in that local currency, then convert local→USD via live FX. The model also returns a direct `priceUsd` estimate used as a fallback when FX fails or the currency is unknown.

**Why:** The model (especially gpt-4o-mini) frequently chose the wrong origin currency/magnitudes, so the displayed price looked wrong. Country→currency is a stable fact that belongs in code.

**How to apply:**
- New wine-producing countries → add to the country→currency map (and ensure the ISO code has a symbol entry).
- USD-origin wines (USA) → no conversion.
- `getExchangeRate(from, to, req)` is generalized (free no-key API `open.er-api.com`, reads `data.rates[to]`). Convert origin→USD.
- Fallback order for the USD figure: FX-converted origin price → model's direct `priceUsd` → 422 if neither usable.
- Insights model is gpt-4o with `response_format: json_object`.
- Response contract is a single `price: {min,max,currency:"USD",currencySymbol:"US$",market:<country>}` (no more priceOrigin/priceLocal/exchangeRate). Frontend `WineInsights.tsx` renders one card.
