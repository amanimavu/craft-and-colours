# Testing the WordPress plugin locally

A throwaway WordPress + WooCommerce on your machine, with the Craft & Colours
mu-plugin mounted from this repo. Use it to check the `craft/v1` endpoints and
to run the Astro site against a real store before touching the live CMS.

Everything runs from the **repo root**. Nothing here is production setup —
for that see [wordpress-setup.md](wordpress-setup.md).

---

## What's in the stack

`wordpress/docker-compose.yml` has four services:

| Service | Image | Why it's there |
|---|---|---|
| `db` | `mariadb:11` | The database. Data lives in the `db` volume, so it survives restarts. A healthcheck makes WordPress wait until MariaDB is actually ready. |
| `wordpress` | `wordpress:php8.3-apache` | WordPress on <http://localhost:8080>. The image writes `wp-config.php` from the `WORDPRESS_*` env vars on first start. |
| `mailpit` | `axllent/mailpit` | Fake mail server. Every email (contact form, RSVP confirmations, Woo order mails) shows up at <http://localhost:8025> instead of being sent. |
| `cli` | `wordpress:cli-php8.3` | `wp-cli`, for setup and seeding from the terminal. In the `tools` profile, so `up` never starts it — you call it with `docker compose run`. |

Two YAML anchors keep `wordpress` and `cli` identical:

- **`x-wp-env`** — DB credentials plus `WORDPRESS_CONFIG_EXTRA`, which the image
  appends to `wp-config.php`. That's where the plugin's constants live
  (`CRAFT_FRONTEND_URL`, `CRAFT_ALLOWED_ORIGINS`, `CRAFT_CONTACT_EMAIL`, and the
  commented-out GitHub rebuild ones). wp-cli needs the same env, because the
  image's `wp-config.php` reads it at runtime.
- **`x-wp-volumes`** — the WordPress files volume, plus the repo's
  `wordpress/mu-plugins/` **folder**, mounted read-only as
  `wp-content/mu-plugins/`. Edit the plugin in the repo and the next request
  picks it up — no restart. It's a folder mount on purpose: a single-file
  bind mount pins the file's inode, so tools that save by replacing the file
  leave the container reading the old copy. The folder also holds
  `local-mailpit.php`, which points `wp_mail()` at Mailpit and only runs when
  `WP_ENVIRONMENT_TYPE` is `local`.

`cli` runs as `33:33` (`www-data` in the WordPress image) so files it creates,
such as uploads, belong to the same user as the web server.

---

## 1. Start it

```zsh
docker compose -f wordpress/docker-compose.yml up -d
docker compose -f wordpress/docker-compose.yml ps     # db should say "healthy"
```

> **Docker Hub timing out?** Pull the images one at a time and retry the ones
> that fail, then run `up -d` again:
> `docker pull mariadb:11 && docker pull wordpress:php8.3-apache && docker pull axllent/mailpit && docker pull wordpress:cli-php8.3`

Add a shell helper for the rest of this guide. `-T` turns off the pseudo-TTY
so output captured with `$(...)` has no stray `\r`:

```zsh
wpcli() { docker compose -f wordpress/docker-compose.yml run --rm -T cli wp "$@"; }
```

## 2. Install WordPress + WooCommerce

```zsh
wpcli core install --url=http://localhost:8080 --title="Craft & Colours CMS" \
  --admin_user=admin --admin_password=admin \
  --admin_email=admin@craftandcolours.test --skip-email

# /wp-json/... only works with pretty permalinks
wpcli rewrite structure '/%postname%/' --hard

wpcli plugin install woocommerce --activate
wpcli option update woocommerce_currency KES
wpcli option update woocommerce_default_country KE

# Workshop dates are read in this timezone (default is UTC)
wpcli option update timezone_string Africa/Nairobi
```

Check the plugin loaded:

```zsh
wpcli plugin list --status=must-use     # craft-colours + local-mailpit
```

Log in at <http://localhost:8080/wp-admin> (admin / admin). You should see
**Workshops**, **Maker posts** and **Craft & Colours** in the menu. Skip
WooCommerce's setup wizard if it appears.

## 3. Seed test data

```zsh
# A normal product over the KES 5,000 free-gift threshold
EASEL=$(wpcli wc product create --user=admin --name="Test Easel" \
  --regular_price=6000 --manage_stock=true --stock_quantity=10 --porcelain)

# Free gift: price 0, hidden from the catalogue
GIFT=$(wpcli wc product create --user=admin --name="Free Craft Gift" \
  --regular_price=0 --catalog_visibility=hidden \
  --manage_stock=true --stock_quantity=20 --porcelain)
wpcli option update craft_free_gift_product_id "$GIFT"

# Workshop ticket: virtual, hidden, stock = seats left
TICKET=$(wpcli wc product create --user=admin --name="Ticket: Paint & Sip" \
  --regular_price=3500 --virtual=true --catalog_visibility=hidden \
  --manage_stock=true --stock_quantity=6 --porcelain)

# Paid workshop linked to the ticket
PAID=$(wpcli post create --post_type=craft_workshop --post_status=publish \
  --post_title="Paint & Sip: Nairobi Sunset" \
  --post_excerpt="A guided canvas night." \
  --post_content="<p>All supplies included.</p>" --porcelain)
wpcli post meta update "$PAID" _craft_start 2026-12-12T18:00
wpcli post meta update "$PAID" _craft_end 20:30
wpcli post meta update "$PAID" _craft_kind workshop
wpcli post meta update "$PAID" _craft_skill "Zero experience needed"
wpcli post meta update "$PAID" _craft_location "Village Market, Nairobi"
wpcli post meta update "$PAID" _craft_capacity 16
wpcli post meta update "$PAID" _craft_ticket_product "$TICKET"

# Free meetup, capacity 2 so you can test "full"
FREE=$(wpcli post create --post_type=craft_workshop --post_status=publish \
  --post_title="Free Sunday Crochet Club" \
  --post_excerpt="Bring your hook." \
  --post_content="<p>All levels welcome.</p>" --porcelain)
wpcli post meta update "$FREE" _craft_start 2026-12-06T10:00
wpcli post meta update "$FREE" _craft_end 12:00
wpcli post meta update "$FREE" _craft_kind meetup
wpcli post meta update "$FREE" _craft_skill "All levels"
wpcli post meta update "$FREE" _craft_capacity 2

# Maker post (only posts with a featured image are returned)
UGC=$(wpcli post create --post_type=craft_ugc --post_status=publish \
  --post_title="@wanjiru.makes" --post_excerpt="First amigurumi bunny." --porcelain)
wpcli media import "https://placehold.co/700x700/FFE3DB/211D19.png" \
  --post_id="$UGC" --featured_image

echo "easel=$EASEL gift=$GIFT ticket=$TICKET paid=$PAID free=$FREE ugc=$UGC"
```

Keep that last line's output — the IDs are used below. You can also edit all of
this in wp-admin; the workshop **Session details** box sets the same fields.

### Shipping zones (needed for checkout)

Without a shipping zone, checkout stops at "No delivery options are
available". In wp-admin → **WooCommerce → Settings → Shipping → Add zone**:

1. **Kenya**: Region "Kenya". Add a *Flat rate* method, cost 300.
2. **Uganda & Tanzania**: Regions "Uganda" and "Tanzania". Add a *Flat
   rate* method, cost 0, titled "Courier — cost confirmed on WhatsApp".

The production setup (Nairobi / rest of Kenya / Uganda & Tanzania) is in
[wordpress-setup.md §6](wordpress-setup.md#6-woocommerce-settings).

## 4. Check the endpoints

```zsh
API=http://localhost:8080/wp-json
```

| # | Command | Expect |
|---|---|---|
| 1 | `curl -s $API/craft/v1/workshops \| jq` | 2 workshops in the storefront `Workshop` shape. Paid: `isFree: false`, `seatsLeft: 6`, `wooProductId` = ticket ID, `price.price` = `"350000"`. Free: `isFree: true`, `seatsLeft: 2`. |
| 2 | `curl -s $API/craft/v1/ugc \| jq` | 1 post, `handle: "@wanjiru.makes"`, image `src` under `/wp-content/uploads/`. |
| 3 | `curl -si -X POST $API/craft/v1/newsletter -H 'Content-Type: application/json' -d '{"email":"a@b.co","source":"curl"}'` | `200 {"ok":true}`. Run it again → still 200 (no duplicate error). Appears in **Craft & Colours → Subscribers**. |
| 4 | Same as 3 with `"email":"nope"` | `400`, message “That email doesn’t look right…” |
| 5 | `curl -si -X POST $API/craft/v1/contact -H 'Content-Type: application/json' -d '{"name":"Test","email":"a@b.co","message":"Do you stock gouache?"}'` | `200`, and the email shows in Mailpit with Reply-To `a@b.co`. |
| 6 | `curl -si -X POST $API/craft/v1/rsvp -H 'Content-Type: application/json' -d "{\"workshop_id\":$FREE,\"name\":\"One\",\"email\":\"one@b.co\"}"` | `200`, `seats_left: 1`. Two emails in Mailpit (attendee + shop). |
| 7 | Repeat 6 exactly | `200` with `"already": true` — no double booking. |
| 8 | 6 with `two@b.co`, then with `three@b.co` | Second → `200`, `seats_left: 0`. Third → `409` “this meetup is full”. |
| 9 | 6 with `"workshop_id":$PAID` | `400` “paid workshop — please book a ticket”. |
| 10 | 6 with `"website":"spam"` added | `200` but nothing saved (honeypot). |
| 11 | `curl -si -X OPTIONS $API/craft/v1/rsvp -H 'Origin: http://localhost:4321' -H 'Access-Control-Request-Method: POST' \| grep -i access-control` | `Access-Control-Allow-Origin: http://localhost:4321` plus allow/expose headers. |
| 12 | Same as 11 with `Origin: https://evil.example` | **No** `Access-Control-Allow-Origin` header. |
| 13 | `curl -si $API/wp/v2/users \| head -1` | `401`. |
| 14 | `curl -sI $API/craft/v1/workshops \| grep -iE 'nosniff\|referrer'` | Security headers present. |

Hit the newsletter endpoint 11 times in an hour and you get `429` — the
rate limit. Restart the stack (or wait) to reset it.

### Free gift via the Store API

This is the same path the storefront cart uses: a `Cart-Token`, no cookies,
and the allowlisted `Origin` header (that's what lets the plugin skip the nonce).

```zsh
H=(-H 'Origin: http://localhost:4321' -H 'Content-Type: application/json')

# Add the KES 6,000 easel; grab the Cart-Token from the response headers
TOKEN=$(curl -s -D - -o /dev/null "${H[@]}" -X POST $API/wc/store/v1/cart/add-item \
  -d "{\"id\":$EASEL,\"quantity\":1}" | awk -F': ' 'tolower($1)=="cart-token"{print $2}' | tr -d '\r')

curl -s "${H[@]}" -H "Cart-Token: $TOKEN" $API/wc/store/v1/cart \
  | jq '.items[] | {name, quantity, price: .prices.price}'
```

Expect two items: Test Easel and **Free Craft Gift at price `0`**. Then:

- Remove the easel (`POST cart/remove-item` with its `key`) → the gift disappears too.
- Try adding the gift on its own (`add-item` with `"id":$GIFT`) → error, refused.
- Without the `Origin` header, `add-item` fails with a nonce error — that's
  expected; only the storefront origin skips the nonce.

## 5. Run the Astro site against it

Create `.env` in the repo root (already gitignored):

```dotenv
WP_URL=http://localhost:8080
PUBLIC_WC_STORE_URL=http://localhost:8080
```

Then run the dev server as usual. If it fails with
`EACCES ... .astro/dev.log`, the folder is root-owned from the Docker dev
container — run `sudo chown -R $USER .astro` once.

Check on <http://localhost:4321>:

- **Header banner:** the “Demo catalogue” notice is gone.
- **Shop:** shows only the Test Easel. The gift and ticket must **not** appear.
  If they do, note it — Store API visibility of hidden products is an open
  question.
- **/workshops/:** both seeded sessions, with the right prices and seats.
- **Home:** the maker wall shows the one seeded post.
- **Free meetup page:** RSVP → confirmation, with no “Demo RSVP” note; email in Mailpit.
- **Paid workshop page:** “Save my spot” → ticket in the cart drawer.
- **Cart:** add the easel → the free gift line appears.
- **Footer newsletter:** sign up → row in wp-admin Subscribers.
- **Contact page:** send → email in Mailpit.

In `astro dev` pages read WordPress on every request, so a refresh picks up
changes. In a production build they are read once, at build time.

Delete `.env` (or empty both values) to go back to demo data.

## 6. Optional: the rebuild hook

Uncomment `CRAFT_GITHUB_REPO` / `CRAFT_GITHUB_TOKEN` (set
`CRAFT_REBUILD_DELAY` to `60`) in `wordpress/docker-compose.yml`, then
`up -d` again. Edit any workshop → **Craft & Colours → Settings** shows a
pending rebuild, and **Rebuild site** in the admin bar sends it now. Without
the Phase 9 workflow the dispatch still returns `204`, but nothing builds.

WP-Cron only runs when someone loads a page, so trigger it with:

```zsh
wpcli cron event run --due-now
```

## Editor support (Intelephense)

So VS Code knows WordPress and WooCommerce functions/classes in the plugin,
install the type stubs once (dev only, never deployed, `vendor/` is
gitignored):

```zsh
cd wordpress && composer install
```

`.vscode/settings.json` raises `intelephense.files.maxSize` because the stub
files are ~5 MB. After installing, run **Intelephense: Index workspace** from
the command palette (or reload the window).

## 7. Stop / reset

```zsh
docker compose -f wordpress/docker-compose.yml stop      # keep data
docker compose -f wordpress/docker-compose.yml down -v   # delete everything
```
