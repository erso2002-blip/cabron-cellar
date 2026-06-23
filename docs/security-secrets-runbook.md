# MyCellar Security Secrets Runbook

## Purpose

This runbook defines how MyCellar secrets must be stored, migrated and rotated before wider beta, public store release or real billing.

## Rules

- Do not commit real secrets.
- Do not paste secrets in chat, logs, issues, docs or screenshots.
- Keep production runtime values in Vercel environment variables.
- Keep the administrative source of truth in 1Password or approved SecretRefs.
- Use `.env.example` only as a variable-name template.
- Use local `.env.*` files only for short-lived development or controlled operations, with permission `600`.
- Treat database dumps, logs and user-uploaded image processing data as sensitive.

## Required Secret Groups

| Group | Required runtime names | Source of truth | Runtime target | Status gate |
| --- | --- | --- | --- | --- |
| Database / Neon | `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, Postgres aliases | 1Password / SecretRefs | Vercel env and controlled local automation | Required before scale |
| OpenAI | `OPENAI_API_KEY` | 1Password | Vercel env | Required before scale |
| Mercado Pago | `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_URL` | 1Password | Vercel env | Required before billing |
| Email / Resend | `RESEND_API_KEY`, `AUTH_EMAIL_FROM`, `EMAIL_LOGIN_PEPPER` | 1Password | Vercel env | Required before broad email login |
| Google login | `GOOGLE_CLIENT_ID`, `VITE_GOOGLE_CLIENT_ID` | OAuth admin record / 1Password note | Vercel env/build | Required before store review |
| Vercel | project token/OIDC and project metadata | 1Password / Vercel account | Vercel | Required before release ops |
| Beta / Pro | `MYCELLAR_PRO_EMAILS`, `MYCELLAR_PRO_USER_IDS`, `MYCELLAR_DEFAULT_PLAN`, `LEGACY_CELLAR_IMPORT_EMAILS` | Restricted operational record | Vercel env | Required before broad beta |
| Waitlist | `WAITLIST_REPORT_TOKEN` | 1Password | Vercel env | Required before public campaign |

## Migration Order

1. Create or confirm 1Password items for each required group.
2. Confirm Vercel Production, Preview and Development environment names.
3. Move production runtime values into Vercel.
4. Move local automation values into SecretRefs or `op run`.
5. Rotate any credential that circulated outside the vault.
6. Remove or expire temporary token files only after confirming no automation depends on them.
7. Run a redacted audit for Git, logs, backups and temporary folders.

## Rotation Priority

Critical before wider beta:

- Database / Neon credentials.
- OpenAI key if shared or copied outside the vault.
- Resend key and email-login pepper.
- Waitlist report token.

Critical before billing:

- Mercado Pago access token.
- Mercado Pago webhook secret.

## Verification Checklist

- `.env.example` exists and contains no real values.
- `.env.local`, `.env.production.local` and `.vercel/` remain ignored by Git.
- No real secret is found by redacted Git scan.
- Vercel env names match the app code.
- 1Password has a clear item or reference for each critical group.
- Production backup excludes `.env` and treats database dumps as sensitive.
- Billing remains blocked until Mercado Pago webhook/persistence is published and verified end to end.

## Go / No-Go

No-go for broad beta, public store release or real billing if any of these remain true:

- `DATABASE_URL`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `MERCADO_PAGO_ACCESS_TOKEN` or `WAITLIST_REPORT_TOKEN` have no vault/runtime-controlled owner.
- A real secret exists in Git, docs, logs, screenshots, Telegram, public issue or uncontrolled backup.
- A temporary token is required for routine operation but has no expiry, owner or replacement path.
- Mercado Pago can create checkout but cannot activate and audit Pro access automatically.
