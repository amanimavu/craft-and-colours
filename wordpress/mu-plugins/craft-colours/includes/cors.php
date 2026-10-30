<?php
/**
 * CORS for the static storefront.
 *
 * Core WordPress echoes back any Origin on REST requests. This replaces that
 * with an allowlist (CRAFT_FRONTEND_URL + CRAFT_ALLOWED_ORIGINS) and adds the
 * WooCommerce Store API headers the browser cart needs (Cart-Token, Nonce).
 */

defined('ABSPATH') || exit;

function craft_allowed_origins(): array
{
    $extra = explode(',', (string) craft_config('CRAFT_ALLOWED_ORIGINS', ''));
    $origins = array_merge([craft_frontend_url()], $extra);
    $origins = array_map(static fn ($origin) => untrailingslashit(trim($origin)), $origins);

    return array_values(array_unique(array_filter($origins)));
}

function craft_origin_allowed(?string $origin = null): bool
{
    $origin = $origin ?? get_http_origin();
    return $origin !== '' && in_array(untrailingslashit($origin), craft_allowed_origins(), true);
}

add_action(
    'rest_api_init',
    static function (): void {
        remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
        add_filter('rest_pre_serve_request', 'craft_send_cors_headers');
    },
    15,
);

function craft_send_cors_headers(mixed $served): mixed
{
    header('Vary: Origin', false);

    $origin = get_http_origin();
    if (!craft_origin_allowed($origin)) {
        return $served;
    }

    header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Accept, Content-Type, Cart-Token, Nonce, X-WC-Store-API-Nonce');
    header('Access-Control-Expose-Headers: Cart-Token, Nonce, X-WC-Store-API-Nonce, X-WP-Total, X-WP-TotalPages, Link');
    header('Access-Control-Max-Age: 600');

    return $served;
}

// WooCommerce checks this list before sending its own Store API CORS headers.
add_filter(
    'allowed_http_origins',
    static fn (array $origins): array => array_values(array_unique(array_merge($origins, craft_allowed_origins()))),
);

/*
 * The storefront talks to the Store API with a Cart-Token and no cookies, so
 * there is no session for a nonce to protect. Skip the nonce check only for
 * requests coming from the allowlisted storefront origin.
 */
add_filter(
    'woocommerce_store_api_disable_nonce_check',
    static fn (bool $disabled): bool => $disabled || craft_origin_allowed(),
);
