# Deploying to Host Africa

The storefront is a **static Astro build**. `dist/` is uploaded over FTPS to the
domain's document root — no Node, Passenger or server-side rendering is involved.
WordPress + WooCommerce live separately at `cms.craftandcolors.africa`
(see [wordpress-setup.md](wordpress-setup.md)).

```
GitHub Actions
  ├─ build + `npm run check` + `npm run verify`   (fails if the CMS is down)
  ├─ FTPS mirror → Host Africa / public_html
  └─ smoke test → https://craftandcolors.africa

WordPress (cms.…) ──repository_dispatch: wordpress_update──▶ deploy workflow
```

Workflow: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
Guard script: [`scripts/verify-build.mjs`](../scripts/verify-build.mjs)
Smoke test: [`scripts/smoke-test.sh`](../scripts/smoke-test.sh)

---

## 1. What gets deployed

Only the contents of `dist/`:

| Path | Notes |
|---|---|
| `*.html` | one file per route, `trailingSlash: always` |
| `_astro/` | content-hashed CSS/JS/fonts — cached for a year |
| `images/`, `favicon.svg` | copied from `public/` |
| `.htaccess` | redirects, 404, caching, security headers |
| `robots.txt`, `sitemap-index.xml` | generated at build time |

`node_modules/`, `src/`, `docs/`, `wordpress/` and `.env` are never uploaded.

---

## 2. Host Africa / DirectAdmin

This account is on **DirectAdmin**, not cPanel. The confirmed values are below;
only `FTP_SERVER_DIR` still needs verifying.

### 2.1 The FTP account (confirmed 2026-10-31)

| Item | Value |
|---|---|
| Panel | DirectAdmin |
| Account type | System (the main hosting account) |
| FTP username | `craftan1` |
| FTP password | the DirectAdmin login password |
| Login root | `/home/craftan1` |
| FTP accounts | 1 of 1 used — no separate deploy user available |
| Hostname | `craftandcolors.africa` |
| Transport | **explicit** TLS on port 21 (implicit TLS on 990 is not open) |

DirectAdmin never displays an existing password. The System account shares its
password with the panel login, so changing one changes the other.

The certificate on `craftandcolors.africa` matches that hostname, so the action's
`security: strict` setting works as long as `FTP_SERVER` is the hostname and not
a bare IP.

### 2.2 Where the account lands

The account is not jailed to a single domain, so the remote path must be
absolute. Connect with explicit TLS and print the path:

```bash
lftp -u craftan1 -e 'set ftp:ssl-force true; set ftp:ssl-protect-data true; set ssl:verify-certificate yes; set ssl:check-hostname yes; cd domains/craftandcolors.africa/public_html; pwd; ls; mkdir _deploy-test; rmdir _deploy-test; bye' ftp://craftandcolors.africa:21
```

The expected path is:

```
/domains/craftandcolors.africa/public_html/
```

Use exactly what `pwd` prints, **with a trailing slash**. If `mkdir` reports an
error, the account cannot write to the document root and the deploy will fail at
upload time.

> **Important:** the deploy mirrors `dist/` into `FTP_SERVER_DIR`. Point it at a
> folder that contains **only this storefront**. Never at a directory that also
> holds the WordPress install, another app, or a `cgi-bin`.

### 2.3 SSL and document root

- DirectAdmin → **Account Manager → SSL Certificates** (or **Let's Encrypt**):
  issue a certificate for `craftandcolors.africa` and `www.craftandcolors.africa`.
  The storefront calls the CMS over HTTPS from the browser, and `.htaccess`
  forces HTTPS on the storefront.
- DirectAdmin → **Account Manager → Domain Setup**: the apex domain's document
  root must be the folder from §2.2.

### 2.4 DNS

| Record | Name | Value |
|---|---|---|
| `A` | `@` | Host Africa server IP |
| `CNAME` | `www` | `craftandcolors.africa` |
| `A` (or `CNAME`) | `cms` | the WordPress hosting target |

`www` must resolve — `.htaccess` redirects it to the apex, and the smoke test
checks that redirect.

---

## 3. GitHub configuration

Repository → **Settings → Secrets and variables → Actions**.

### Secrets (never printed in logs)

| Secret | Value |
|---|---|
| `FTP_SERVER` | `craftandcolors.africa` |
| `FTP_USERNAME` | `craftan1` |
| `FTP_PASSWORD` | the DirectAdmin login password |

Do not put the password on a command line — it leaks into shell history and the
process list. Paste it straight into the GitHub secret.

### Variables (public — they are baked into the site anyway)

| Variable | Value | Notes |
|---|---|---|
| `FTP_SERVER_DIR` | `/domains/craftandcolors.africa/public_html/` | **must end with `/`**; use the exact path from §2.2 |
| `SITE_URL` | `https://craftandcolors.africa` | canonical origin; required |
| `WP_URL` | `https://cms.craftandcolors.africa` | read at **build** time |
| `PUBLIC_WC_STORE_URL` | `https://cms.craftandcolors.africa` | used by the browser |
| `PUBLIC_CONTACT_EMAIL` | `hello@craftandcolors.africa` | |
| `PUBLIC_WHATSAPP` | `+254700000000` | full international format |
| `PUBLIC_INSTAGRAM` | `craftandcolours` | handle, no `@` |
| `PUBLIC_FACEBOOK_URL` | `https://www.facebook.com/…` | full URL |

`WP_URL` and `PUBLIC_WC_STORE_URL` must be the **same install**. The verify
script warns if their hosts differ.

The workflow uses a GitHub **environment** called `production`. It is created on
the first run. Optionally add required reviewers under Settings → Environments —
but note that this also pauses automatic WordPress rebuilds until someone
approves.

---

## 4. First deploy

1. Merge the release into `master` (or push directly, if that is the workflow).
2. GitHub → **Actions → Deploy storefront → Run workflow**.
   The workflow must exist on `master` before it appears in the dropdown.
3. Watch the three jobs:
   - **Build & verify** — `npm ci`, `npm run check`, `npm run build`,
     `npm run verify`. If the CMS is unreachable the job fails here and the live
     site is left untouched.
   - **Deploy over FTPS** — checks the four settings, then mirrors `dist/`.
   - **Smoke test live site** — 200s, 404 handling, HTTPS/www redirects,
     security headers, HTML cache policy, and a check that the
     "Demo catalogue" banner is absent.

Expected first-run timing: 2–4 minutes for the build, 1–2 minutes for ~90 files.

Subsequent deploys only upload changed files (the sync state is cached between
runs). If the cache is ever lost the action simply re-uploads everything — it is
never destructive by default.

### Manual deploy from your machine

```bash
npm run build
npm run verify          # requires SITE_URL/WP_URL/PUBLIC_WC_STORE_URL in the env
```

Then upload `dist/` with FileZilla. Prefer the workflow: it runs the same guard.

---

## 5. WordPress → rebuild hook

The mu-plugin dispatches `repository_dispatch` with `event_type: wordpress_update`
after content, stock or category changes (batched by `CRAFT_REBUILD_DELAY`,
default 300 s). This workflow listens for it.

In `wp-config.php` on the CMS:

```php
define('CRAFT_GITHUB_REPO', 'amanimavu/craft-and-colours');
define('CRAFT_GITHUB_TOKEN', 'github_pat_…'); // fine-grained, this repo only,
                                              // Contents: Read and write
```

Then in wp-admin click **Rebuild site** in the admin bar and confirm a new run
appears in the Actions tab. If it does not:

- check **Craft & Colours → Settings** for the last rebuild status/HTTP code;
- confirm the token has `Contents: read and write` and has not expired;
- confirm the workflow file exists on `master` (dispatches only trigger the
  default branch).

Because the site is static, product prices, stock and seat counts on the pages
are only as fresh as the last build. Cart, checkout and RSVP always use live
Store API data.

---

## 6. Verify a deploy

The workflow runs this automatically; run it by hand any time:

```bash
SITE_URL=https://craftandcolors.africa bash scripts/smoke-test.sh
```

Header spot-check:

```bash
curl -sSI https://craftandcolors.africa/ | grep -iE 'HTTP/|cache-control|strict-transport|x-content-type|referrer-policy'
curl -sSI http://craftandcolors.africa/ | grep -iE 'HTTP/|location'
curl -sSI https://www.craftandcolors.africa/ | grep -iE 'HTTP/|location'
```

Expected:

- `/` → `200`, `cache-control: no-cache, must-revalidate`, HSTS present;
- `http://` → `301` to `https://craftandcolors.africa/…`;
- `https://www.` → `301` to the apex;
- a random URL → `404` (served from `/404.html`).

---

## 7. Rollback

**Fastest:** Actions → **Deploy storefront** → pick the last good run →
**Re-run all jobs**. It rebuilds and deploys that exact commit.

**From artifacts:** open the good run → download the `dist` artifact → upload it
with FileZilla.

**Orphaned files** (a page or asset that was deleted locally but still exists on
the server — only possible if the sync-state cache was lost): run the workflow
manually with **clean_deploy** ticked. That deletes everything inside
`FTP_SERVER_DIR` before uploading. Double-check the path first.

---

## 8. Caching

- `_astro/*` is content-hashed and served `immutable` for a year.
- HTML is `no-cache, must-revalidate`, so a deploy is visible immediately.
- If DirectAdmin or LiteSpeed has **LiteSpeed Cache** enabled for the domain, purge it after a
  deploy or exclude HTML from it — otherwise the old page can survive the
  `no-cache` header.

---

## 9. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `530 Login authentication failed` | Wrong username format, or plain FTP is required on a non-standard port. The action uses explicit FTPS on 21; confirm with FileZilla. |
| `550` / permission denied | `FTP_SERVER_DIR` is wrong or the account is jailed elsewhere. Check §2.1. |
| Build fails: "WordPress REST index unreachable" | CMS down, SSL error, or a firewall blocking GitHub runners. Fix the CMS — this failure is intentional. Do not add `ALLOW_UNREACHABLE_CMS` to CI. |
| Build fails: "SITE_URL is not set" | Add the repository variable. |
| Site shows the demo catalogue | `PUBLIC_WC_STORE_URL` missing at build time. Fix the variable and redeploy; the guard normally blocks this. |
| Site returns HTTP 500 after deploy | A directive in `.htaccess` is not allowed by `AllowOverride`. Comment out the block named in the server error log (usually `mod_headers` or `mod_expires`) and redeploy. |
| Stale pages after deploy | LiteSpeed/page cache (§8), or HTML got a long cache header — re-check §6. |
| HSTS header missing | The host is not exposing the `HTTPS` environment variable to `mod_headers`. Remove `env=HTTPS` from the `Strict-Transport-Security` line (browsers ignore HSTS over plain HTTP anyway) and redeploy. |
| `Cache-Control` not applied | `mod_headers` is disabled. Enable it in DirectAdmin → **PHP Settings**, or ask Host Africa support, or accept the `mod_expires` defaults (HTML still expires immediately). |
| Custom 404 not used | `.htaccess` missing from the server. Confirm `dist/.htaccess` exists locally and `ErrorDocument` is allowed. |
| Redirect loop | Proxy terminates TLS without `X-Forwarded-Proto`. Ask Host Africa to pass it, or drop the `HTTP:X-Forwarded-Proto` condition. |
| CSS/JS 404s | `_astro/` was not uploaded (partial FTP run) — re-run the deploy with `clean_deploy` if needed. |
| `www` smoke test fails | DNS for `www` missing, or AutoSSL not issued for it. |

---

## 10. Post-launch checklist

- [ ] `https://craftandcolors.africa` loads with a valid certificate.
- [ ] `http://` and `https://www.` both 301 to the apex.
- [ ] Submit `https://craftandcolors.africa/sitemap-index.xml` in Google Search
      Console and Bing Webmaster Tools.
- [ ] Place a real test order (see [qa-launch.md](qa-launch.md)) and confirm the
      WhatsApp hand-off and the confirmation page.
- [ ] Confirm a **Rebuild site** click starts a workflow run.
- [ ] Enable DirectAdmin backups and note the retention window.
- [ ] Add an uptime monitor for `/` (optional).
