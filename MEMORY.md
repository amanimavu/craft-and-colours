# Craft & Colours — Project Memory

> Persistent context for this repository. Read this first when resuming work.
> **Last updated:** 2026-10-30
> **Source:** reconstructed from the plan-mode transcript + repository inspection.

---

## 1. How to use this file

- Treat **Locked decisions** as constraints unless the user explicitly changes them.
- Work through the **Phase plan** in order; the user asked for a **review stop at every phase boundary**.
- Update **Current work state**, **Known issues**, and **Change log** at the end of each work session.
- If this file conflicts with the live code, the code wins — then fix this file.

---

## 2. Project snapshot

| Item | Value |
|---|---|
| Project | Craft & Colours — art, craft & haberdashery shop + workshop space |
| Location | Village Market, Limuru Road, Nairobi, Kenya |
| Market | Nairobi first, East Africa delivery |
| Stack | Astro 7 (`output: static`), React 19 islands, Tailwind CSS 4, TypeScript |
| Backend (target) | Headless WordPress + WooCommerce (Store API) |
| Hosting (target) | Host Africa (shared/Passenger), GitHub Actions deploy |
| Repo | `/home/amani-mavu/Projects/craft_and_colours` |
| Git | Only one commit (`f8cb6a5 chore: inital commit`); **the whole app is currently untracked/uncommitted** |
| Last verified | User ran `npm run check` + `npm run build` themselves, confirmed passing (2026-10-28). **Note:** per user instruction, the assistant no longer runs these commands proactively — it flags when something is ready to verify and the user runs them. |

**Pages that exist:** `/`, `/shop/`, `/shop/[slug]/`, `/journal/`, `/journal/[slug]/`, `/about/`, `/contact/`, `/cart/`, `/checkout/`, `/order-confirmation/`, `/workshops/`, `/workshops/[slug]/`, `/diy-kits/`, `/wishlist/`, `/policies/`, `404`, `/robots.txt`, plus internal `/styleguide/`. `/shop/category/[slug]/` was **removed 2026-10-28** — category browsing is now `/shop/?category=<slug>` on the main shop page. `cart`, `checkout`, `order-confirmation`, `wishlist`, and `styleguide` are excluded from the sitemap; the latter two are also `noindex`.

**Content:** 7 categories, 18 demo products, 5 demo workshops (paid + free meetups), 3 journal posts, 4 vibes (now surfaced on home page), 6 UGC posts (now surfaced on home page), plus demo testimonials still unsurfaced. All content is demo data in `src/lib/demo-data.ts`; no live WordPress connection unless `PUBLIC_WC_STORE_URL` / `WP_URL` are set.

---

## 3. Locked decisions

### Brand & design
- Direction: playful **"dopamine design"** (inspired by ban.do), high-converting storefront.
- Palette (Tailwind tokens in `src/styles/global.css`):
  - cream `#fbf7ef / #f6efe2 / #ecdfcd / #ddcbb2`
  - ink `#211d19 / #332d27 / #4a423b / #6f655b / #a79c91`
  - clay `#f4ddd1 / #d99a7b / #b45f3f / #984a2f`
  - **olive `#e8ebd8 / #6f7d3f / #3e4a24`** ← replaced teal everywhere
  - butter `#fff9eb`, poppy `#ff5e36 / #e84a24`, bubblegum `#ff6584`, marigold `#ffaa00`, cobalt `#2354e6`
  - sand `#ead9c0 / #d9c3a5`
- Type: **Fraunces Variable** (SOFT/WONK) display + **Manrope** body (`@fontsource-variable/*`).
- Icons: `astro-icon` with `lucide` and `simple-icons`; `src/assets/icons` for local SVGs.
- Buttons are pills, cards have 16px+ radii, soft chunky shadows, bouncy hovers.

### UX / layout
- **Footer:** flat cream background, **no texture**.
- **Texture:** `brush-stroke-texture.jpg` is used only on the workshop/meetups section; `textured-lavendar-paper.png` only on the home journal section (2026-10-30). Footer stays flat cream — lavender was considered for the footer and rejected (locked decision + muted text fails contrast on lilac, shows site-wide).
- **Text on lavender:** `ink-500`, `ink-700`, `ink-300` and `clay-600` all fail AA on the lilac texture; use `ink-800`/`ink-900`.
- **CTA card near footer:** `banner.png`, right-aligned two-row text + right-aligned button.
- **Journal:** dates include date **and time** (`src/lib/format.ts`).
- **Social:** Instagram, Facebook, TikTok icons in the footer (`simple-icons:*`).
- **Payments:** real logos (M-Pesa, Visa, Mastercard) in the footer, not text labels.
- **Journal decorator:** currently `mustard-yarn.png` (a `rainbow-yarn-decorator.png` also exists, unused).
- Prefer Astro `<Image />` for local assets; raw `<img>` only for dynamic/remote URLs where `<Image />` is not applicable.

### Commerce
- Currency **KES**, locale `en-KE`.
- Shipping: Nairobi KES 300, free over KES 4,500; East Africa quoted at checkout.
- Free craft gift from KES 5,000.
- Payments: **at launch, no online payment** — every order uses the plugin's "Pay via WhatsApp" gateway (`craft_whatsapp`): order placed On hold, customer messages the shop, pays by M-Pesa/card off-site, staff mark Processing (decided 2026-10-30). Online M-Pesa/card gateway later (provider still undecided: Pesapal / Flutterwave / WooCommerce M-Pesa plugin).
- Delivery countries: **Kenya, Uganda, Tanzania** (decided 2026-10-30). Region codes = WooCommerce's (`src/lib/regions.ts`); outside Nairobi the courier cost is confirmed on WhatsApp.
- Workshops: hybrid — paid sessions via WooCommerce virtual products; free meetups via a lightweight RSVP endpoint.
- Reviews cadence: stop after each phase / sub-step and wait for approval.

### Engineering
- Node **>= 22.23.4** (Astro 7 requirement). Known-good: `v24.14.0`.
- Path alias-free relative imports; Astro pages fetch via `src/lib/woocommerce.ts`.
- Static output; no SSR adapter yet (Host Africa deployment approach still TBD).

---

## 4. Phase plan (from plan mode)

Original plan message: phases **0–9**, each ending in a **review stop**. This is the authoritative roadmap; statuses below are the current reconstruction.

| Phase | Scope | Status |
|---|---|---|
| **0 — Baseline + asset intake** | install, `check`, `build`, fix baseline blockers, confirm assets/contact/payments/schedule | ✅ **Done** |
| **1 — Content & data model** | Nairobi catalogue (7 categories), KES pricing, workshops/posts types, shipping + SEO location data | ✅ **Done** |
| **2 — Design foundation** | palette/typography in `global.css`, icon setup, shared components (`Logo`, `Icon`, `Sticker`, `WavyDivider`, `Ticker`, `Badge`), replace inline SVGs | ✅ **Done (awaiting style review)** — tokens, fonts, icon wrapper, 6 shared components, bouncy buttons, `/styleguide/` preview; all page-level inline SVGs replaced |
| **3 — Global shell** | animated ticker, header (mega-menu, search pill, wishlist, cart drawer trigger, WhatsApp pill, mobile menu), cart drawer w/ free-gift bar, mobile sticky bar, footer | ✅ **Done — reviewed and approved by user (2026-10-28)** — ticker, mega-menu, ⌘K search overlay, wishlist, cart drawer, WhatsApp pills, mobile menu, mobile bottom bar, newsletter band |
| **4 — Home page** | hero, featured workshop, "Creative Vibes" bubbles, bestsellers/bundles, UGC wall, newsletter CTA | ✅ **Done (2026-10-28)** — hero, featured-workshop block (single `upcomingWorkshops[0]` detail card — **not a carousel, by deliberate choice**, see change log), journal, CTA banner, vibes bubbles (`demoVibes`), UGC wall (`demoUgc`, pinboard collage w/ photo bg, user-reviewed), and `Bestsellers.astro` (wired into `index.astro`) all live. Newsletter CTA section was built then removed same day at user request ("remove 'Stay in the loop' banner") — footer newsletter band (`Footer.astro`) is untouched and still the only newsletter signup on the site. |
| **5 — Shop + product** | shop index w/ filters + search + quick-add + wishlist, category pages, product page (gallery, swatches, ratings, WhatsApp, related) | ✅ **Done (2026-10-28)** — filters now really filter (shared + per-category dynamic attributes, see below), quick-add-to-cart button on shop-grid cards (simple in-stock products only — variable products route to the product page instead), search + wishlist done, category pages replaced with query-param filtering on `/shop/`; product page has gallery, true color swatches (not just text pills), star rating + review count, a WhatsApp contact link, and related products. |
| **6 — Workshops + DIY kits** | workshops index/detail + "Save My Spot", paid→cart / free→RSVP, DIY kits landing | ✅ **Done (2026-10-28)** — `/workshops/` listing, `/workshops/[slug]/` detail, paid ticket → cart and free RSVP flow, plus `/diy-kits/` landing page. `/studio/` was **cancelled** — the business has no studio/private-hire offering. |
| **7 — Commerce flows** | cart page + drawer sync, checkout, confirmation, address fields, shipping, wishlist, search, policies, 404, robots, favicon, confetti | ✅ **Done — user confirmed (2026-10-30)** — `/policies/`, `404.astro`, `robots.txt` endpoint, `public/favicon.svg`, `og:locale` fix, order-confirmation confetti. Policy copy still a draft for owner sign-off. |
| **8 — WordPress integration** | `mu-plugin` (CORS, contact, newsletter, RSVP, UGC CPT, free-gift logic, low-stock widget, security headers, rebuild hook) + docs | ✅ **Done — verified by user against the local Docker WordPress (2026-10-30).** Plugin in `wordpress/mu-plugins/` (+ later additions: product "Good to know", "Order now, pay on confirmation" gateway, KE/UG/TZ address rules), frontend wired, local stack + 3 docs. |
| **9 — Deployment + QA** | GitHub Actions build/deploy, Host Africa guide, check/build, responsive/a11y/Lighthouse, RC report | ❌ **Not started** (`.github/` is empty) |

### Phase detail / acceptance criteria

- **Phase 0:** clean `npm install`, `check`, `build`; asset request list confirmed. *(Complete; fixed `FormEvent`, duplicate `lines` key, unreachable `??`, unused import, engines.)*
- **Phase 1:** categories Paint, Stitch & Sew, Clay, Sketch, Kids, DIY Kits, Bundles; products with KES prices, ratings, stock, swatches, pack shot + hands-in-action; `Workshop`/`Vibe`/`UGC` types; KES formatting and Kenyan address fields.
- **Phase 2:** all visual primitives reusable; no inline SVG left; style tile approved. *(Components + style guide built; awaiting user approval.)*
- **Phase 3:** shell fully interactive; free-gift progress bar; mobile bottom bar. *(Built; awaiting review.)*
- **Phase 4a:** hero uses the provided collage banner with correct aspect + copy below. **4b:** full home sections.
- **Phase 5:** filters actually filter (shared + per-category attributes); quick-add; wishlist. *(Complete 2026-10-28.)*
- **Phase 6:** booking/RSVP flows; DIY kits landing. *(Complete 2026-10-28; Studio page cancelled by user — no such offering.)*
- **Phase 7:** end-to-end purchase + policies + 404/robots/favicon + confetti. *(Built 2026-10-30; not browser-verified — dev server blocked by root-owned `.astro/`, see Known issues.)*
- **Phase 8:** plugin + setup docs; store data contract documented. *(Complete 2026-10-30, user-verified.)*
- **Phase 9:** deploy workflow + launch QA.

### Legacy task tracker (pre-redesign scaffold)
The session to-do list still holds six older tasks; it is **stale** relative to the phase plan:

1. Scaffold Astro 7 project config, styles, demo data — `in_progress` (effectively done)
2. Build storefront pages, layouts, components — `pending` (largely done)
3. Implement WooCommerce Store API cart/checkout + WP clients — `pending`
4. Add WordPress mu-plugin (CORS, security, inventory, contact, rebuild) — `pending`
5. Add Host Africa/WordPress docs + GitHub Actions deploy — `pending`
6. Install deps, build, typecheck, fix issues — `pending` (done for now)

> Update or replace this list when the phase plan is next revised.

---

## 5. Current work state

### Phase 3 — Global shell (built 2026-10-27, awaiting review)
- **Header** (`Header.astro`): ticker, shop mega-menu (opens on hover with a short intent delay, plus click/keyboard; category cards, icons, blurbs, olive count badges, DIY-kit promo and delivery info), ⌘K/Ctrl+K search trigger, wishlist heart + count, cart trigger (`data-cart-open`, `/cart/` no-JS fallback), WhatsApp pill (`xl+`), and a rich mobile menu (`lg-`). Main nav appears at `lg` to avoid tablet overflow; the heart is hidden below `sm` because the mobile menu carries wishlist.
- **Search** (`SearchOverlay.tsx`): body-level portal, live filtering by name/category, category shortcuts when empty, `Enter` opens the first result, `Esc`/backdrop close, scroll lock, focus return. Triggers on `[data-search-open]`, `search:open`, and ⌘K/Ctrl+K.
- **Cart drawer** (`CartDrawer.tsx`): mounted once in `BaseLayout`; opens from `[data-cart-open]` or `cart:open`; quantity/remove controls; free-gift progress uses `DEMO_FREE_GIFT_THRESHOLD` (KES 5,000); `Esc`/backdrop close; focus returns to trigger.
- **Mobile bar** (`MobileBar.astro`): fixed Shop / Workshops / WhatsApp bar below `md`; hidden on cart/checkout/confirmation; body gets bottom padding incl. safe-area inset.
- **Newsletter** (`NewsletterForm.tsx` + footer band): email validation + success state. **No provider is wired yet** (local confirmation only).
- **Wishlist**: `wishlist-store.ts` (localStorage `craft-wishlist-v1`), `WishlistToggle`, `WishlistCount`, `WishlistView`, `/wishlist/` (noindex), toggle on product pages.
- **Header script**: closes open `<details>` menus on outside click/Esc and whenever search/cart triggers fire.
- **CSS**: `drawer-in` / `fade-in` / `pop-in` keyframes, reduced-motion guard, WebKit search-cancel button hidden.
- **Verified:** `check` 0/0/0; build 39 pages; headless screenshots at 390/768/1024/1280/1440 with no horizontal overflow; added-to-cart → drawer, search, wishlist, newsletter success, mobile menu/bar all exercised.

### Phase 7 — Policies, 404, robots, favicon, confetti (2026-10-30)
- **`/policies/`** (`src/pages/policies.astro`): hero + sticky side nav (horizontal scroll pills on mobile) with anchors `#shipping`, `#returns`, `#workshops`, `#privacy`, `#terms` (ids on the `h2`s, `scroll-mt-28`; kept as direct `.prose-craft` children so its `> * + *` spacing applies). Copy reflects locked decisions: Nairobi KES 300 / free over KES 4,500, East Africa quoted at checkout, free gift from KES 5,000, dispatch 3–5 working days, 14-day returns (matches `contact.astro` + product page), refunds to M-Pesa/card in 7 working days, workshop cancel ≥48h for refund/transfer, Kenya Data Protection Act 2019, KES pricing. **Draft copy — workshop 48h rule, cut-to-length/opened-item exclusions and 7-day refund window were assumed, need user confirmation.** Ends with WhatsApp + contact CTA card.
- **`404.astro`**: noindex, big "4 0 4" (tilted marigold 0), "This page unravelled like a loose stitch", search button (`data-search-open` → existing overlay), home link, 4 shortcut cards (shop, workshops, DIY kits, contact). @astrojs/sitemap excludes 404 by default.
- **`src/pages/robots.txt.ts`**: static endpoint; `Allow: /`, disallows cart/checkout/order-confirmation/wishlist/styleguide, `Sitemap:` built from `site` (`SITE_URL`).
- **`public/favicon.svg`**: poppy rounded square, cream heart, marigold dot. SVG only — no `.ico`/apple-touch-icon yet.
- **`og:locale`** now `en_KE` in `BaseLayout.astro`.
- **Confetti** on `/order-confirmation/`: dependency-free canvas burst (160 pieces from both lower corners, brand colours, ~3.6s fade, canvas removed after). Skipped under `prefers-reduced-motion`; fires once per order via `sessionStorage` key `craft-confetti-<order>` so reloads don't re-fire.

### Phase 6 — Workshop detail + booking (2026-10-28)
- `src/pages/workshops.astro` moved to `src/pages/workshops/index.astro` so `[slug].astro` can sit beside it; route URLs unchanged.
- **`/workshops/[slug]/`** (new): breadcrumbs, badges, date/time/where/skill grid, image, description, "Good to know", sticky booking card with seats bar, WhatsApp question link, and `Event` JSON-LD.
- **`WorkshopBooking.tsx`** (new React island):
  - Paid: calls `addItem` with the workshop's ticket product ID, then dispatches `cart:open` so the cart drawer opens. Button shows the real price ("Save my spot — Ksh 3,500").
  - Free: name/email RSVP form, stores submissions in localStorage under `craft-rsvps-v1`, shows a confirmation. Demo mode only — with `PUBLIC_WC_STORE_URL` set it POSTs to `craft/v1/rsvp` instead (Phase 8, 2026-10-30).
- **Workshop tickets** (`demoProducts` IDs 501–503, slugs `workshop-ticket-202/203/204`): match each paid workshop's `wooProductId`, prices KES 3,500 / 1,500 / 2,800, stock mirroring seats left. New `Product.catalogHidden` keeps them out of `/shop/`, search, category counts and sitemap; `Product.isVirtual` makes the demo cart skip delivery for ticket-only carts.
- **Listing fixes:** `/workshops/` cards now show the price (`Ksh 3,500 · 6 left` / `Free · 18 left`) and link to the detail page; the featured CTA and home workshop CTA now open `/workshops/<slug>/` instead of 404ing `/shop/workshop-ticket-<id>/` links.
- **Verified against the running dev server (headless Chrome):** detail page 200, paid add-to-cart opens the drawer with the ticket, `/cart/` shows it with free delivery, free RSVP confirms; screenshots at 1440 and 390 look correct. `check`/`build` left for the user to run.

### Phase 6 — DIY kits landing + studio cancellation (2026-10-28)
- **`/diy-kits/`** (new): evergreen commercial landing page — hero with "Inside the box" panel, kit grid from `getProducts({ category: "diy-kits" })` (4 kits: Embroidery Hoop, Crochet Starter, Paint & Sip at Home, Weekend Workshop), "Why a kit", three-step "How it works", FAQ accordions (`<details>`) and a closing olive CTA. Carries `CollectionPage` + `FAQPage` JSON-LD.
- Header mega-menu "Shop DIY kits" promo now points at `/diy-kits/` (the category card and shop links still use `/shop/?category=diy-kits`).
- **`/studio/` cancelled.** No studio/private-hire offering exists, so the page was dropped rather than built. Removed `demoPages.studio`; changed "studio visits" copy in `contact.astro`, `about.astro`, `order-confirmation.astro`, and "From the studio" on the journal index/back link. Product names, journal copy and UGC handles that happen to mention "studio" are untouched.
- Verified `/diy-kits/` on the dev server: 200, 4 kit cards, 5 FAQ accordions (first opens), header link `/diy-kits/`, no horizontal overflow at 1440/390; only console error is the known missing `/favicon.svg`.

### Shop filters + categories (rebuilt 2026-10-28 — query params, no dynamic routes)
- `src/pages/shop/category/[slug].astro` **deleted**. There is now only `src/pages/shop/index.astro`; category browsing is `/shop/?category=<slug>` (client-side filtered, not a separate static page/SSG route — no per-category `<title>`/meta anymore, a conscious tradeoff).
- `src/components/store/ShopFilters.tsx` now owns **both** the category pill row and the sidebar filters (moved out of the `.astro` pages). On mount it reads `category`/`fresh`/`sale`/`max`/dynamic-filter keys from `location.search`; every state change writes back via `history.replaceState` — filter state is shareable/bookmarkable.
- Category pills are real `<a href="/shop/?category=...">` (new-tab/middle-click still work) with `onClick` `preventDefault` + local state update for same-page filtering. Sticky at `top-18` (= header height), full-width toolbar look, `z-40` (header is `z-50`).
- Sidebar: `lg:sticky lg:top-38` — **user-verified working** (2026-10-28).
- All 9 internal links that pointed at `/shop/category/<slug>/` (Header mega-menu + mobile menu, `SearchOverlay.tsx`, home page vibes/category links, product page breadcrumb + category chip, `demoVibes` hrefs) now point at `/shop/?category=<slug>`.
- **Shared filters:** Fresh arrivals, Items on sale, Max price slider (KES 500–15,000).
- **Dynamic filters:** driven by `CATEGORY_DYNAMIC_FILTERS` in `src/lib/filters.ts` (paint→Finish/Set Size, stitch-sew→Material/Skill Level, clay→Clay Type, sketch→Medium, kids→Age Group, diy-kits→Craft Type, bundles→Bundle Type).
- **Product card** (shop grid) now matches the same visual language as `ProductCard.astro` (home page): image, "Sale"/"Sold out" badge chips (not a custom `-N%` pill), hover arrow-reveal button, category label + title left / price right. Shop grid keeps its own `rounded-3xl border p-4 shadow-sm` card frame (user asked this back after the borderless home-style felt squeezed with 18 items in a 3-col grid) — home's `ProductCard.astro` stays borderless.

### Price formatting (2026-10-28)
- `formatMoney()` in `src/lib/format.ts` now always renders **0 decimal places** (no more `.00`) — this is the single source every price display routes through, so the change applies site-wide in one place.
- New `formatCardPrice()` — for any card/row context (shop grid, home featured grid, `Bestsellers.astro`), a price range or multi-variation product shows as `From Ksh 1,350` instead of a long `Ksh 1,350.00 – Ksh 1,450.00` string that was overflowing card width. `formatProductPrice()` (full range) is kept for anywhere with more room, e.g. product detail page.
- Card text sizes were also reduced (category label, title, price) to cut overflow risk with longer product names.

### Filters now fully functional (2026-10-28)
- **Dynamic category filters now actually match products.** `Product` type (`types.ts`) gained `attributes?: Record<string, string>` and `isNew?: boolean`. All 16 of 18 demo products that plausibly have one got hand-assigned attribute values matching `CATEGORY_DYNAMIC_FILTERS` keys/options in `filters.ts` (e.g. `{ finish: "Matte", size: "12-Set" }` for paint products, `{ material: "Cotton", skill: "Beginner" }` for stitch-sew, etc. — multi-category products like the Embroidery Hoop Kit carry attribute keys for *each* category they belong to). Two products (Studio Brush Set, Canvas Trio) deliberately carry no `finish`/`size` — those options describe paint sheen/tube counts and don't apply to tools/canvases, so they're correctly excluded when a user filters by them. `ShopFilters.tsx`'s match loop: a product passes a dynamic-filter group if `product.attributes?.[key]` is included in the user's selected options for that key (OR within a group, AND across groups).
- **Fresh arrivals is now real**, not `product.id % 2 !== 0`. 6 of 18 demo products have `isNew: true` (102, 104, 105, 108, 111, 117 — spread across paint/stitch/sketch/bundles). Filter check is simply `if (fresh && !product.isNew) return false`.
- Sidebar "Items on sale" checkbox and the shop-grid card's "Sale" badge still use **two different on-sale definitions** (checkbox: `regular_price > price`; card badge: `sale_price > 0 && sale_price < regular_price`, matching `ProductCard.astro`). They agree for all current demo data but remain structurally inconsistent — not addressed today, low priority since behavior is correct either way for existing data.

### Hero image issue (resolved 2026-10-27)
- The hero image renders correctly: verified in a headless Chrome capture of the built site at 1440px and 390px.
- Mobile note: the 1927×816 collage becomes a ~165px strip at 390px wide; the copy sits below it. Consider a taller mobile treatment later.
- Original code path: `<Image src={heroImage} ... class="block h-auto w-full" fetchpriority="high" />`.

### Recent session changes (visual pass)
- **Phase 2 UI kit added** — see below.
- Replaced teal with olive; added `olive` tokens.
- "The collection" band uses `bg-butter-50`.
- Workshop/meetups section rebuilt with texture, no seats pill, progress bar, icon date/time.
- Added `/workshops/` listing (upcoming, remaining, past).
- CTA banner using `banner.png` with right-aligned text/button.
- Footer: social icons + real payment logos; flat cream background.
- Journal dates now include time.
- Shop filter sidebar + dynamic filter configs added.

### UI kit (Phase 2)
All in `src/components/ui/`:
- `Icon.astro` — wrapper around `astro-icon`; default `h-4 w-4`, `aria-hidden` unless `label` is passed.
- `Logo.astro` — stitched-heart + paint-dot mark; `href` (default `/`), `wordmark` (default true).
- `Badge.astro` — flat pill; tones `clay|ink|olive|poppy|marigold|bubblegum|cream`; sizes `sm|md`.
- `Sticker.astro` — shadowed sticker; tones `poppy|marigold|bubblegum|olive|cream|ink`; `rotate="left|right|none"`.
- `WavyDivider.astro` — wave band using `currentColor`; `flip` rotates 180°.
- `Ticker.astro` — marquee with duplicated track; `items`, tones `poppy|olive|ink|butter|cream`, `rotate`, `compact`, `speed`.
- `lucide-react` installed for React islands (`ShoppingBag` in `AddToCart`, `CartView`).
- Preview: `/styleguide/` (noindex, excluded from sitemap) — palette, type, buttons, badges, stickers, tickers, waves, icons, cards.
- New tokens: `shadow-chunky`, `shadow-sticker`, `ease-bounce`; `.card-hover`; buttons now lift on hover and settle on active.

---

## 6. Known issues / broken links

| Issue | Where | Notes |
|---|---|---|
| `.astro/` owned by root | repo root | Created by the Docker dev container; `astro dev --background` fails with `EACCES ... .astro/dev.log`. Fix: `sudo chown -R $USER .astro` (or set `user:` in `docker-compose.yml`). Blocked Phase 7 browser verification. |
| Policies copy is draft | `policies.astro` | Needs owner sign-off before launch (refund windows, workshop cancellation rule). |
| Favicon SVG only | `public/favicon.svg` | No `.ico` / `apple-touch-icon.png` fallback yet. |
| Category pills misplaced | shop pages | Must move into right column above count |
| Hero mobile crop | `index.astro` | Renders correctly; 1927×816 collage is a ~165px strip at 390px wide |
| Static `<img>` still used | `ShopFilters.tsx`, `ProductCard.astro`, search/wishlist/cart islands | Mostly remote placeholder URLs; convert local assets to `<Image />` where possible |
| Live product fields not mapped | `woocommerce.ts` `normalizeProduct()` | Live Store API products get no `attributes` / `isNew` / `isVirtual` → shop dynamic filters + "Fresh arrivals" match nothing with a real store. Proposed mapping in `docs/store-data-contract.md` ("Open gap"). Decide before launch. |
| CMS email needs SMTP | live WordPress | Contact, RSVP, order emails rely on `wp_mail()`; install an SMTP plugin on Host Africa. Locally they go to Mailpit. |
| Wishlist is device-local | `wishlist-store.ts` | localStorage only; no account sync |
| Maker wall falls back to demo | `getUgcPosts()` in `wordpress.ts` | Reads `craft/v1/ugc`; returns `demoUgc` only when `WP_URL` is unset or the request fails. Connected + zero posts → empty → home UGC section hidden. Posts without a featured image are never returned. |
| Sale-detection inconsistency | `ShopFilters.tsx` sidebar filter vs. card badge | See "Filter limitations" above — two different on-sale conditions coexist. |

---

## 7. Pending backlog (ordered)

1. **Review the hero on mobile** — image renders, but crops to a thin strip at 390px; consider a taller mobile treatment.
2. Convert remaining eligible local `<img>` to `<Image />`; document remote cases.
3. Harmonize the sale-detection inconsistency noted above (sidebar checkbox vs. card badge use different conditions — currently harmless but structurally duplicated).
4. ~~Add policies page, 404, robots.txt, favicon, fix `og:locale`~~ — done 2026-10-30 (Phase 7); policy copy awaiting sign-off.
5. ~~Build Phase 6 leftovers (`/diy-kits/`, `/studio/`)~~ — done 2026-10-28: `/diy-kits/` built; `/studio/` cancelled (no studio offering).
6. ~~Phase 8 WordPress mu-plugin + docs~~ — done 2026-10-30 (user-verified). **Next: Phase 9** deploy/QA (workflow must listen for `repository_dispatch` `wordpress_update`).
7. Map live Store API product fields (`attributes`, `isNew`) in `normalizeProduct()` — see Known issues.
8. Replace placeholder photography/contact details before launch.
9. Consider whether `getBestsellers()`'s demo sort (by `reviewCount`) is good enough long-term, or should factor in `rating` too.

~~Move category pills into right column~~ — superseded: pills now live inside `ShopFilters.tsx` as a full-width sticky toolbar above the two-column grid (query-param driven, 2026-10-28), not inside the right column as originally asked. Revisit if the full-width placement still isn't what's wanted.
~~Add home vibes bubbles + UGC wall~~ — done 2026-10-28 (see Current work state).
~~Wire up or remove orphaned Bestsellers.astro~~ — wired in 2026-10-28, replacing the old plain featured-product grid on the home page.

---

## 8. Assets

| Asset | Path | Used for |
|---|---|---|
| **Real logo** (2026-10-28) | `src/assets/images/craftandcolours-logo.png` | Script-style red wordmark, 336×68 transparent PNG. Now the site's actual logo — see `src/components/ui/Logo.astro` (used in `Header.astro` and `/styleguide/`). Replaced the old placeholder heart-icon-in-circle + typed "Craft & Colours" text mark. |
| Hero collage | `src/assets/images/landing-page-hero-image.png` | Home hero + default OG image |
| CTA banner | `src/assets/images/banner.png` | Was used for the pre-footer CTA card; user removed that section manually (2026-10-28) — **asset now unused anywhere**, candidate for deletion if confirmed dead |
| UGC background | `src/assets/images/ugc_bg.png` | UGC pinboard section background (craft flat-lay photo) |
| Brush texture | `src/assets/images/brush-stroke-texture.jpg` | Workshop section background |
| Mustard yarn | `src/assets/images/mustard-yarn.png` | Journal decorator |
| Vibe drawings | `src/assets/images/vibes/{painting,crocheting,kids-craft,art-stash}.png` | Home "Shop by creative vibe" circles (via `vibeArt` map in `index.astro`, keyed by vibe slug). Transparent black line art, 1536×1024 — needs a light fill behind it (the vibe `accent` pastel). |
| Lavender paper | `src/assets/images/textured-lavendar-paper.png` | Home journal section background (via `getImage`, webp). 2.4 MB source, avg colour ≈ `#bea0c4` |
| Rainbow yarn | `src/assets/images/rainbow-yarn-decorator.png` | Available, currently unused |
| Pastel heart | `src/assets/images/pastel-chalk-heart.png` | Decorative accent |
| Payment logos | `src/assets/images/payment-methods/{mpesa,visa,mastercard}.svg` | Footer |
| Icons | `src/assets/icons/` + `lucide` + `simple-icons` | UI + socials |

Remote images are allowed from `placehold.co` (`astro.config.mjs → image.domains`). Product images currently point at placeholders until real photography arrives.

**Still needed from the user:** product pack shots + hands-in-action shots, 3–4 workshop photos, real contact details (domain, email, WhatsApp, handles), payment provider choice, newsletter provider, real workshop schedule. (Vibe images and UGC images are now covered by placeholders — `demoVibes` and the new `demoUgc` — not blocking, but still placeholder.)

---

## 9. Codebase map

```
src/
  components/
    Breadcrumbs.astro
    Footer.astro              # newsletter band, socials, payment logos, hours, concierge
    Header.astro              # ticker, mega-menu, search/wishlist/cart triggers, mobile menu
    MobileBar.astro           # mobile sticky Shop / Workshops / WhatsApp bar
    ProductCard.astro
    SectionHeading.astro
    ui/
      Badge.astro             # flat pill labels
      Icon.astro              # astro-icon wrapper
      Logo.astro              # stitched-heart mark + wordmark
      Sticker.astro           # shadowed rotated sticker
      Ticker.astro            # marquee announcement band
      WavyDivider.astro       # section wave
    store/
      AddToCart.tsx
      CartCount.tsx
      CartDrawer.tsx          # global cart drawer + free-gift progress
      CartView.tsx
      CheckoutForm.tsx
      ContactForm.tsx
      NewsletterForm.tsx      # footer newsletter band (client-only confirmation)
      ProductGallery.tsx
      SearchOverlay.tsx       # ⌘K product search portal
      ShopFilters.tsx         # category pills + sidebar filters + product grid, URL-query-param driven
      WorkshopBooking.tsx     # paid add-to-cart ticket + free RSVP form
      WishlistCount.tsx
      WishlistToggle.tsx
      WishlistView.tsx
  layouts/BaseLayout.astro    # SEO/meta, skip link, header/footer
  lib/
    demo-data.ts              # categories, products, workshops, vibes, UGC posts, testimonials, posts, pages
    filters.ts                # CATEGORY_DYNAMIC_FILTERS config
    format.ts                 # money + date/time formatting (formatMoney, formatCardPrice, formatProductPrice, ...)
    wishlist-store.ts         # localStorage wishlist + change event
    workshops.ts              # getWorkshops() — craft/v1/workshops via WP_URL, demo fallback (no memo — a memo froze the demo fallback in dev); upcoming/past helpers
    woocommerce.ts            # Store API / demo fallback, getProducts/getCategories
    wordpress.ts              # posts/pages (wp/v2), craftGet() for craft/v1, getUgcPosts()
    types.ts
  pages/
    index.astro               # hero, bestsellers, vibes bubbles, workshop, shop story, UGC wall, journal (lavender paper bg)
    shop/index.astro          # single shop page; category/filters via ?category= and other query params
    shop/[slug].astro
    workshops/index.astro      # listing + featured session
    workshops/[slug].astro     # session detail + booking/RSVP
    diy-kits.astro             # evergreen DIY kit landing page + FAQ
    policies.astro             # shipping / returns / workshops / privacy / terms
    404.astro                  # not-found page (noindex)
    robots.txt.ts              # robots endpoint w/ sitemap URL
    journal/index.astro, journal/[slug].astro
    about.astro, contact.astro
    cart.astro, checkout.astro, order-confirmation.astro   # confirmation fires confetti once per order
    wishlist.astro            # saved items (noindex, device-local)
    styleguide/index.astro    # internal component preview (noindex)
  styles/global.css           # tokens, btn styles, marquee, utilities
astro.config.mjs              # react, sitemap, tailwind, astro-icon, image domains
```

```
wordpress/
  mu-plugins/craft-colours.php        # loader (mu-plugins only auto-load top-level files)
  mu-plugins/craft-colours/includes/  # helpers, install (tables), cors, security, contact, newsletter,
                                      # workshops (CPT + /workshops + /rsvp), ugc (CPT + /ugc), free-gift,
                                      # low-stock, rebuild (GitHub repository_dispatch), admin (Subscribers/Settings)
  local/mailpit.php                   # LOCAL DOCKER ONLY — routes wp_mail to Mailpit; never upload
  docker-compose.yml                  # local WP + Woo + Mailpit + wp-cli (profile "tools") test stack
docs/
  wordpress-local.md                  # step-by-step local test guide + curl checklist
  wordpress-setup.md                  # production CMS setup (Host Africa, wp-config, Woo settings, cron, SMTP)
  store-data-contract.md              # env vars, Store API usage, craft/v1 endpoint shapes, rebuild event
```
Empty/skeleton: `.github/workflows/` (Phase 9), `public/images/` (empty).

---

## 10. Data & integrations

- `src/lib/woocommerce.ts` chooses live Store API when `PUBLIC_WC_STORE_URL` is set, else demo data. `hasStore` drives the "Demo catalogue" banner in the header.
- Cart state lives in the browser (demo state in `src/lib/cart-api.ts`); checkout posts to Store API when connected.
- `src/lib/wordpress.ts` serves journal posts/pages from WordPress when `WP_URL` is set.
- Prices in the Store API are minor units — divide by 100 for KES display.
- `formatDate` (`src/lib/format.ts`) outputs date + time for journal/workshop cards.

### Environment (`.env.example`)
```
SITE_URL=https://craftandcolours.co.ke
PUBLIC_WC_STORE_URL=https://cms.craftandcolours.co.ke
WP_URL=https://cms.craftandcolours.co.ke
PUBLIC_CONTACT_EMAIL=hello@craftandcolours.co.ke
PUBLIC_WHATSAPP=+254700000000
PUBLIC_INSTAGRAM=craftandcolours
PUBLIC_FACEBOOK_URL=https://www.facebook.com/craft.colours.ke
```
These are placeholders — confirm real values before launch. Note the stray backticks around `PUBLIC_FACEBOOK_URL` in `.env.example`.

---

## 11. Commands & gotchas

```zsh
# Astro 7 needs Node >= 22.23.4; known-good is v24
eval "$(fnm env --shell zsh)" && fnm use v24.14.0

npm run check   # astro check
npm run build   # astro build (static, dist/)
npm run dev     # astro dev --background
npm run preview # preview built site
```

Gotchas:
- Running under Node 22.12.x caused `Bus error (core dumped)` during `astro check/build`.
- `trailingSlash: "always"` — internal links must end with `/`.
- Tailwind 4 is configured via `@tailwindcss/vite`, tokens use `@theme` in `global.css` (no `tailwind.config.js`).
- `src/lib/filters.ts` currently imports an unused `Product` type (hint only).

### Docker + zrok for sharing dev with a client (2026-10-28)
- `Dockerfile.dev` + `docker-compose.yml` added at repo root — **local-dev-sharing tooling only**, unrelated to the Phase 9 production deploy plan (GitHub Actions → Host Africa shared/Passenger, still static output, no adapter). Don't conflate the two.
- `app` service: `node:24-alpine`, runs `astro dev --host 0.0.0.0 --port 4321`. Vite (which Astro's dev server wraps) rejects requests whose `Host` header doesn't match a known value by default — a zrok tunnel's `*.share.zrok.io` domain fails that check, producing a 403 "Blocked request" error.
  - **The fix is in `astro.config.mjs`, not a CLI flag**: `vite: { server: { allowedHosts: true } } }` (dev-only, no effect on `astro build`/production). Tried `astro dev --allowed-hosts true` / `--allowed-hosts=true` first per the CLI docs — **both failed in real testing** (verified: still 403'd a spoofed `Host` header with `docker compose build/up` + `curl -H "Host: ..."`). Root cause found by reading the shipped source, `node_modules/astro/dist/cli/flags.js:20`: the CLI always receives the flag's value as a JS *string* (even literally `"true"`), so it always takes the `flags.allowedHosts.split(',')` branch → `["true"]` (a literal, useless hostname), never the boolean-`true` branch the docs describe — that branch is only reachable from `astro.config.mjs`, where a real JS boolean can be passed. This is a real discrepancy between Astro's CLI reference docs and actual 7.4.2 behavior worth knowing if it comes up again.
  - Retested after moving the fix to `astro.config.mjs`: both a normal request and one with a spoofed `Host: craftandcolours.share.zrok.io` header returned 200 — confirmed working, not just configured.
- `zrok` service: `openziti/zrok` image, reaches `app` over the compose network by service name (`http://app:4321`), no `--network=host` needed (that's only for targets on the Docker host's own loopback, confirmed via zrok's docker-share guide). Mounts `${HOME}/.zrok` (outside the repo) for the zrok identity/config — never committed, nothing repo-local to gitignore.
- **One-time setup** (documented as comments in `docker-compose.yml`, not a separate doc file): `docker compose run --rm zrok enable <token>` (token from https://myzrok.io/), then `docker compose run --rm zrok reserve public http://app:4321 --unique-name craftandcolours`. After that, `docker compose up` brings the share back at a **stable** `https://craftandcolours.share.zrok.io` every time. The image's entrypoint is already the `zrok` binary — commands are `enable <token>` / `reserve public ...`, not `zrok enable ...` (easy mistake, double-checked against zrok's compose example before writing).
- Default `command:` for the `zrok` service is `share reserved "craftandcolours" --headless` (stable link). A comment in the file explains the one-line swap to `share public --headless http://app:4321` for a throwaway random-domain link instead, if a fixed URL isn't wanted.
- **Known caveat, not verified in-session:** whether Astro's Vite HMR (live-reload) WebSocket survives the zrok tunnel cleanly. If it doesn't, the client's browser still works, just without auto-refresh on file changes — not a blocker, not addressed.
- **Verified end-to-end, not just written:** `docker compose build app` and `docker compose up -d app` both actually run — image builds clean on `node:24-alpine`, Astro boots and serves real pages inside the container, bound to `0.0.0.0:4321` and reachable from the host. The `zrok` service itself was **not** tested (needs the user's own zrok account token — out of scope for this session to obtain), but the `docker compose config` resolution was checked (UID/GID and `${HOME}/.zrok` interpolate correctly, `depends_on`/shared network wired).
- User reformatted `docker-compose.yml` to 4-space indent and shortened the reserved share name from `craft-and-colours-dev` to `craftandcolours` shortly after this was written — not reverted, now the canonical name referenced above and in the file itself.

---

## 12. Open questions for the user

1. Payment provider for M-Pesa/card (Pesapal, Flutterwave, WooCommerce M-Pesa plugin)?
2. ~~Newsletter provider~~ — decided 2026-10-30: stored in WordPress (`craft_subscribers` table, CSV export). Can forward to Mailchimp/Brevo later.
3. Real contact details: domain, email, WhatsApp, Instagram/Facebook/TikTok handles?
4. Real workshop schedule, prices, capacity — or keep demo dates?
5. Real product photography — when available, and how many products at launch?
6. Should the phase plan stay as-is, or be re-baselined now that the visual direction changed (olive, cream footer, new sections)?

---

## 13. Change log

- **2026-10-30** — **Phase 8 marked done** — user verified it against the local Docker WordPress. Next up: Phase 9 (deployment + QA).

- **2026-10-30** — **Checkout section headings restyled as dividers.** New `SectionDivider` in `CheckoutForm.tsx` (short rule · display-serif title · rule to the edge, `h3`) replaces the uppercase `field-label` headings "Contact", "Delivery address", "Delivery option", "Payment method", which read like input labels. Address step group spacing `space-y-5` → `space-y-8`. "Delivering to" (inside the summary card) left as a label.

- **2026-10-30** — **Postcode optional at checkout.** WooCommerce requires it for KE/TZ by default, so the plugin's new `includes/address-fields.php` sets `postcode.required = false` for KE and TZ via `woocommerce_get_country_locale` (UG stays hidden). `regions.ts` `postcode: 'optional' | 'hidden'`; `CheckoutForm` shows "Postal code (optional)" without `required`. Verified locally: WooCommerce address fields report KE/TZ postcode optional, and Store API accepts KE30 / TZ02 addresses with an empty postcode.

- **2026-10-30** — **Editor support for the plugin.** `wordpress/composer.json` (dev-only `php-stubs/wordpress-stubs` ^6.8 → 6.9.4, `php-stubs/woocommerce-stubs` ^10.0 → 10.9.4; `composer install` run, `composer.lock` created), `wordpress/vendor/` gitignored (also keeps Tailwind's source scan out of it), `.vscode/settings.json` sets `intelephense.files.maxSize` 10 MB (stubs are 4–5 MB; default limit 1 MB silently skips them). Documented in `docs/wordpress-local.md`. vendor is outside `mu-plugins/`, so it isn't mounted into Docker or uploaded.

- **2026-10-30** — **Payment method renamed "Order now, pay on confirmation"** (customer-facing; "Pay via WhatsApp" confused the user — no money moves through WhatsApp, it's only where payment is arranged). Checkout label + button ("Place order — pay on confirmation"), gateway `method_title`/default title, comments and setup doc updated. Gateway id stays `craft_whatsapp`; confirmation URL param stays `pay=whatsapp`.

- **2026-10-30** — **East Africa checkout + "Pay via WhatsApp" for every order (launch).** User decisions: open checkout to **Uganda + Tanzania** besides Kenya; **no online payment at launch** for any order. (1) New `src/lib/regions.ts`: KE (47, default `KE30` Nairobi), UG (128 districts, postcode hidden) and TZ (30 regions) with WooCommerce's own codes, generated from the local Woo `i18n/states.php`. `CheckoutForm` gained a Country select (resets region on change), a region select labelled per country (County / District / Region) and a postcode only where Woo requires it; the summary shows region + country names. (2) Plugin `includes/whatsapp-payment.php` + `class-whatsapp-gateway.php` (loaded on `plugins_loaded`, since Woo loads after mu-plugins): gateway `craft_whatsapp` puts orders **On hold** (Woo reserves stock), empties the cart, redirects to the storefront confirmation, and adds WhatsApp pay instructions + link to customer emails (`CRAFT_WHATSAPP` wp-config constant). Verified locally: registered + the only available gateway; Store API cart lists `craft_whatsapp`; UG address (`UG102` Kampala) accepted. (3) `CheckoutForm`: WhatsApp label/description, button "Place order — pay on WhatsApp", always redirects to `/order-confirmation/?…&pay=whatsapp&total=…`; demo cart now offers `craft_whatsapp`. (4) `order-confirmation.astro`: "Next step · payment" card with a WhatsApp button (prefilled order number + total) and swapped intro copy when `pay=whatsapp`. (5) Copy: policies shipping/privacy/terms and product page no longer promise online card/M-Pesa checkout. (6) **Docker gotcha fixed:** compose mounted single files, which pin the inode, so after a `sed -i` the container kept the old loader. It now mounts the whole `wordpress/mu-plugins/` folder; the Mailpit helper moved to `wordpress/mu-plugins/local-mailpit.php` (no-op unless `WP_ENVIRONMENT_TYPE` is `local`), `wordpress/local/` removed. **Shipping zones are required** (none locally yet) — documented in setup + local guides. Not yet done end-to-end: a full order through the browser.

- **2026-10-30** — **Fixed checkout "Invalid parameter(s): billing_address, shipping_address".** `CheckoutForm.tsx` sent IEBC county numbers (`047` = Nairobi) as `state`; WooCommerce validates against its own Kenyan list — **alphabetical `KE01`–`KE47`, Nairobi = `KE30`** (`woocommerce/i18n/states.php`). County list replaced with Woo's codes (alphabetical, matching dropdown order), default `KE30`. Codes were read from the local Woo install.

- **2026-10-30** — **About page images tuned.** User converted about.astro `<img>` → `<Image>` (new local assets `art-and-craft-shop.jpeg`, `craft-table.png`, `modelling-clay.png`, `basket-of-yarn.png`). Added `widths` + layout-derived `sizes` (shop photo col ≈546px, craft table ≈572px, half-tiles ≈278px at the 1280 container); shop photo `loading="eager"` (above the fold), rest lazy (default). PNG sources are 1536×1024 / ~2 MB — now served as resized WebP. **`art-and-craft-shop.jpeg` is only 365×547** — shown up to ~546px wide, Astro won't upscale → soft on desktop; needs a ~1200px-wide replacement.

- **2026-10-30** — **About page "Come and see" card now marigold** (user: make the site more colourful, using existing palette). `bg-cream-100` → `bg-marigold-500` with two blurred bubblegum/poppy blobs (`-z-10` inside an `isolate` card), eyebrow forced to `text-ink-900` (clay-600 fails contrast on marigold), "Contact the shop" button gets a translucent cream fill + stronger border (hover fill restated as utilities, since utilities beat the `.btn-secondary` component layer).

- **2026-10-30** — **Workshop seats: "taken" meter + fully-booked state.** New helpers in `lib/workshops.ts` (`isFullyBooked`, `seatsTaken`, `seatsFilledPercent`, `isAlmostFull` = ≤3 or ≤20% left) and shared `src/components/WorkshopSeats.astro` (bar fills as seats are **taken**; label "N of M taken · K left"; poppy "Almost full"; solid "Fully booked"; `role="meter"`; `tone="dark"` for olive). Used on home featured workshop, `/workshops/` featured card (new) and detail booking card — replacing the old decreasing "Seats left" progress bars. When full: no RSVP form / booking button anywhere — detail page `WorkshopBooking` shows a "Fully booked" panel with "Join the waitlist on WhatsApp" + "See other sessions" (also flips live on an RSVP 409), eyebrow "Session full", header badge "Fully booked"; home/listing show a "Fully booked" pill + "Join the waitlist" link; listing cards say "· Fully booked" / "Join waitlist". `WorkshopBooking` gained a `title` prop.

- **2026-10-30** — **Maker wall showed demo posts with a live CMS.** Local WP had 1 maker post without a featured image → `/ugc` returned `[]` → `getUgcPosts()` fell back to the 6 demo posts. Now: demo only when WordPress is missing/unreachable; an empty CMS list stays empty and `index.astro` hides the whole UGC section (`ugcPosts.length > 0 &&`).

- **2026-10-30** — **Vibe circles use real line drawings.** `index.astro` imports the 4 PNGs from `src/assets/images/vibes/` into a `vibeArt` map (paint→painting, stitch-sew→crocheting, kids→kids-craft, restock→art-stash, with alt text). Circles keep their light pastel background (`vibe.accent` now also the solid circle fill, not just the blurred halo); drawing rendered with `<Image>` (`object-contain`, `p-3 sm:p-4`, widths 200/320/480) and tilts slightly on hover. Falls back to `vibe.image` for any vibe without a drawing.

- **2026-10-30** — **Fixed "Good to know" box not saving.** Meta box ID and `wp_editor()` ID were both `craft_good_to_know` → TinyMCE attached to the postbox div, so the field never submitted. Meta box now `craft-good-to-know-box`, editor `craftgoodtoknow` (settings editor `craftdefaultgoodtoknow`); POST name unchanged. Rule: never reuse a meta box ID as a `wp_editor()` ID; editor IDs lowercase letters only.

- **2026-10-30** — **Smooth accordions.** The DIY-kits FAQ animation moved to a shared `.accordion` class in `global.css` (`::details-content` height via `interpolate-size` 320ms + 240ms fade; reduced-motion off; native instant toggle fallback). Applied to the product page "Details", "Good to know", "Shipping & returns" and the `/diy-kits/` FAQ (its page-local `<style>` removed). Product-page "+" icons made `inline-block` so the rotate-to-× actually animates (inline spans ignore transforms), with `ease-bounce`.

- **2026-10-30** — **Product page "Details" / "Good to know" from the CMS.** New plugin module `includes/product-content.php`: "Good to know" `wp_editor` meta box on products (`_craft_good_to_know`, `wp_kses_post`), site-wide default in Craft & Colours → Settings → Product pages (option `craft_default_good_to_know`, triggers a rebuild on change), exposed as Store API product `extensions.craft.good_to_know` (verified present on local WP). Frontend: `Product.goodToKnow`; `shop/[slug].astro` — Details = Woo description → short description fallback, Good to know = CMS value; each section hidden when empty; Good to know opens by default if Details is missing. Old hardcoded copy kept only for demo mode (`!hasStore`).

- **2026-10-30** — **Product page image carousel.** `ProductGallery.tsx` rewritten: with 2+ images it's a user-controlled carousel — CSS scroll-snap track (native swipe/trackpad), prev/next pill arrows (wrap around), ←/→ keys, active dot bar, "n / total" counter (aria-live), synced thumbnail strip that scrolls (4 visible, more scroll). Active index derived from track `scrollLeft` (rAF-throttled) so every input stays in sync; smooth scroll off under reduced motion. 1 image → plain image, 0 → "Image coming soon". Images = WooCommerce "Product image" (first) + "Product gallery" via Store API `images[]` — no plugin change needed.

- **2026-10-30** — **Fixed shop results flash on filtered URLs** (e.g. vibe → `/shop/?category=x` with no matches showed all products, then "No pieces match your filters"). Same root cause as the 2026-10-28 pill flash: static HTML is built with neutral filters. `shop/index.astro` now has an inline script (before the island) that sets `data-shop-filtering` on `<html>` when `location.search` is non-empty; global CSS hides `[data-shop-results]` (ShopFilters' `<main>`) with `visibility: hidden` (layout kept); ShopFilters removes the attribute in an effect after `mounted` flips (same commit as the URL filters). 4s timeout fallback if the island never loads. Unfiltered `/shop/` unaffected.

- **2026-10-30** — **Live shop fixes (user's local Docker test).** (1) Store API lists Hidden products by default — ticket + free gift appeared in `/shop/`. All listing calls in `woocommerce.ts` (`fetchAllProducts`, bestsellers, featured, related) now send `catalog_visibility=catalog` (`CATALOG_VISIBILITY` const); verified against local WP: `any` → 3 products, `catalog` → only Test Easel. Categories/search/sitemap follow since they derive from `getProducts()`. (2) Store API names are HTML-encoded (`Paint &amp; Sip`) — product, category and cart-item names now go through `stripHtml()`. (3) `workshops.ts` memo removed — it froze the demo fallback for the dev server's lifetime. Local guide gained `timezone_string Africa/Nairobi`.

- **2026-10-30** — **Free gift cart line (from user's local Docker test).** Plugin `free-gift.php`: records `craft_gift_for` (biggest cart line, "Name + N more") on the gift item, exposes `extensions.craft.{free_gift,gift_for}` on Store API cart items (`woocommerce_store_api_register_endpoint_data`, on `woocommerce_blocks_loaded`), locks quantity (editable false, min/max 1 via `woocommerce_store_api_product_quantity_*`); order line meta now "Free gift: With …". Frontend: `CartItem.freeGift`/`giftFor` (optional, set in `normalizeCartItem`); `CartDrawer`, `CartView` hide stepper + Remove for the gift and show an olive "Free gift · with …" pill + price "Free"; `CheckoutForm` summary shows the same instead of "Qty 1". Also fixed `install.php` erroring during `wp core install` (skip while `wp_installing()` / `!is_blog_installed()`).

- **2026-10-30** — **Phase 8 built (awaiting user test).** User decisions: newsletter stored in WordPress; workshops managed as a WP post type; rebuild via GitHub `repository_dispatch`. New mu-plugin `wordpress/mu-plugins/craft-colours.php` + `craft-colours/includes/` (12 modules, PHP 8.1+): allowlist CORS (`CRAFT_FRONTEND_URL` + `CRAFT_ALLOWED_ORIGINS`) incl. `Cart-Token`/`Nonce` headers and Store API nonce skip for allowlisted origins; security headers + CMS `noindex`, XML-RPC off, `/wp/v2/users` + `?author=` blocked; `POST craft/v1/contact|newsletter|rsvp` (honeypot `website`, per-IP transient rate limits); `craft_workshop` CPT with Session details box (start, end time, kind, skill, location, capacity, linked virtual ticket product) + `GET craft/v1/workshops` in the storefront `Workshop` shape (paid seats = ticket stock, free seats = capacity − RSVPs) + RSVP list/CSV per workshop; `craft_ugc` "Maker posts" CPT + `GET craft/v1/ugc`; free gift auto-added at 0 once subtotal ≥ `CRAFT_FREE_GIFT_THRESHOLD` (default 5000; gift product chosen in Settings; users can't add it themselves); dashboard low-stock widget (Woo low-stock threshold, `wc_product_meta_lookup`); debounced rebuild dispatch (`CRAFT_GITHUB_REPO`/`CRAFT_GITHUB_TOKEN`/`CRAFT_REBUILD_DELAY`, event `wordpress_update`) on content/stock/term changes + RSVPs + admin-bar "Rebuild site"; admin "Craft & Colours" menu (Subscribers + CSV, Settings, rebuild status). Custom tables `craft_subscribers`, `craft_rsvps` via versioned `dbDelta`. Frontend: `NewsletterForm` + `WorkshopBooking` RSVP POST to the plugin when `PUBLIC_WC_STORE_URL` is set (demo behaviour unchanged otherwise, honeypots added); `workshops.ts` + new `getUgcPosts()` read WordPress with demo fallback; home UGC wall uses `getUgcPosts(6)`. Docs: `docs/wordpress-local.md` (Docker WP + Woo + Mailpit + wp-cli stack in `wordpress/docker-compose.yml`, seed script, 14-step curl checklist, Store API free-gift test), `docs/wordpress-setup.md`, `docs/store-data-contract.md`. `.env.example` backticks fixed. Not run against real WordPress — my Docker smoke test was interrupted (Docker Hub timeout); user is running the local guide. Found + documented gap: live `normalizeProduct()` doesn't map `attributes`/`isNew`/`catalogHidden`.

- **2026-10-30** — **Home section order swapped:** "The shop" story now sits right after the workshop section and "From the journal" (lavender) is the last section before the footer. Order is now hero → bestsellers → vibes → workshop → shop story → UGC wall → journal.
- **2026-10-30** — **Home journal section now on lavender paper.** `index.astro` journal section: `bg-cream-100/60` → `textured-lavendar-paper.png` via `getImage` (webp) with `bg-[#bea0c4]` fallback. Contrast fixes scoped to that section: eyebrow forced to `ink-900` via `[&_.eyebrow]:text-ink-900` (no `SectionHeading` change), meta + excerpt `ink-300`/`ink-500` → `ink-800`, title hover `clay-600` → poppy underline. Footer deliberately left cream.

- **2026-10-30** — **Phase 7 remaining items built.** Added `/policies/` (shipping, returns, workshop bookings, privacy, terms — draft copy, anchors match existing footer/contact/product links), `404.astro`, `robots.txt.ts` endpoint, `public/favicon.svg`, `og:locale` → `en_KE`, and a dependency-free confetti burst on `/order-confirmation/` (reduced-motion aware, once per order). Couldn't run the dev server to verify — `.astro/` is root-owned from the Docker container. `check`/`build` left for the user.

- **2026-10-28** — **Phase 6, part 2: `/diy-kits/` landing page + studio removal.** New evergreen `/diy-kits/` page: hero with "Inside the box" panel, live kit grid from `getProducts({ category: "diy-kits" })`, "Why a kit", three-step "How it works", five FAQ accordions and a closing CTA, with `CollectionPage` + `FAQPage` JSON-LD. FAQ items animate open/closed via `::details-content` + `interpolate-size` (300ms), with a native instant-toggle fallback and reduced-motion opt-out. Header mega-menu "Shop DIY kits" promo now links to `/diy-kits/`. **`/studio/` was cancelled** — the business has no studio/private-hire offering — so `demoPages.studio` was removed and "studio visit" copy changed on contact, about, order confirmation and the journal index. Verified on the dev server: 200, 4 kit cards, FAQ open/close, correct header link, no horizontal overflow at 1440/390.

- **2026-10-28** — **Phase 6, part 1: workshop detail + real paid/free booking.** The workshop CTA links no longer point at nonexistent `/shop/workshop-ticket-<id>/` routes. `/workshops/` cards now show prices (`Ksh 3,500 · 6 left` / `Free · 18 left`) and link to a new `/workshops/[slug]/` page with date/time/location/skill, seats bar, description, `Event` JSON-LD and a sticky booking card. Paid sessions add a hidden demo ticket product (IDs 501–503, matching each workshop's `wooProductId`) to the cart via `WorkshopBooking.tsx` and open the cart drawer; free sessions show an RSVP form (name/email) that saves to localStorage and confirms on screen. Added `Product.catalogHidden` (keeps tickets out of shop/search/category counts/sitemap) and `Product.isVirtual` (demo cart skips delivery for ticket-only carts). Moved `workshops.astro` → `workshops/index.astro` for the dynamic route. Verified on the running dev server with headless Chrome: paid add-to-cart → drawer → `/cart/` with free delivery, free RSVP confirmation, and 1440/390 screenshots. (DIY kits + studio decision follow in part 2 below.)

- **2026-10-28** — **Phase 5 completed: real filters, quick-add, product-page polish.** `Product` type gained `attributes?: Record<string, string>` + `isNew?: boolean`; 16/18 demo products backfilled with attribute values matching `CATEGORY_DYNAMIC_FILTERS` (2 — Studio Brush Set, Canvas Trio — deliberately left without finish/size, N/A for tools/canvases), 6 flagged `isNew: true`. `ShopFilters.tsx`'s dynamic-filter matching and fresh-arrivals checkbox now use real data instead of a no-op loop / `id % 2`. Added a quick-add-to-cart button to shop-grid cards (`src/components/store/ShopFilters.tsx`) — restructured the card's image block so the button is a sibling of the product-link `<a>` rather than nested inside it (avoids invalid nested-interactive-element HTML and click-propagation hacks); button is always visible (not hover-gated) so it's reachable on touch devices, unlike the purely-decorative `ArrowUpRight` hint; only rendered for in-stock, non-variable products (`!soldOut && !product.hasOptions`) — variable products (e.g. Chunky Cotton Yarn) route to the product page to pick a variant instead; calls `addItem` from `cart-store.ts` directly (module-level singleton, so `CartCount`/`CartDrawer` update automatically) and dispatches `cart:open` on success. Product page (`shop/[slug].astro`) gained: a star-rating + review-count row (reusing the `lucide:star` pattern from `Bestsellers.astro`), a WhatsApp contact link (same `wa.me` pattern as `Header.astro`/`Footer.astro`, prefilled with the product name), and real color swatches in `AddToCart.tsx` (a `SWATCH_COLORS` lookup renders actual colored circles for attribute groups matching `/colou?r/i`, replacing plain text pills — falls back to text pills for any non-color variation attribute).
- **2026-10-28** — **Home workshop section confirmed as single-featured-workshop by design, not a carousel.** A multi-workshop carousel was briefly built and immediately reverted at user request ("revert that change" → "I want it that way. Remove the idea of a carousel of workshop in the index page"). `index.astro`'s workshop section is `featuredWorkshop = upcomingWorkshops[0]` shown as one large detail card (image + location/duration/skill grid + seats bar + CTA) — this is the **intended final design**, not a stand-in for a future carousel. The Phase 4 scope row (section 4) now reads "featured workshop" instead of "workshop carousel" to match. If a multi-workshop browsing experience is ever wanted on the home page later, that would be a new ask, not "finishing" this one.
- **2026-10-28** — **Smooth (inertia-style) scroll added to the home page only.** Installed `lenis@1.3.27` (new runtime dependency, `package.json`). `src/pages/index.astro` has a page-scoped `<script>` at the bottom that initializes Lenis in a `requestAnimationFrame` loop; guarded behind `prefers-reduced-motion`. Astro client scripts are per-page bundled, so this does **not** affect any other page — site-wide `scroll-behavior: smooth` in `global.css:49` (anchor-link easing only) is untouched and separate. Not yet build-verified by the user. Possible future follow-up (not done): anchor `<a href="#...">` clicks still trigger native CSS smooth-scroll rather than Lenis's own `scrollTo`, which could feel slightly inconsistent — low risk, not addressed since out of the original ask's scope.
- **2026-10-28** — **Real logo wired in.** `src/components/ui/Logo.astro` rewritten to render `src/assets/images/craftandcolours-logo.png` (the actual business logo, a 336×68 script-style red wordmark PNG) via Astro's `<Image />`, replacing the old placeholder mark (an olive circle with a hand-drawn heart SVG + poppy/marigold dot accents, plus a separately-typed "Craft & Colours" text label). The `wordmark` prop now only toggles the "Village Market · Nairobi" location subtitle (there's no separate icon-only version of the real logo, so the old icon/text split doesn't apply anymore). Only live usage is `Header.astro:89` (`<Logo />`, no props) — propagates automatically. `/styleguide/index.astro` also references it (internal preview page, not touched beyond what the shared component change does).
- **2026-10-28** — **Fixed category-pill hydration flash** in `ShopFilters.tsx`: direct navigation to `/shop/?category=<slug>` showed "All pieces" highlighted for an instant, then visibly jumped to the correct pill. Root cause: the component (`client:load`, static build, no SSR adapter) seeded `category`/`fresh`/`onSale`/`maxPrice`/`dynamicFilters` via a lazy `useState(readParamsFromUrl)` initializer that branched on `typeof window === 'undefined'` — baking `category: ''` ("All pieces" active) into the build-time static HTML, then recomputing the real value synchronously on client hydration, causing a React hydration-mismatch patch. Fix (planned via `/home/amani-mavu/.claude/plans/when-i-navigate-to-harmonic-puzzle.md`, "neutral-until-mounted" approach, matching the existing `mounted`-flag pattern in `SearchOverlay.tsx`): all five pieces of state now seed with hardcoded neutral defaults (identical on SSR + first client render), a new `useEffect(() => {...}, [])` applies the real URL-derived values once post-mount, the existing URL-sync effect gained a `mounted` guard to avoid clobbering the query string before hydration completes, and only the pill's `className`/`aria-current` got an extra `mounted &&` guard (checkboxes/slider didn't need one — their neutral defaults are already visually correct, no default-collision like `category === ''` matching "All pieces"). Rejected alternative: true SSR for `/shop/` (zero flash, but requires adding an SSR adapter — out of scope, site is 100% static for Host Africa hosting). Not yet build-verified by the user.
- **2026-10-27** — **Mega-menu opens on hover:** 80ms intent delay, 160ms close grace, pointer stays inside the panel (no flicker crossing the gap), mouse clicks keep it open, and `focusin`/Enter still work for keyboard users. Touch keeps native tap-to-toggle. The full-width wrapper is `pointer-events-none` and only the panel is `pointer-events-auto`, so the transparent margins around the panel don't block page clicks (clicking beside it closes the menu).
- **2026-10-27** — **Mega-menu redesign:** full-width panel (max 68rem) with category cards, icons + blurbs, olive count badges, an all-supplies total badge, a DIY-kit promo, and delivery/gift info. The panel is absolutely anchored to the sticky header, so it stays centered and clear of the nav trigger at 1024/1280/1440.
- **2026-10-27** — **Phase 3 complete (awaiting review):** global shell built — shop mega-menu with category counts, ⌘K/Ctrl+K search overlay, wishlist (localStorage store, toggle, count, `/wishlist/`), cart drawer with free-gift progress bar, header wishlist/cart triggers, WhatsApp pills, rich mobile menu, mobile sticky Shop/Workshops/WhatsApp bar, footer newsletter band + WhatsApp concierge. Added drawer/modal animations and reduced-motion guards; fixed header overflow at 768/1024; hidden native search cancel button; corrected MasterCard logo aspect. Verified `check` 0/0/0, build 39 pages, responsive screenshots 390–1440.
- **2026-10-27** — **Phase 2 complete (awaiting review):** added `src/components/ui/` kit (Icon, Logo, Badge, Sticker, WavyDivider, Ticker), installed `lucide-react`, replaced all page-level inline SVGs, added bouncy button/card styles + `ease-bounce`/`shadow-chunky` tokens, integrated ticker (header + hero), new logo, sticker/hero badges, section wave, `/styleguide/` preview (noindex/sitemap-excluded). Verified hero renders; `check` + `build` pass (38 pages). **Doodle arrow discarded at user request** — component and usages removed.
- **2026-10-28** — **Phase 4 home sections completed:** replaced the category-grid stand-in with a real "Creative Vibes" bubbles section (`demoVibes`, circular image + accent-color halo); added a UGC wall section (new `demoUgc` array/type, 6 placeholder posts); added a dedicated home newsletter CTA section (reuses `NewsletterForm.tsx`, distinct copy/styling from the footer band). Discovered `Bestsellers.astro` is fully built but not imported anywhere — flagged as a known issue, not resolved.
- **2026-10-28** — **`Bestsellers.astro` wired into `index.astro`**, replacing the old plain featured-product grid ("The collection" section). Added `getBestsellers(limit)` to `woocommerce.ts` (demo mode sorts `demoProducts` by `reviewCount` desc; live mode requests `orderby=popularity`) and reused `getProducts({ category: 'bundles', limit: 3 })` for the bundles promo panel; `giftThreshold` prop fed from `DEMO_FREE_GIFT_THRESHOLD / 100` (cart-api.ts stores it in cents, component expects plain KES). Phase 4 now fully done.
- **2026-10-28** — **UGC wall redesigned as a pinboard/scrapbook collage** (user asked to make it "more artistic and fun"): tilted polaroid cards (alternating rotation + vertical offset per tile via index-based class arrays), pin-dot accent, `shadow-sticker` → `shadow-chunky` + straighten/lift/scale on hover (`ease-bounce`), two blurred accent-color blobs behind the grid, `Sticker` badge intro instead of a plain `SectionHeading`. User reviewed and confirmed it looks good; ran `npm run build` themselves — successful.
- **2026-10-28** — **UGC section follow-ups:** swapped the flat `bg-cream-100/50` for `src/assets/images/ugc_bg.png` (a craft flat-lay photo, `bg-cover bg-center`) as the section background; removed its `border-y` (was reading as a hard dark line against the photo); added `bg-fixed` for a simple CSS-only parallax effect (note: `background-attachment: fixed` doesn't work on mobile Safari — degrades to a normal static background there, not a bug); briefly added then **removed** a bottom gradient fade (user asked for it off again — photo now cuts off clean at the section edge, no fade). Separately, the newsletter CTA section (built earlier this session) was **removed** at user request after review — see Phase 4 row above.
- **2026-10-28** — **User manually removed** (outside this session's edits, found as a disk change) the WhatsApp concierge card from the footer and the CTA banner section (`banner.png`) that sat before the footer in `index.astro`. Assistant then: (1) cleaned up the now-unused `bannerImage` import in `index.astro`; (2) fixed the resulting empty space at the footer's bottom-right — the "Say hello" column had only 2 list items vs. 4 in "Explore"/"Help", so it was visibly shorter — by adding a "WhatsApp us" link into that column using the `waHref`/`whatsapp` vars in `Footer.astro`, which were themselves leftover/unused after the concierge card's removal. `banner.png` asset itself is now unused anywhere — candidate for removal from `src/assets/images/` if confirmed truly dead.
- **2026-10-28** — **Shop filters/categories rebuilt on query params:** deleted `shop/category/[slug].astro`; `ShopFilters.tsx` now owns the category pill row, reads all filter state from `location.search` on mount and syncs it back via `history.replaceState`; updated all 9 internal links from `/shop/category/<slug>/` to `/shop/?category=<slug>`. User confirmed the sticky sidebar (`lg:sticky lg:top-38`) works as expected.
- **2026-10-28** — **Shop product card redesign:** card now matches `ProductCard.astro`'s visual language (Sale/Sold out badges, hover arrow, price layout) but keeps its own bordered/padded frame per user request after the borderless version felt squeezed at 3-col density. Added `formatCardPrice()` (compact "From X" for price ranges) and reduced card text sizes. `formatMoney()` now always renders 0 decimal places site-wide.
- **2026-10-27** — Created this memory file. Recovered phases 0–9 from the plan-mode transcript. Documented current shop-filter work, known issues (category placement, hero image, 404 links, favicon, `og:locale`), asset map, and backlog.
- **2026-10-27** — Shop filters (shared + dynamic) shipped in `ShopFilters.tsx`; `check`/`build` pass.
- **2026-10-27** — Visual pass: olive theme, workshop section, workshops page, CTA banner, footer socials/payments, journal date+time.
- **2026-10-26** — Phase 0/1 complete: Nairobi catalogue, KES, 7 categories, demo workshops/posts.

---

## 14. Update protocol

At the end of each session:
1. Update **Last updated** and **Current work state**.
2. Move finished items from **Pending backlog** into **Change log**.
3. Add any new **Known issues** or **Locked decisions**.
4. Keep statuses honest — mark partial work as partial.
5. Re-run `npm run check && npm run build` before claiming a phase complete.
