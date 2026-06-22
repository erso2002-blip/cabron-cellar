# MyCellar Version Register

This folder tracks release versions, production status, rollback references, and known gaps.

## Rules

- Public releases use semantic versions: `v0.1.0`, `v0.1.1`, `v0.2.0` and later patch releases.
- Small fixes or low-risk additions increment the patch number.
- Larger user-facing features increment the minor number.
- Every production release must have a version file in this folder.
- Every production release should have a Git tag with the same version.
- Rollback should use Git commit/tag or Vercel deployment rollback, not copied source folders.

## Current Versions

- `v0.1.0`: last stable production version before waitlist and email login.
- `v0.2.50`: current production version with refreshed closed-beta allowlist and Google login access validation.
- `v0.2.49`: production version with Google login beta-access error handling and PWA cache refresh.
- `v0.2.48`: production version with profile, notification preference, and account deletion request endpoints wired to Perfil.
- `v0.2.47`: production version with safer account-deletion request copy, profile editing request, simplified side menu, and native/PWA version alignment.
- `v0.2.46`: profile editing request, simplified side menu, and native/PWA version alignment.
- `v0.2.45`: production version with launch-promotion subscription prices set to R$ 19,90/month and R$ 199,00/year.
- `v0.2.44`: production version with Brazilian launch-promotion subscription prices updated to R$ 39,90 base pricing.
- `v0.2.43`: production version with the first Brazil, Argentina, and Chile market configuration layer plus backup documentation/script.
- `v0.2.42`: production version with subscription copy corrected according to written Portuguese norms.
- `v0.2.41`: production version with consumption evaluation copy corrected and the `Sem avaliação` filter removed.
- `v0.2.40`: production version with the `Compraria novamente` consumption-history filter and import copy adjustments.
- `v0.2.39`: production version with app version derived from package metadata.
- `v0.2.37`: production version with stock quantity visible again in the compact cellar card side column on mobile.
- `v0.2.36`: production version with additional wine photos stored separately from the main label photo.
- `v0.2.35`: production version with mobile horizontal overflow fixed on the cellar screen.
- `v0.2.34`: production version with the service worker cache bumped so mobile/PWA clients receive the extra-photo copy update.
- `v0.2.33`: production version with the extra photo field renamed and explicitly limited to one additional image per wine.
- `v0.2.32`: production version with the main cellar list restricted to bottles currently in stock.
- `v0.2.31`: production version with wine-form label-photo upload controls, compact cellar layout, enriched label analysis, and assisted cellar import positioned as Pro.
- `v0.2.30`: production version with Pro gating for harmonization and drink-date suggestions, plus Free 30-present-bottle enforcement.
- `v0.2.29`: production version with Basic plan label-AI positioning.
- `v0.2.28`: production version with reverse dish-to-cellar pairing.
- `v0.2.27`: production version with launch-promotion prices in billing.
- `v0.2.26`: production version with legacy Google token auto-upgrade to persistent app sessions.
- `v0.2.25`: production version with paid billing buttons disabled as `Em breve`.
- `v0.2.24`: production version with authenticated `/login` redirect after Google login.
- `v0.2.23`: production version with public billing plans and protected checkout.
- `v0.2.22`: production version with Mercado Pago checkout scaffold for Free, Pro Mensal, and Pro Anual.
- `v0.2.21`: production version with a visible waitlist-to-login entry point for approved beta testers.
- `v0.2.20`: production version with closed beta access limited to pre-approved tester e-mails.
- `v0.2.19`: production version with persisted legal acceptance on the returning login screen.
- `v0.2.18`: production version with protected waitlist report and cache/PWA refresh reinforcement.
- `v0.2.17`: production version with legal text corrections and internal legal-page navigation fix.
- `v0.2.16`: production version with legal pages linked from the app side menu and aligned app/package version display.
- `v0.2.15`: production version with winery website normalization and cellar-card website visibility.
- `v0.2.14`: production version with the waitlist header app CTA disabled during closed beta.
- `v0.2.13`: production version with the dashboard attention card based on the next 12 months.
- `v0.2.12`: production version with the qualified public waitlist form for Instagram/Bio traffic.
- `v0.2.11`: production version with compact consumption-history cards and full details opened from each record.
- `v0.2.10`: production version with mobile label-scan button layout fix and full consumed-bottle history details.
- `v0.2.9`: production version with client-side cellar search fallback and accent normalization.
- `v0.2.8`: production version with cellar search including country and region.
- `v0.2.7`: production version with winery website shown only from the wine record and PWA install guidance limited to the side menu.
- `v0.2.6`: production version with visible iPhone PWA install prompt and winery-site fallback for existing Achaval Ferrer records.
- `v0.2.5`: production version with forced service worker refresh for stale iPhone/PWA clients.
- `v0.2.4`: production version with PWA service worker cache hotfix.
- `v0.2.3`: production version with PWA install CTA in the app menu.
- `v0.2.2`: production version with cellar filter in `Sua Adega`.
- `v0.2.1`: production version with restore-consumption, label-name fallback, and official-winery-site guard.
- `v0.2.0`: production version with waitlist, winery website field, and email login code scaffold.

## Rollback Procedure

1. Identify the last stable version in this folder.
2. Confirm the Git tag or commit listed in that version file.
3. Prefer Vercel rollback to the stable deployment when the issue is deployment-only.
4. Use Git revert/tag redeploy when the issue is code-level.
5. For database changes, verify whether the schema change is backward-compatible before rollback.
6. Record the incident and action in the affected version file.
