import { defineConfig, fontProviders } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import icon from "astro-icon";

const site = process.env.SITE_URL || "https://craftandcolors.africa";

// Only journal posts have a real "last modified" date to report. Other pages
// leave lastmod out, because the build date would tell search engines they all
// changed on every deploy. A CMS failure just leaves it out too.
let journalDates;

function getJournalDates() {
    journalDates ??= (async () => {
        const wpUrl = (process.env.WP_URL || "").replace(/\/$/, "");
        if (!wpUrl) return new Map();

        try {
            const response = await fetch(
                `${wpUrl}/wp-json/wp/v2/posts?per_page=100&_fields=slug,modified_gmt`,
            );
            if (!response.ok) return new Map();

            const posts = await response.json();
            return new Map(
                posts.map((post) => [
                    `/journal/${post.slug}/`,
                    `${post.modified_gmt}Z`,
                ]),
            );
        } catch {
            return new Map();
        }
    })();
    return journalDates;
}

export default defineConfig({
    site,
    trailingSlash: "always",
    integrations: [
        react(),
        sitemap({
            filter: (page) =>
                !page.includes("/cart/") &&
                !page.includes("/checkout/") &&
                !page.includes("/order-confirmation/") &&
                !page.includes("/styleguide/") &&
                !page.includes("/wishlist/"),
            serialize: async (item) => {
                const dates = await getJournalDates();
                const lastmod = dates.get(new URL(item.url).pathname);
                return lastmod ? { ...item, lastmod } : item;
            },
        }),
        icon({
            iconDir: "src/assets/icons",
        }),
    ],
    // Latin only, so preload can't pick up an unused file. Other scripts fall
    // back to system fonts.
    fonts: [
        {
            name: "Fraunces",
            cssVariable: "--font-fraunces",
            provider: fontProviders.local(),
            fallbacks: ["Georgia", "Times New Roman", "serif"],
            options: {
                variants: [
                    {
                        src: [
                            "./src/assets/fonts/fraunces-latin-wght-normal.woff2",
                        ],
                        weight: "100 900",
                        style: "normal",
                    },
                    {
                        src: [
                            "./src/assets/fonts/fraunces-latin-wght-italic.woff2",
                        ],
                        weight: "100 900",
                        style: "italic",
                    },
                ],
            },
        },
        {
            name: "Manrope",
            cssVariable: "--font-manrope",
            provider: fontProviders.local(),
            fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
            options: {
                variants: [
                    {
                        src: [
                            "./src/assets/fonts/manrope-latin-wght-normal.woff2",
                        ],
                        weight: "200 800",
                        style: "normal",
                    },
                ],
            },
        },
    ],
    image: {
        domains: ["placehold.co", "cms.craftandcolors.africa", "localhost"],
    },
    vite: {
        plugins: [tailwindcss()],
        server: {
            // Lets the dev server accept requests through a tunnel (zrok, ngrok,
            // etc.) whose Host header won't match localhost/LAN addresses. Vite
            // would otherwise 403 those requests by default. Dev-only — unrelated
            // to `astro build`, no effect on the production site.
            allowedHosts: true,
        },
    },
    prefetch: {
        prefetchAll: true,
    },
});
