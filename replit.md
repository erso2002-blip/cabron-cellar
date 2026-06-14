# Minha Adega

Gestão de adega pessoal de vinhos — cadastro, estoque, recomendações de consumo e histórico.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/minha-adega run dev` — run the web frontend (port 24569)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned by Replit)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + wouter + framer-motion
- API: Express 5
- Auth: Replit Auth (OpenID Connect / PKCE) via `@workspace/replit-auth-web`
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contract
- `lib/db/src/schema/` — Drizzle table definitions (auth.ts, wines.ts, consumption.ts)
- `artifacts/api-server/src/routes/` — Express route handlers (wines, consumption, dashboard, auth)
- `artifacts/minha-adega/src/` — React frontend (pages, components)
- `lib/replit-auth-web/` — browser auth hook (`useAuth`)

## Architecture decisions

- OpenAPI-first: spec defines contract, codegen produces typed hooks for frontend and Zod validators for backend
- Auth is Replit Auth (OIDC PKCE) — no custom passwords; sessions stored in PostgreSQL
- `labelPhotoUrl` field is an AI-ready hook: plain URL input now, designed to accept output from future label-reading AI integration
- `drinkUntil` field drives the drink-soon urgency system (overdue / critical / soon / ok)
- Consumption records decrement wine quantity atomically on the server

## Product

- Dashboard with total bottles, cellar value estimate, drink-soon alerts, recent consumption, top countries
- Wine registry: name, producer, country, region, grape, vintage, price, quantity, cellar location, drink-until, label photo, notes
- Stock list with search and filters (country, region, grape, vintage, min quantity)
- Wine detail page with urgency indicator and consume action
- Consumption history: date, personal note, occasion, would-buy-again
- Auth via Replit (login/logout)

## User preferences

- Visual: limpo, sofisticado, funcional — estética premium de vinho sem exagero decorativo
- Prioridade em usabilidade e velocidade
- Banco de dados persistente (PostgreSQL Replit)
- Código preparado para integração futura com IA para leitura de rótulos

## Gotchas

- Run `pnpm run typecheck:libs` after editing any lib to rebuild composite declarations before restarting workflows
- `openid-client` must be in the `external` list in `artifacts/api-server/build.mjs` (ESM bundler limitation)
- After any OpenAPI spec change: re-run `pnpm --filter @workspace/api-spec run codegen` before restarting services
- `pricePaid` is stored as `numeric` (Postgres) — always convert to/from float in route handlers
- `drinkUntil` uses `date` column in `"string"` mode (YYYY-MM-DD format, no timezone shifting)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- AI label integration: `POST /api/wines/:id/label` with `{ labelPhotoUrl }` — designed as the entry point for AI to push extracted data
