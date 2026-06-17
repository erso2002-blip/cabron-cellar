# MyCellar Version Register

This folder tracks release versions, production status, rollback references, and known gaps.

## Rules

- Public releases use semantic versions: `v0.1.0`, `v0.1.1`, `v0.2.0`, `v0.2.1`, `v0.2.2`, `v0.2.3`, `v0.2.4`.
- Small fixes or low-risk additions increment the patch number.
- Larger user-facing features increment the minor number.
- Every production release must have a version file in this folder.
- Every production release should have a Git tag with the same version.
- Rollback should use Git commit/tag or Vercel deployment rollback, not copied source folders.

## Current Versions

- `v0.1.0`: last stable production version before waitlist and email login.
- `v0.2.4`: release candidate with PWA service worker cache hotfix.
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
