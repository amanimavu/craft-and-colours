# Store data contract

How the Astro storefront talks to WordPress / WooCommerce. If you change one
side, update the other and this file.

## Environment

| Variable | Used by | Purpose |
|---|---|---|
| `SITE_URL` | build | Canonical URLs, sitemap, robots, JSON-LD. |
| `WP_URL` | build (`src/lib/wordpress.ts`, `workshops.ts`) | Posts, pages, workshops, maker posts. Empty → demo data. |
| `PUBLIC_WC_STORE_URL` | build + browser (`woocommerce.ts`, `cart-api.ts`, forms) | Products, cart, checkout, contact/newsletter/RSVP. Empty → demo catalogue and client-only forms. |

Both WordPress URLs must point at the same install.

## WooCommerce Store API (`/wp-json/wc/store/v1`)

| Call | Where | Notes |
|---|---|---|
| `GET /products`, `/products/{slug}`, `?type=variation&parent=`, `?related=` | `woocommerce.ts` at build | Paginated 100 at a time. Prices are **minor units** (string). |
| `GET/POST /cart`, `/cart/add-item`, `/cart/update-item`, `/cart/remove-item`, `/cart/apply-coupon`, `/cart/remove-coupon`, `/cart/select-shipping-rate`, `/cart/update-customer` | `cart-api.ts` in the browser | `credentials: 'omit'`. The session is the **`Cart-Token`** header, stored in localStorage `craft_cart_token`, and refreshed from every response. |
| `POST /checkout` | `CheckoutForm.tsx` | Redirects to `/order-confirmation/?order=<id>&key=<key>`. |

The plugin makes this work cross-origin:
- CORS allows `Cart-Token` and `Nonce`, and exposes them.
- `woocommerce_store_api_disable_nonce_check` is on for allowlisted origins only.

**Free gift:** when the cart subtotal (excluding the gift) is at least
`CRAFT_FREE_GIFT_THRESHOLD` (KES 5,000), the gift product appears as a normal
cart item at price `0`, and it's removed below that. Users can't add it
themselves. The gift line carries `extensions.craft = { free_gift: true, gift_for: "Test Easel + 1 more" }`
(`gift_for` = the biggest line in the cart), and its `quantity_limits` are
`editable: false`, min/max 1. The storefront reads these into
`CartItem.freeGift` / `giftFor`, hides the quantity controls and Remove, and
shows "Free gift · with …". The storefront progress bar uses `DEMO_FREE_GIFT_THRESHOLD`
(`cart-api.ts`, minor units). **Keep the two equal.**

**Hidden products:** workshop tickets and the gift use catalog visibility
*Hidden*. The Store API lists them by default (`catalog_visibility=any`), so
every listing call in `woocommerce.ts` sends `catalog_visibility=catalog`
(verified 2026-10-30). Single-product and variation lookups don't.

**Countries & regions:** checkout sends `country` KE / UG / TZ and `state` as
WooCommerce's own region code: Kenya `KE01`–`KE47` (alphabetical, Nairobi
`KE30`), Uganda `UG1xx`–`UG4xx` districts, Tanzania `TZ01`–`TZ30`. Anything else
is rejected as an invalid address. The lists live in `src/lib/regions.ts`,
generated from `woocommerce/i18n/states.php`. Postcode is optional for Kenya and Tanzania
(`includes/address-fields.php` relaxes WooCommerce's default) and hidden for
Uganda.

**Payment at launch:** the only gateway is `craft_whatsapp` ("Pay via
WhatsApp", `includes/whatsapp-payment.php` + `class-whatsapp-gateway.php`).
The order is placed **On hold** with no charge. `CheckoutForm` then sends
the customer to `/order-confirmation/?order=…&key=…&pay=whatsapp&total=…`,
which shows a WhatsApp "Message us to pay" card with the order number and
total prefilled. The plugin returns the same URL as its redirect when
`CRAFT_FRONTEND_URL` is set.

**Product page copy:** "Details" = Woo `description` (falls back to
`short_description`; hidden if both empty). "Good to know" =
`extensions.craft.good_to_know` (HTML; the product's own *Good to know* box,
else the default in Craft & Colours → Settings; hidden if empty). Source:
`includes/product-content.php`.

**Names** come back HTML-encoded (`Paint &amp; Sip`); product, category and
cart-item names go through `stripHtml()` from `format.ts`.

**Open gap — live product fields.** `normalizeProduct()` in `woocommerce.ts`
does not yet fill these `Product` fields from the Store API:

| Field | Used by | Effect with a live store |
|---|---|---|
| `attributes` | Shop dynamic filters | Filters match nothing. |
| `isNew` | "Fresh arrivals" filter | Filter matches nothing. |
| `isVirtual` | Demo cart only | No effect: Woo itself skips shipping for virtual items. |

Proposed mapping:
- `attributes`: global attribute taxonomy `pa_<key>` → `<key>`, first term name.
- `isNew`: a `new` product tag, or created within the last N days.

Decide before launch.

## Plugin endpoints (`/wp-json/craft/v1`)

The source is `wordpress/mu-plugins/craft-colours/includes/`.

All errors are WordPress REST errors:
`{ "code": "...", "message": "...", "data": { "status": 4xx } }`.
The forms show `message` to the user as-is.

The POST endpoints share these rules:
- **Honeypot:** a non-empty `website` → `200 {ok:true}`, but nothing is stored or sent.
- **Rate limit:** per IP, `429` when exceeded.
- **Body:** JSON.

### `GET /workshops` → `Workshop[]`

Read at build time by `src/lib/workshops.ts`. Same shape as `Workshop` in
`src/lib/types.ts`. Only published sessions with a start date are returned,
ordered by start.

```jsonc
{
  "id": 123,                      // WP post ID — also the RSVP workshop_id
  "slug": "paint-and-sip-nairobi-sunset",
  "title": "Paint & Sip: Nairobi Sunset",
  "excerpt": "plain text",
  "description": "<p>HTML</p>",
  "date": "2026-12-12T18:00:00+03:00",
  "time": "18:00–20:30",
  "duration": "2.5 hours",
  "price": { "price": "350000", "currency_code": "KES", "currency_minor_unit": 2, ... },
  "isFree": false,                // true when no ticket product is linked
  "skill": "Zero experience needed",
  "location": "Village Market, Nairobi",
  "capacity": 16,
  "seatsLeft": 6,                 // paid: ticket stock · free: capacity − RSVPs
  "kind": "workshop",             // or "meetup"
  "image": { "id": 45, "src": "https://…", "alt": "…" },   // src "" if none
  "wooProductId": 501             // ticket product, null for free sessions
}
```

### `GET /ugc?limit=12` → `UgcPost[]`

Read by `getUgcPosts()` in `src/lib/wordpress.ts`. Only maker posts with a
featured image are returned, ordered by menu order, then newest.
Each item: `{ id, handle: "@name", caption, image: { id, src, alt } }`.

### `POST /contact`

Sent by `ContactForm.tsx`.

| Body | Responses |
|---|---|
| `{ name, email, message, website }` | `200 {ok:true}` · `400` invalid name/email/message (<10 chars) · `429` (5/hour) · `500` mail failed |

Emails `CRAFT_CONTACT_EMAIL` with Reply-To set to the sender.

### `POST /newsletter`

Sent by `NewsletterForm.tsx` (`source` = `"footer"` by default).

| Body | Responses |
|---|---|
| `{ email, source, website }` | `200 {ok:true}` (also for an email already on the list) · `400` invalid email · `429` (10/hour) |

Stored in `{prefix}craft_subscribers` and exported from wp-admin.

### `POST /rsvp`

Sent by `WorkshopBooking.tsx`, for free sessions only.

| Body | Responses |
|---|---|
| `{ workshop_id, name, email, website }` | `200 {ok:true, seats_left}` · `200 {ok:true, already:true, seats_left}` (same email again) · `400` missing fields or paid workshop · `404` unknown workshop · `409` full · `410` already happened · `429` (10/hour) |

- Stored in `{prefix}craft_rsvps`, unique per workshop + email.
- Sends a confirmation to the attendee and a notification to the shop.
- Schedules a rebuild, so the static seat count catches up.

## Rebuild hook → GitHub Actions (Phase 9)

The plugin sends a `repository_dispatch` to `CRAFT_GITHUB_REPO`:

```json
{ "event_type": "wordpress_update", "client_payload": { "reason": "product: Test Easel", "source": "https://cms…" } }
```

Triggers:
- Publishing, updating or unpublishing a post, page, product, workshop or maker post.
- Stock changes.
- Category or tag edits.
- A new RSVP.
- The manual **Rebuild site** button.

Batched: one dispatch at most every `CRAFT_REBUILD_DELAY` seconds (default 300).

The deploy workflow must listen for it:

```yaml
on:
  repository_dispatch:
    types: [wordpress_update]
```

Because the site is static, stock, seat counts and prices on the pages are only
as fresh as the last build. The cart and checkout always use live Store API data.
