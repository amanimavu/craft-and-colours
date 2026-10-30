<?php
/**
 * Free craft gift: once the cart subtotal (excluding the gift) reaches the
 * threshold, the gift product is added at KES 0; below it, it is removed.
 *
 * - Gift product: chosen under Craft & Colours → Settings (option
 *   craft_free_gift_product_id). Use a simple product, catalog visibility
 *   "Hidden", regular price 0, stock managed.
 * - Threshold (major units): CRAFT_FREE_GIFT_THRESHOLD in wp-config, default
 *   5000. Keep it in step with DEMO_FREE_GIFT_THRESHOLD in src/lib/cart-api.ts,
 *   which drives the cart drawer's progress bar.
 *
 * Runs on woocommerce_before_calculate_totals, so it covers the Store API
 * cart used by the storefront as well as classic carts.
 */

defined('ABSPATH') || exit;

function craft_free_gift_product_id(): int
{
    return (int) get_option('craft_free_gift_product_id', 0);
}

function craft_free_gift_threshold(): float
{
    return (float) craft_config('CRAFT_FREE_GIFT_THRESHOLD', 5000);
}

/**
 * True only while this module is adding the gift itself.
 */
function craft_adding_free_gift(?bool $set = null): bool
{
    static $adding = false;
    if ($set !== null) {
        $adding = $set;
    }
    return $adding;
}

// Nobody can add the gift on their own — only the threshold logic can.
add_filter(
    'woocommerce_add_to_cart_validation',
    static function (mixed $valid, mixed $product_id): mixed {
        $gift_id = craft_free_gift_product_id();
        if ($gift_id && (int) $product_id === $gift_id && !craft_adding_free_gift()) {
            if (function_exists('wc_add_notice')) {
                wc_add_notice('The free gift is added automatically once your order qualifies.', 'error');
            }
            return false;
        }
        return $valid;
    },
    10,
    2,
);

add_action('woocommerce_before_calculate_totals', 'craft_sync_free_gift', 20);

function craft_sync_free_gift(mixed $cart): void
{
    static $running = false;

    $gift_id = craft_free_gift_product_id();
    if ($running || !$gift_id || !($cart instanceof WC_Cart)) {
        return;
    }
    if (is_admin() && !wp_doing_ajax()) {
        return;
    }

    // add_to_cart() recalculates totals, which re-enters this hook.
    $running = true;

    $subtotal = 0.0;
    $gift_keys = [];
    $lines = 0;
    $top_name = '';
    $top_amount = -1.0;

    foreach ($cart->get_cart() as $key => $item) {
        if ((int) $item['product_id'] === $gift_id) {
            // Strays without our flag (e.g. restored from an old session) go.
            if (empty($item['craft_free_gift'])) {
                $cart->remove_cart_item($key);
                continue;
            }
            $gift_keys[] = $key;
            continue;
        }
        $amount = (float) $item['data']->get_price() * (int) $item['quantity'];
        $subtotal += $amount;
        $lines++;
        if ($amount > $top_amount) {
            $top_amount = $amount;
            $top_name = $item['data']->get_name();
        }
    }

    $qualifies = $subtotal >= craft_free_gift_threshold();

    if ($qualifies && !$gift_keys) {
        $gift = wc_get_product($gift_id);
        if ($gift && $gift->is_in_stock()) {
            craft_adding_free_gift(true);
            $cart->add_to_cart($gift_id, 1, 0, [], ['craft_free_gift' => true]);
            craft_adding_free_gift(false);
        }
    } elseif (!$qualifies) {
        foreach ($gift_keys as $key) {
            $cart->remove_cart_item($key);
        }
    }

    // The gift is credited to the biggest line in the cart, e.g. "Test Easel"
    // or "Test Easel + 2 more", so the storefront can say what earned it.
    $gift_for = $lines > 1 ? sprintf('%s + %d more', $top_name, $lines - 1) : $top_name;

    $contents = $cart->get_cart_contents();
    foreach ($contents as $key => $item) {
        if (empty($item['craft_free_gift'])) {
            continue;
        }
        $item['data']->set_price(0);
        $contents[$key]['quantity'] = 1;
        $contents[$key]['craft_gift_for'] = $gift_for;
    }
    $cart->set_cart_contents($contents);

    $running = false;
}

// Label the gift line in the cart, checkout and order emails.
add_filter(
    'woocommerce_get_item_data',
    static function (array $data, array $item): array {
        if (!empty($item['craft_free_gift'])) {
            $data[] = [
                'key' => 'Free gift',
                'value' => !empty($item['craft_gift_for'])
                    ? 'With ' . $item['craft_gift_for']
                    : 'On us, for orders over KES ' . number_format_i18n(craft_free_gift_threshold()),
            ];
        }
        return $data;
    },
    10,
    2,
);

add_action(
    'woocommerce_checkout_create_order_line_item',
    static function (WC_Order_Item_Product $line, string $key, array $values): void {
        if (!empty($values['craft_free_gift'])) {
            $line->add_meta_data('Free gift', !empty($values['craft_gift_for']) ? 'With ' . $values['craft_gift_for'] : 'Yes', true);
        }
    },
    10,
    3,
);

/*
 * Store API: tell the storefront which line is the gift and what earned it
 * (cart item `extensions.craft`), and lock its quantity so the cart UI shows
 * no stepper or remove button.
 */
add_action(
    'woocommerce_blocks_loaded',
    static function (): void {
        if (!function_exists('woocommerce_store_api_register_endpoint_data')) {
            return;
        }

        woocommerce_store_api_register_endpoint_data([
            'endpoint' => \Automattic\WooCommerce\StoreApi\Schemas\V1\CartItemSchema::IDENTIFIER,
            'namespace' => 'craft',
            'data_callback' => static fn (array $cart_item): array => [
                'free_gift' => !empty($cart_item['craft_free_gift']),
                'gift_for' => (string) ($cart_item['craft_gift_for'] ?? ''),
            ],
            'schema_callback' => static fn (): array => [
                'free_gift' => [
                    'description' => 'Whether this line is the automatic free craft gift.',
                    'type' => 'boolean',
                    'context' => ['view', 'edit'],
                    'readonly' => true,
                ],
                'gift_for' => [
                    'description' => 'The cart line the gift was earned with.',
                    'type' => 'string',
                    'context' => ['view', 'edit'],
                    'readonly' => true,
                ],
            ],
            'schema_type' => ARRAY_A,
        ]);
    },
);

add_filter(
    'woocommerce_store_api_product_quantity_editable',
    static fn (mixed $editable, mixed $product, mixed $cart_item = null): mixed => is_array($cart_item) && !empty($cart_item['craft_free_gift']) ? false : $editable,
    10,
    3,
);

foreach (['woocommerce_store_api_product_quantity_minimum', 'woocommerce_store_api_product_quantity_maximum'] as $craft_quantity_hook) {
    add_filter(
        $craft_quantity_hook,
        static fn (mixed $value, mixed $product, mixed $cart_item = null): mixed => is_array($cart_item) && !empty($cart_item['craft_free_gift']) ? 1 : $value,
        10,
        3,
    );
}
unset($craft_quantity_hook);
