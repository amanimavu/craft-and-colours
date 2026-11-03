import { defineConfig, fontProviders } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import icon from "astro-icon";

const site = process.env.SITE_URL || "https://craftandcolors.africa";

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
                        src: ["./src/assets/fonts/fraunces-latin-wght-normal.woff2"],
                        weight: "100 900",
                        style: "normal",
                    },
                    {
                        src: ["./src/assets/fonts/fraunces-latin-wght-italic.woff2"],
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
                        src: ["./src/assets/fonts/manrope-latin-wght-normal.woff2"],
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
