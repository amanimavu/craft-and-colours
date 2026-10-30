# Launch QA checklist

Run this before announcing the store and again after any risky change.
Automated checks live in CI; the manual pass below covers what they cannot.

- Automated: `npm run check`, `npm run build`, `npm run verify`,
  [Lighthouse CI](../.github/workflows/qa.yml), post-deploy
  [`scripts/smoke-test.sh`](../scripts/smoke-test.sh)
- Manual: everything with a checkbox below.
- Record the outcome in [release-candidate.md](release-candidate.md).

---

## 0. Local commands

```bash
npm ci
npm run check
npm run build
npm run verify
```

`npm run verify` reads `.env` the same way Astro does. For a purely local build
(CMS at `localhost:8080`, canonical at `localhost:4321`):

```bash
SITE_URL=http://localhost:4321 ALLOW_UNREACHABLE_CMS=1 npm run verify
```

Never use `ALLOW_UNREACHABLE_CMS=1` for a production deploy — it disables the
guard that stops demo data reaching the live site.

Lighthouse locally (same config as CI):

```bash
npm run build
npx @lhci/cli autorun --config=./lighthouserc.json
# reports land in .lighthouseci/
```

Smoke test any environment:

```bash
SITE_URL=https://craftandcolors.africa bash scripts/smoke-test.sh
```

---

## 1. Functional matrix

Use a fresh browser profile (no cart/wishlist localStorage) and a real phone for
at least the checkout pass.

### Browsing
- [ ] Home: hero image loads, bestsellers, vibes circles, featured workshop,
      shop story, maker wall, journal section — in that order.
- [ ] Header: logo, nav, mega-menu (hover + keyboard + Escape), search pill.
- [ ] `⌘K` / `Ctrl+K` opens search; typing filters; `Enter` opens the first
      result; `Esc` closes and focus returns to the trigger.
- [ ] `/shop/` shows 18 products; filters change the URL (`?category=…`) and
      survive a reload; "Fresh arrivals" and "On sale" return sensible counts.
- [ ] Category pill → correct subset; price slider filters.
- [ ] Quick-add on a simple product opens the cart drawer.
- [ ] Variable product (Chunky Cotton Yarn) opens the product page to pick a
      colour instead of quick-adding.
- [ ] Product page: gallery carousel (arrows, dots, swipe, ←/→), swatches,
      rating row, WhatsApp link, Details / Good to know / Shipping accordions.
- [ ] `/workshops/`: upcoming + past, seats meter, fully-booked state if any.
- [ ] `/diy-kits/`: 4 kits, FAQ accordions.
- [ ] `/journal/` and a post: dates include time, images load.
- [ ] `/about/`, `/contact/`, `/policies/` anchors scroll to the right section.
- [ ] `/styleguide/` is `noindex` and not in the sitemap.

### Cart & checkout
- [ ] Add 3 items; drawer and `/cart/` agree on lines, quantities, totals.
- [ ] Free-gift bar appears; add ≥ KES 5,000 and the gift line appears at KES 0
      (live WooCommerce only — the demo cart shows the bar but no gift line).
- [ ] Remove the last item → empty state, no crash.
- [ ] Checkout: country select switches region labels
      (County / District / Region) and postcode visibility.
- [ ] Kenya + Nairobi + postcode blank → accepted (postcode optional).
- [ ] Uganda (Kampala) and Tanzania (Dar es Salaam) → accepted, no postcode.
- [ ] Shipping: Nairobi KES 300; free over KES 4,500; other zones show
      "cost confirmed on WhatsApp".
- [ ] Payment step shows **Order now, pay on confirmation** only.
- [ ] Place the order → confirmation page, order number, total, WhatsApp button
      with a prefilled message.
- [ ] Confetti fires once; reloading the confirmation does not re-fire it.
- [ ] Order appears **On hold** in wp-admin with stock reserved.
- [ ] Set it to **Processing** → customer email arrives (SMTP configured).

### Workshops, forms, wishlist
- [ ] Paid workshop → "Save my spot" adds the ticket and opens the drawer;
      ticket-only cart has free delivery.
- [ ] Free meetup → RSVP form validates, submits, confirms; the RSVP shows in
      wp-admin and the seat count drops on the next rebuild.
- [ ] RSVP on a full session → blocked with the waitlist message.
- [ ] Newsletter (footer) → success state; subscriber appears in
      **Craft & Colours → Subscribers**.
- [ ] Contact form → success state; message arrives at the shop inbox.
- [ ] Wishlist: heart toggles, count updates, `/wishlist/` lists items, survives
      reload, removing works.
- [ ] Unknown URL → branded 404 with working search and shortcut cards.
- [ ] `robots.txt` lists the sitemap and disallows cart/checkout/confirmation/
      wishlist/styleguide.

---

## 2. Responsive

Check at 390, 768, 1024, 1280 and 1440 px (device toolbar, not just resizing).

- [ ] No horizontal scrollbar on any page (`document.documentElement.scrollWidth
      <= window.innerWidth`).
- [ ] Header: mobile menu below `lg`, wishlist icon hidden below `sm`,
      mobile sticky bar (Shop / Workshops / WhatsApp) visible and not covering
      content or the footer.
- [ ] Mobile bar is hidden on cart, checkout and confirmation.
- [ ] Shop filters: pills scroll horizontally; sidebar becomes a drawer/section;
      sticky behaviour works at `lg`.
- [ ] Product gallery swipe works; thumbnails scroll.
- [ ] Cart drawer is full-width on mobile and closes with Escape/backdrop.
- [ ] Long product names and "From Ksh …" prices do not overflow cards.
- [ ] Home hero: the collage is a thin strip at 390 px (known, accepted).

---

## 3. Accessibility

Target: Lighthouse accessibility ≥ 0.95 (enforced in CI) plus this manual pass.

- [ ] Tab through the header, menu, search overlay, cart drawer, filters and
      checkout: every control is reachable and has a visible focus ring.
- [ ] Skip link is the first Tab stop and jumps to `<main>`.
- [ ] Dialog/menu focus returns to the trigger on close; background scroll locks
      while the drawer/overlay is open.
- [ ] Escape closes search, cart drawer and mega-menu.
- [ ] Images have meaningful `alt` (decorative ones empty).
- [ ] Form fields have labels; errors are announced, not colour-only.
- [ ] Contrast: body text on cream, text on lavender (`ink-800`+), text on
      marigold, and footer links.
- [ ] `prefers-reduced-motion`: ticker, hover lifts, accordions, Lenis and the
      confetti are disabled or instant.
- [ ] Headings run h1 → h2 → h3 with exactly one h1 per page.
- [ ] Screen-reader spot check (VoiceOver on iOS): home → product → add to cart.

---

## 4. SEO & metadata

- [ ] Every public page has a unique `<title>` and meta description.
- [ ] Canonical URLs use `https://craftandcolors.africa/…` (no `www`, no
      `localhost`).
- [ ] Open Graph + Twitter tags; `og:locale` is `en_KE`; image is absolute.
- [ ] JSON-LD present where expected: `Organization`/`WebSite` on home,
      `Product` on product pages, `Event` on workshops, `FAQPage` on DIY kits.
- [ ] `sitemap-index.xml` lists every public route and excludes cart, checkout,
      confirmation, wishlist, styleguide and 404.
- [ ] `robots.txt` reachable, sitemap URL absolute.
- [ ] noindex on cart, checkout, confirmation, wishlist, styleguide, 404.
- [ ] 404 returns HTTP 404, not 200.
- [ ] Social preview renders (paste a product URL into WhatsApp/Facebook).

---

## 5. Performance

CI runs Lighthouse mobile against 11 representative pages.

- [ ] Performance ≥ 0.80, accessibility ≥ 0.95, best practices ≥ 0.90, SEO ≥ 0.90.
- [ ] LCP ≤ 4 s, CLS ≤ 0.10, TBT ≤ 500 ms on mobile.
- [ ] No render-blocking font/JS regressions; `_astro/*` served with
      `immutable` caching.
- [ ] Images are WebP/AVIF via `<Image>` where local; hero uses
      `fetchpriority="high"`.
- [ ] Desktop Lighthouse ≥ 0.95 performance (manual, DevTools).

---

## 6. Security & infrastructure

- [ ] HTTPS valid on apex and `www`; HTTP and `www` redirect 301 to apex.
- [ ] Headers present: `strict-transport-security`,
      `x-content-type-options`, `referrer-policy`, `x-frame-options`,
      `permissions-policy`.
- [ ] HTML `cache-control: no-cache, must-revalidate`; `_astro/*` immutable.
- [ ] CMS responds only over HTTPS; CORS allows the storefront origin.
- [ ] CMS `noindex`; `/wp/v2/users` blocked; XML-RPC off.
- [ ] Forms are rate-limited and honeypot-protected.
- [ ] No secrets in the built output (`grep -ri "github_pat\|CRAFT_" dist/`).
- [ ] `.env` is not reachable over HTTP.
- [ ] WordPress, plugins and the storefront's npm deps are up to date.

---

## 7. Content & launch blockers

- [ ] Contact details are real (email, WhatsApp, Instagram, Facebook).
- [ ] Policies copy signed off (refund window, 48 h workshop rule, exclusions).
- [ ] Product photography and alt text replaced (currently placeholders).
- [ ] Workshop dates, prices and capacity match reality.
- [ ] Shipping zones and free-gift threshold match the live Woo settings.
- [ ] Demo banner is absent from the header.
- [ ] Favicon renders in the browser tab (SVG only; `.ico`/apple-touch later).

---

## 8. Cross-browser

- [ ] Chrome (desktop + Android)
- [ ] Safari (macOS + iOS): sticky header, `background-attachment: fixed`
      degradation on the UGC wall, `::details-content` accordion fallback
- [ ] Firefox (desktop)

---

## 9. Sign-off

| Role | Name | Date | Result |
|---|---|---|---|
| Build / deploy | | | |
| Content | | | |
| Owner | | | |

Log anything accepted as a known risk in
[release-candidate.md](release-candidate.md) rather than leaving it unticked.
