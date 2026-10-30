#!/usr/bin/env bash
# Post-deploy smoke test. Runs in CI after the FTP upload, and can be run by
# hand against any environment:
#
#   SITE_URL=https://craftandcolors.africa bash scripts/smoke-test.sh
#
# Exits non-zero if any check fails.

set -uo pipefail

BASE="${SITE_URL:-https://craftandcolors.africa}"
BASE="${BASE%/}"
HOST="${BASE#https://}"
HOST="${HOST%%/*}"
FAILURES=0

say() { printf '%s\n' "$*"; }
ok() { say "  ok    $*"; }
bad() { say "  FAIL  $*"; FAILURES=$((FAILURES + 1)); }

status() {
    local code
    code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$1" 2>/dev/null)" || code="000"
    printf '%s' "$code"
}

location_of() {
    curl -sSI --max-time 20 "$1" 2>/dev/null \
        | tr -d '\r' \
        | awk 'tolower($1) == "location:" { print $2; exit }'
}

say "Smoke test — $BASE"
say "──────────────────────────────────────────"

# 1. Pages that must exist
for path in / /shop/ /workshops/ /diy-kits/ /journal/ /contact/ /policies/ /robots.txt /sitemap-index.xml /404.html /favicon.svg; do
    code="$(status "$BASE$path")"
    if [ "$code" = "200" ]; then ok "GET $path → 200"; else bad "GET $path → $code (expected 200)"; fi
done

# 2. Missing pages use Astro's 404.html with a real 404 status
code="$(status "$BASE/this-page-does-not-exist-$(date +%s)/")"
if [ "$code" = "404" ]; then ok "unknown path → 404"; else bad "unknown path → $code (expected 404)"; fi

# 3. HTTPS redirect
code="$(status "http://$HOST/")"
loc="$(location_of "http://$HOST/")"
case "$code" in
    301 | 302 | 307 | 308) ok "http://$HOST/ → $code ${loc:-(no Location)}" ;;
    *) bad "http://$HOST/ → $code (expected a redirect to https)" ;;
esac

# 4. www → apex
code="$(status "https://www.$HOST/")"
loc="$(location_of "https://www.$HOST/")"
case "$code" in
    301 | 308) ok "https://www.$HOST/ → $code ${loc:-(no Location)}" ;;
    *) bad "https://www.$HOST/ → $code (expected a 301 to $HOST)" ;;
esac

# 5. Security headers on the home page
headers="$(curl -sSI --max-time 20 "$BASE/" 2>/dev/null | tr -d '\r')"
for header in x-content-type-options referrer-policy strict-transport-security; do
    if printf '%s\n' "$headers" | grep -qi "^$header:"; then
        ok "header $header"
    else
        bad "missing header $header"
    fi
done

# 6. HTML must not be cached, hashed assets must be
cache_control="$(printf '%s\n' "$headers" | awk 'tolower($1) == "cache-control:" { $1=""; sub(/^ /, ""); print; exit }')"
case "$cache_control" in
    *no-cache* | *no-store* | *max-age=0*) ok "HTML Cache-Control: $cache_control" ;;
    *) bad "HTML Cache-Control is '$cache_control' (expected no-cache so rebuilds appear)" ;;
esac

# 7. A demo build must never reach production
if curl -sS --max-time 20 "$BASE/" 2>/dev/null | grep -q "Demo catalogue"; then
    bad "home page contains the \"Demo catalogue\" banner (store URL missing at build time)"
else
    ok "no demo catalogue banner"
fi

say "──────────────────────────────────────────"
if [ "$FAILURES" -eq 0 ]; then
    say "All smoke checks passed."
    exit 0
fi

say "$FAILURES smoke check(s) failed."
exit 1
