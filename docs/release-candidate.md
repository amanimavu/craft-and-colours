# Release candidate report

> Fill this in after the first successful production deploy. Keep the previous
> report in the git history rather than overwriting it with the next release.

| Field | Value |
|---|---|
| Version / commit | `TBD` |
| Deploy date | `TBD` |
| Deployed by | `TBD` |
| Workflow run | `TBD` (link) |
| Storefront | https://craftandcolors.africa |
| CMS | https://cms.craftandcolors.africa |
| Node version | 24 (CI) |

---

## 1. Automated results

| Check | Command / job | Result | Notes |
|---|---|---|---|
| Type check | `npm run check` | ⬜ pass / ⬜ fail | |
| Build | `npm run build` | ⬜ pass / ⬜ fail | pages: |
| Build guard | `npm run verify` | ⬜ pass / ⬜ fail | |
| Lighthouse — performance | `QA` workflow | ⬜ ≥ 0.80 | |
| Lighthouse — accessibility | `QA` workflow | ⬜ ≥ 0.95 | |
| Lighthouse — best practices | `QA` workflow | ⬜ ≥ 0.90 | |
| Lighthouse — SEO | `QA` workflow | ⬜ ≥ 0.90 | |
| CLS | `QA` workflow | ⬜ ≤ 0.10 | |
| Post-deploy smoke test | `deploy` workflow | ⬜ pass / ⬜ fail | |
| HTTPS + www redirects | `smoke-test.sh` | ⬜ pass / ⬜ fail | |
| Security headers | `smoke-test.sh` | ⬜ pass / ⬜ fail | |

Lighthouse report: `TBD`

---

## 2. Manual QA

Source: [qa-launch.md](qa-launch.md). Mark the sections that were completed and
link to evidence (screenshots, order numbers) where useful.

| Section | Result | Notes |
|---|---|---|
| 1. Functional matrix — browsing | ⬜ pass / ⬜ fail | |
| 1. Functional matrix — cart & checkout | ⬜ pass / ⬜ fail | test order: |
| 1. Functional matrix — workshops & forms | ⬜ pass / ⬜ fail | |
| 2. Responsive (390–1440) | ⬜ pass / ⬜ fail | |
| 3. Accessibility | ⬜ pass / ⬜ fail | |
| 4. SEO & metadata | ⬜ pass / ⬜ fail | |
| 5. Performance (desktop spot check) | ⬜ pass / ⬜ fail | |
| 6. Security & infrastructure | ⬜ pass / ⬜ fail | |
| 7. Content & launch blockers | ⬜ pass / ⬜ fail | |
| 8. Cross-browser | ⬜ pass / ⬜ fail | |

---

## 3. Known issues accepted for this release

| Issue | Impact | Mitigation / next step |
|---|---|---|
| `favicon.svg` only — no `.ico` / `apple-touch-icon.png` | Old browsers and iOS home-screen get a generic icon | Add generated icons post-launch |
| Live Store API products do not map `attributes` / `isNew` | Dynamic shop filters and "Fresh arrivals" match nothing against a real store | Map fields in `normalizeProduct()` (see `docs/store-data-contract.md`) |
| Wishlist is device-local | No account sync | Acceptable at launch |
| Policy copy is a draft | Refund window, 48 h workshop rule, exclusions need owner sign-off | Sign off before announcing |
| Home hero crops to a thin strip at 390 px | Visual only | Consider a taller mobile treatment |
| Category pages are query params | No per-category `<title>`/meta | Conscious tradeoff (2026-10-28) |
| Demo photography and contact details | Placeholder content | Replace before launch |

Add or remove rows to match reality. Do not silently delete an issue.

---

## 4. Rollback

- Last known-good workflow run: `TBD`
- Rollback command: Actions → **Deploy storefront** → re-run that run, or upload
  its `dist` artifact manually. See
  [deploy-hostafrica.md §7](deploy-hostafrica.md#7-rollback).

---

## 5. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Build / deploy | | | ⬜ go / ⬜ no-go |
| Content | | | ⬜ go / ⬜ no-go |
| Owner | | | ⬜ go / ⬜ no-go |
