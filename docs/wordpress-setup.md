# WordPress + WooCommerce setup (production CMS)

The storefront is a static Astro site. WordPress + WooCommerce runs separately
as a headless CMS (suggested: `cms.craftandcolours.co.ke` on Host Africa) and
is only used for the admin, the WooCommerce Store API and the plugin's
`craft/v1` endpoints. API details: [store-data-contract.md](store-data-contract.md).
To try everything locally first: [wordpress-local.md](wordpress-local.md).

## 1. Install

1. Create the `cms.` subdomain in the Host Africa cPanel and point it at its own
   folder. Turn on **SSL (AutoSSL / Let's Encrypt)** — the storefront calls it
   from the browser over HTTPS.
2. Install WordPress (Softaculous or a manual upload). PHP **8.1 or newer**.
3. **Settings → Permalinks → Post name.** `/wp-json/...` needs pretty permalinks.
4. **Settings → General:** timezone **Nairobi**. Workshop dates are read in
   this timezone.
5. Install **WooCommerce**. Skip the "Store setup" extras (themes, marketing apps).

## 2. Upload the mu-plugin

Upload these from `wordpress/mu-plugins/` in this repo to
`wp-content/mu-plugins/` on the server (create the folder if it doesn't exist):

```
wp-content/mu-plugins/
  craft-colours.php
  craft-colours/includes/*.php
```

Must-use plugins are always on — there's nothing to activate. Check
**Plugins → Must-Use** lists "Craft & Colours".

**Skip `local-mailpit.php`.** It only matters for the local Docker stack (and does nothing outside `WP_ENVIRONMENT_TYPE` `local` if uploaded by mistake).

## 3. wp-config.php

Add these above `/* That's all, stop editing! */`:

```php
// Public storefront — the only origin allowed to call the APIs from a browser
define('CRAFT_FRONTEND_URL', 'https://craftandcolours.co.ke');
// Optional extra origins, comma-separated (e.g. a preview or zrok URL)
define('CRAFT_ALLOWED_ORIGINS', 'https://www.craftandcolours.co.ke');

// Where contact-form messages and RSVP notifications go (default: admin email)
define('CRAFT_CONTACT_EMAIL', 'hello@craftandcolours.co.ke');

// Shop WhatsApp number — "Message us on WhatsApp to pay" links in order emails
define('CRAFT_WHATSAPP', '+254700000000');

// Free gift threshold in KES. Keep it equal to DEMO_FREE_GIFT_THRESHOLD / 100
// in src/lib/cart-api.ts, which drives the cart drawer progress bar.
define('CRAFT_FREE_GIFT_THRESHOLD', 5000);

// Static-site rebuild (Phase 9). Fine-grained GitHub token, this repo only,
// permission "Contents: Read and write". Leave both out to disable.
define('CRAFT_GITHUB_REPO', 'owner/craft_and_colours');
define('CRAFT_GITHUB_TOKEN', 'github_pat_...');
define('CRAFT_REBUILD_DELAY', 300); // seconds to batch edits into one build

// Use the real cron job below instead of page-load cron
define('DISABLE_WP_CRON', true);
```

## 4. Cron

Rebuilds are scheduled with WP-Cron. A headless CMS gets little traffic, so
add a real cron job in cPanel → **Cron Jobs** (every 5 minutes):

```
*/5 * * * * curl -s https://cms.craftandcolours.co.ke/wp-cron.php?doing_wp_cron >/dev/null 2>&1
```

## 5. Email

`wp_mail()` on shared hosting often lands in spam or is silently dropped.
Install an SMTP plugin (e.g. **WP Mail SMTP** or **FluentSMTP**) and send
through the domain mailbox. Test it with the contact form. The contact form,
RSVP confirmations and WooCommerce order emails all depend on this.

## 6. WooCommerce settings

**WooCommerce → Settings → General**
- Store address: Village Market, Limuru Road, Nairobi.
- Selling location: Kenya + the East African countries you ship to.
- Currency **Kenyan shilling (KES)**.

**Shipping → Zones** — checkout only works for addresses a zone covers.
Without a matching zone the customer sees "No delivery options are
available". Create them in this order (WooCommerce uses the first match):

| Zone | Regions | Methods |
|---|---|---|
| **Nairobi** | Kenya → Nairobi County | *Flat rate* KES 300, titled "Nairobi courier". *Free shipping* with "A minimum order amount" of KES 4,500. |
| **Rest of Kenya** | Kenya | *Flat rate* KES 0, titled "Courier — cost confirmed on WhatsApp" |
| **Uganda & Tanzania** | Uganda, Tanzania | *Flat rate* KES 0, titled "Courier — cost confirmed on WhatsApp" |

Checkout only offers Kenya, Uganda and Tanzania (`src/lib/regions.ts`).
**General → Selling location(s)** can stay "Sell to all countries", or be
limited to those three.

**Products → Inventory**
- Manage stock **on**.
- Low stock threshold: 2. The dashboard **Low stock** widget uses this.

**Payments → Order now, pay on confirmation** (added by the plugin, on by default). At
launch it's the **only** method. Nothing is charged on the site:

1. The customer places the order. It's saved as **On hold** with stock
   reserved, and they land on the confirmation page with a "Message us to pay"
   WhatsApp button (order number + total prefilled). The on-hold email has the
   same link.
2. On WhatsApp: confirm the delivery cost (outside Nairobi), then send M-Pesa
   or card payment details. If the delivery cost changes the total, edit the
   order in wp-admin first.
3. Once paid, set the order to **Processing**. WooCommerce emails the
   customer, and you pack it. Unpaid orders: set them to **Cancelled**, which
   puts the stock back.

You can change the title, description and email text under WooCommerce →
Settings → Payments → Order now, pay on confirmation. When an M-Pesa/card gateway goes live
later, disable this one there.

**Advanced → Features:** leave the Store API on (default).

## 7. Catalogue conventions

| Thing | How to set it up |
|---|---|
| Categories | Slugs must match the storefront: `paint`, `stitch-sew`, `clay`, `sketch`, `kids`, `diy-kits`, `bundles`. |
| Filter attributes | Global attributes whose slugs match `CATEGORY_DYNAMIC_FILTERS` in `src/lib/filters.ts` (e.g. `finish`, `size`, `material`, `skill`). |
| Workshop ticket | Simple product, **Virtual**, **Catalog visibility: Hidden**, manage stock on, stock = seats. Then link it in the workshop's **Session details** box. |
| Product photos | **Product image** = shop card + first carousel slide. **Product gallery** = the other slides (drag to reorder). Gallery changes only save when you click **Update**. No need to add the main image to the gallery again. Portrait 4:5, ~1200×1500 px, with alt text. |
| Product page text | **Details** = the main *Product description* editor (or the short description if that's empty). **Good to know** = the *Good to know* box below it; leave empty to use the default under **Craft & Colours → Settings → Product pages**. Empty sections are hidden. |
| Free gift | Simple product, regular price **0**, catalog visibility **Hidden**, manage stock on. Select it under **Craft & Colours → Settings**. |

## 8. Plugin features in wp-admin

- **Workshops:** add workshops and meetups. With a ticket product it's paid
  (booked through the cart); without one it's a free RSVP meetup using
  *Capacity*. The RSVP box on each meetup lists attendees, with CSV export.
- **Maker posts:** the home-page wall. Title = handle (`@name`), Excerpt =
  caption, Featured image = photo, Order = position.
- **Craft & Colours → Subscribers:** newsletter sign-ups, with CSV export.
- **Craft & Colours → Settings:** free-gift product and rebuild status, with
  a **Rebuild now** button (also in the admin bar as **Rebuild site**).
- **Dashboard → Low stock:** products and tickets at or below the threshold.

What the plugin does automatically:
- CORS allowlist, plus skipping the Store API nonce for the storefront origin.
- Security headers, and `noindex` on the CMS.
- XML-RPC off, and user enumeration blocked.
- Rate-limited forms with a honeypot.
- A storefront rebuild after content, stock or category changes (batched).

## 9. Point the storefront at it

In the GitHub Actions secrets (Phase 9) or a local `.env`:

```dotenv
SITE_URL=https://craftandcolours.co.ke
WP_URL=https://cms.craftandcolours.co.ke
PUBLIC_WC_STORE_URL=https://cms.craftandcolours.co.ke
```

`WP_URL` (read at build time) and `PUBLIC_WC_STORE_URL` (used in the browser)
must be the **same** install.

## 10. Smoke test after go-live

Run the endpoint checklist in [wordpress-local.md §4](wordpress-local.md#4-check-the-endpoints)
against `https://cms.craftandcolours.co.ke/wp-json`. Use a real test product,
and delete the test RSVPs and subscribers afterwards.
