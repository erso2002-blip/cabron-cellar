---
name: Wine insights — market price removed
description: The market-price feature was intentionally removed from the sommelier insights; do not re-add without a reliable source
---

# Wine market price — REMOVED

The "preço de mercado / preço na origem" feature was **removed** from the sommelier insights endpoint and UI.

**Why:** LLM-estimated prices (even gpt-4o, even with deterministic country→currency resolution + live FX conversion to USD) were not trustworthy enough for the owner. The user explicitly asked to remove it ("Não está confiável").

**How to apply:**
- The `/wines/:id/insights` endpoint now returns only `harmonization`, `servingTemp`, `decanting`. No price fields, no currency/FX code.
- `WineInsights.tsx` renders only harmonization + serving temp + decanting.
- Do NOT re-introduce LLM-guessed prices. If a market price is ever wanted again, source it from a real wine-price API/dataset, not the model.
