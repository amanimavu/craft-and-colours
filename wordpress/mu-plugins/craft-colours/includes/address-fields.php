<?php
/**
 * Address rules for the countries the shop delivers to (KE, UG, TZ — see
 * src/lib/regions.ts). Postal codes are rarely used for delivery here, so
 * they're optional wherever WooCommerce would otherwise require them.
 * WooCommerce already hides the postcode for Uganda.
 *
 * The Store API validates addresses against this locale, so the storefront's
 * checkout form must match it.
 */

defined('ABSPATH') || exit;

add_filter(
    'woocommerce_get_country_locale',
    static function (array $locale): array {
        foreach (['KE', 'TZ'] as $country) {
            $locale[$country]['postcode']['required'] = false;
        }
        return $locale;
    },
);
