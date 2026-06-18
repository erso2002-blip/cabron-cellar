# MyCellar Version Register

This folder tracks release versions, production status, rollback references, and known gaps.

## Rules

- Public releases use semantic versions: `v0.1.0`, `v0.1.1`, `v0.2.0`, `v0.2.1`, `v0.2.2`, `v0.2.3`, `v0.2.4`, `v0.2.5`, `v0.2.6`, `v0.2.7`, `v0.2.8`, `v0.2.9`, `v0.2.10`, `v0.2.11`, `v0.2.12`, `v0.2.13`.
- Small fixes or low-risk additions increment the patch number.
- Larger user-facing features increment the minor number.
- Every production release must have a version file in this folder.
- Every production release should have a Git tag with the same version.
- Rollback should use Git commit/tag or Vercel deployment rollback, not copied source folders.

## Current Versions

- `v0.1.0`: last stable production version before waitlist and email login.
- `v0.2.13`: current production version with the dashboard attention card based on the next 12 months.
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
