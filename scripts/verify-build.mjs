#!/usr/bin/env node
/**
 * Post-build guard for production deploys.
 *
 * `src/lib/wordpress.ts` and `src/lib/woocommerce.ts` deliberately fall back to
 * demo content when a fetch fails, which is great locally and dangerous in CI:
 * a WordPress blip would publish a demo catalogue to the live site. This script
 * fails the deploy instead.
 *
 * Run:  npm run verify
 *
 * Env (required in CI, warned about in offline mode):
 *   SITE_URL               canonical origin used for the build
 *   WP_URL                 build-time WordPress REST base
 *   PUBLIC_WC_STORE_URL    Store API base
 *   PUBLIC_CONTACT_EMAIL   shown in the footer/contact page
 *   PUBLIC_WHATSAPP        WhatsApp links
 *   ALLOW_UNREACHABLE_CMS  set to "1" for local/offline builds only. Relaxes
 *                          the network checks, the required-env checks and the
 *                          https:// rule on SITE_URL. Never set this in CI.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

const DIST = join(process.cwd(), "dist");

/**
 * Astro loads .env for `import.meta.env`, but plain Node does not. Mirror it
 * so `npm run verify` sees the same values as the build. Existing environment
 * variables always win (that is what CI relies on).
 */
function loadDotEnv(file = ".env") {
    if (!existsSync(file)) return;

    for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;

        const separator = line.indexOf("=");
        if (separator === -1) continue;

        const key = line.slice(0, separator).trim();
        let value = line.slice(separator + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        if (key && process.env[key] === undefined) process.env[key] = value;
    }
}

loadDotEnv();

const REQUIRED_FILES = [
    "index.html",
    "404.html",
    "robots.txt",
    "sitemap-index.xml",
    "sitemap-0.xml",
    "favicon.svg",
    ".htaccess",
];

const REQUIRED_DIRS = ["_astro"];

const failures = [];
const warnings = [];
const passes = [];

const fail = (message) => failures.push(message);
const warn = (message) => warnings.push(message);
const pass = (message) => passes.push(message);

const cleanUrl = (value) => (value ?? "").trim().replace(/\/+$/, "");

const siteUrl = cleanUrl(process.env.SITE_URL);
const wpUrl = cleanUrl(process.env.WP_URL);
const storeUrl = cleanUrl(process.env.PUBLIC_WC_STORE_URL);
const offline = process.env.ALLOW_UNREACHABLE_CMS === "1";

/** Network problems are fatal in CI, advisory for offline/local builds. */
const cmsProblems = [];

function report() {
    console.log("\nBuild verification");
    console.log("──────────────────");
    for (const item of passes) console.log(`  ok    ${item}`);
    for (const item of warnings) console.log(`  warn  ${item}`);
    for (const item of failures) console.log(`  FAIL  ${item}`);
    console.log(
        `\n${passes.length} passed, ${warnings.length} warning(s), ${failures.length} failure(s).`,
    );

    if (failures.length > 0) {
        console.error(
            "\nRefusing to publish this build. Fix the failures above" +
                (offline
                    ? ""
                    : " (or set ALLOW_UNREACHABLE_CMS=1 for a local build)") +
                ".",
        );
        process.exit(1);
    }
}

function walk(dir) {
    const files = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) files.push(...walk(full));
        else files.push(full);
    }
    return files;
}

async function fetchJson(url, label) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);

    try {
        const response = await fetch(url, {
            headers: { Accept: "application/json" },
            signal: controller.signal,
        });

        if (!response.ok) {
            cmsProblems.push(
                `${label} returned HTTP ${response.status} — ${url}`,
            );
            return null;
        }

        return await response.json();
    } catch (error) {
        const reason =
            error?.name === "AbortError"
                ? "timed out after 15s"
                : (error?.message ?? String(error));
        cmsProblems.push(`${label} unreachable: ${reason} — ${url}`);
        return null;
    } finally {
        clearTimeout(timer);
    }
}

function hostOf(url) {
    try {
        return new URL(url).host;
    } catch {
        return "";
    }
}

async function main() {
    /* ---------------------------------------------------------------
     * 1. Environment
     * ------------------------------------------------------------ */
    if (!siteUrl) {
        fail(
            "SITE_URL is not set — refusing to build without a canonical origin.",
        );
    } else if (!offline) {
        if (!siteUrl.startsWith("https://")) {
            fail(`SITE_URL must use https:// (got ${siteUrl}).`);
        }
        if (/localhost|127\.0\.0\.1/i.test(siteUrl)) {
            fail(`SITE_URL points at a local address (${siteUrl}).`);
        }
    }
    if (siteUrl) pass(`SITE_URL = ${siteUrl}`);

    // Production builds must not rely on the hardcoded placeholder fallbacks in
    // the components. Offline/local builds only warn.
    const requiredEnv = [
        [
            "WP_URL",
            wpUrl,
            "journal, workshops and the maker wall would use demo content",
        ],
        [
            "PUBLIC_WC_STORE_URL",
            storeUrl,
            "the storefront would ship the demo catalogue",
        ],
        [
            "PUBLIC_CONTACT_EMAIL",
            (process.env.PUBLIC_CONTACT_EMAIL ?? "").trim(),
            "the footer and contact page would show the placeholder email",
        ],
        [
            "PUBLIC_WHATSAPP",
            (process.env.PUBLIC_WHATSAPP ?? "").trim(),
            "WhatsApp links would use the placeholder number",
        ],
    ];

    for (const [name, value, consequence] of requiredEnv) {
        if (value) continue;
        if (offline) warn(`${name} is not set — ${consequence}.`);
        else fail(`${name} is not set — ${consequence}.`);
    }

    for (const name of ["PUBLIC_INSTAGRAM", "PUBLIC_FACEBOOK_URL"]) {
        if (!(process.env[name] ?? "").trim()) {
            warn(
                `${name} is not set — the matching footer social link will be missing.`,
            );
        }
    }

    if (wpUrl && storeUrl && hostOf(wpUrl) !== hostOf(storeUrl)) {
        warn(
            `WP_URL (${hostOf(wpUrl)}) and PUBLIC_WC_STORE_URL (${hostOf(storeUrl)}) ` +
                "point at different hosts; they should be the same install.",
        );
    }

    /* ---------------------------------------------------------------
     * 2. CMS reachability
     * ------------------------------------------------------------ */
    if (wpUrl) {
        await fetchJson(`${wpUrl}/wp-json/`, "WordPress REST index");
        await fetchJson(
            `${wpUrl}/wp-json/craft/v1/workshops`,
            "Workshops endpoint",
        );
        await fetchJson(
            `${wpUrl}/wp-json/craft/v1/announcements`,
            "Announcements endpoint",
        );
    }

    if (storeUrl) {
        const products = await fetchJson(
            `${storeUrl}/wp-json/wc/store/v1/products?per_page=1`,
            "Store API products",
        );

        if (Array.isArray(products) && products.length === 0) {
            cmsProblems.push(
                "Store API returned zero catalogue products — publish at least one product before deploying.",
            );
        }

        await fetchJson(
            `${storeUrl}/wp-json/craft/v1/category-filters`,
            "Category filters endpoint",
        );
    }

    if (cmsProblems.length > 0) {
        if (offline) {
            for (const problem of cmsProblems) warn(`[offline] ${problem}`);
        } else {
            for (const problem of cmsProblems) fail(problem);
        }
    } else if (wpUrl || storeUrl) {
        pass("CMS endpoints reachable and returning data");
    }

    /* ---------------------------------------------------------------
     * 3. dist/ structure
     * ------------------------------------------------------------ */
    if (!existsSync(DIST)) {
        fail("dist/ not found — run `npm run build` first.");
        report();
        return;
    }

    for (const file of REQUIRED_FILES) {
        if (existsSync(join(DIST, file))) pass(`dist/${file}`);
        else fail(`dist/${file} is missing.`);
    }

    for (const dir of REQUIRED_DIRS) {
        if (existsSync(join(DIST, dir))) pass(`dist/${dir}/`);
        else fail(`dist/${dir}/ is missing.`);
    }

    if (existsSync(join(DIST, "_astro"))) {
        const hasCss = readdirSync(join(DIST, "_astro")).some((name) =>
            name.endsWith(".css"),
        );
        if (hasCss) pass("hashed CSS bundle present");
        else fail("dist/_astro/ contains no CSS bundle.");
    }

    const robotsPath = join(DIST, "robots.txt");
    if (existsSync(robotsPath)) {
        const robots = readFileSync(robotsPath, "utf8");
        if (/^Sitemap:\s+https?:\/\//m.test(robots))
            pass("robots.txt advertises a sitemap");
        else fail("robots.txt has no absolute Sitemap: line.");

        for (const privatePath of ["/cart/", "/checkout/", "/wishlist/"]) {
            if (!robots.includes(`Disallow: ${privatePath}`)) {
                fail(`robots.txt does not disallow ${privatePath}.`);
            }
        }
    }

    const sitemapPath = join(DIST, "sitemap-index.xml");
    if (siteUrl && existsSync(sitemapPath)) {
        const sitemap = readFileSync(sitemapPath, "utf8");
        if (sitemap.includes(siteUrl)) pass("sitemap uses SITE_URL");
        else
            fail(`sitemap-index.xml does not reference SITE_URL (${siteUrl}).`);
    }

    /* ---------------------------------------------------------------
     * 4. HTML sanity
     * ------------------------------------------------------------ */
    const htmlFiles = walk(DIST).filter((file) => extname(file) === ".html");

    if (htmlFiles.length === 0) {
        fail("dist/ contains no HTML pages.");
    } else {
        pass(`${htmlFiles.length} HTML page(s)`);
    }

    const siteHost = hostOf(siteUrl);
    const insecureSiteUrl = siteHost
        ? [`http://${siteHost}`, `http://www.${siteHost.replace(/^www\./, "")}`]
        : [];

    for (const file of htmlFiles) {
        const page = relative(DIST, file);
        const html = readFileSync(file, "utf8");

        if (/localhost|127\.0\.0\.1/i.test(html)) {
            fail(`${page} contains a localhost/127.0.0.1 reference.`);
        }

        if (/http:\/\/cms\./i.test(html)) {
            fail(`${page} loads the CMS over plain http:// (mixed content).`);
        }

        for (const insecure of insecureSiteUrl) {
            if (html.includes(insecure)) {
                fail(`${page} contains an insecure reference to ${insecure}.`);
            }
        }

        if (storeUrl && html.includes("Demo catalogue")) {
            fail(
                `${page} shows the "Demo catalogue" banner even though PUBLIC_WC_STORE_URL is set.`,
            );
        }
    }

    if (siteUrl && htmlFiles.length > 0) {
        const indexHtml = readFileSync(join(DIST, "index.html"), "utf8");
        const canonical = `href="${siteUrl}/"`;
        if (indexHtml.includes(canonical))
            pass("home page canonical matches SITE_URL");
        else fail(`dist/index.html canonical does not match ${siteUrl}/.`);
    }

    report();
}

await main();
