# Craft & Colours

Nairobi art, craft and haberdashery shop + workshop space at Village Market.
Static storefront built with Astro 7, React 19 islands and Tailwind CSS 4,
backed by headless WordPress + WooCommerce (Store API).

## Quick start

```bash
fnm use            # Node >= 22.23.4 (.node-version)
npm ci
npm run dev        # http://localhost:4321
```

Copy `.env.example` to `.env` to point the site at a local or live CMS. Without
`WP_URL` / `PUBLIC_WC_STORE_URL` the site runs on demo content.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Astro dev server (background) |
| `npm run check` | `astro check` — types + diagnostics |
| `npm run build` | static build to `dist/` |
| `npm run preview` | serve the built site |
| `npm run verify` | post-build deploy guard (CMS reachable, no demo data, required files) |
| `npm run smoke` | smoke-test a deployed site (`SITE_URL=… npm run smoke`) |

## Docs

- [Deploying to Host Africa](docs/deploy-hostafrica.md) — FTPS workflow, secrets, rollback
- [Launch QA checklist](docs/qa-launch.md) — functional, responsive, a11y, SEO, security
- [Release candidate report](docs/release-candidate.md) — fill in per release
- [WordPress production setup](docs/wordpress-setup.md)
- [Local WordPress stack](docs/wordpress-local.md)
- [Store data contract](docs/store-data-contract.md)
- [Project memory](MEMORY.md) — decisions, phase plan, change log

## Deploy

Push to `master` (or run **Deploy storefront** manually). The workflow runs
`check` → `build` → `verify`, mirrors `dist/` to Host Africa over FTPS, then
smoke-tests the live site. WordPress content changes trigger the same workflow
through `repository_dispatch: wordpress_update`.
