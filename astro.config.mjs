import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import icon from "astro-icon";

const site = process.env.SITE_URL || "https://craftandcolours.co.ke";

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
    image: {
        domains: ["placehold.co"],
    },
    vite: {
        plugins: [tailwindcss()],
    },
    prefetch: {
        prefetchAll: true,
    },
});
