<?php
/**
 * Dashboard widget listing products and variations at or below
 * WooCommerce's "Low stock threshold" (WooCommerce → Settings → Products →
 * Inventory). Workshop tickets show up here too — their stock is seats left.
 */

defined('ABSPATH') || exit;

add_action(
    'wp_dashboard_setup',
    static function (): void {
        if (!function_exists('wc_get_product') || !current_user_can('manage_woocommerce')) {
            return;
        }
        wp_add_dashboard_widget('craft_low_stock', 'Low stock', 'craft_render_low_stock_widget');
    },
);

function craft_render_low_stock_widget(): void
{
    global $wpdb;

    $threshold = (int) get_option('woocommerce_notify_low_stock_amount', 2);

    $rows = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT lookup.product_id, lookup.stock_quantity
             FROM {$wpdb->prefix}wc_product_meta_lookup AS lookup
             INNER JOIN {$wpdb->posts} AS posts ON posts.ID = lookup.product_id
             WHERE lookup.stock_quantity IS NOT NULL
               AND lookup.stock_quantity <= %d
               AND posts.post_status = 'publish'
             ORDER BY lookup.stock_quantity ASC
             LIMIT 25",
            $threshold,
        ),
    );

    if (!$rows) {
        printf('<p>Nothing at or below %d in stock. 🎉</p>', $threshold);
        return;
    }

    echo '<table class="widefat striped"><thead><tr><th>Product</th><th style="text-align:right">Stock</th></tr></thead><tbody>';

    foreach ($rows as $row) {
        $product = wc_get_product((int) $row->product_id);
        if (!$product) {
            continue;
        }

        $edit_id = $product->get_parent_id() ?: $product->get_id();
        $stock = (int) $row->stock_quantity;

        printf(
            '<tr><td><a href="%s">%s</a></td><td style="text-align:right;font-weight:600;color:%s">%d</td></tr>',
            esc_url(get_edit_post_link($edit_id) ?: ''),
            esc_html(wp_strip_all_tags($product->get_formatted_name())),
            $stock <= 0 ? '#b32d2e' : '#996800',
            $stock,
        );
    }

    echo '</tbody></table>';
    printf(
        '<p class="description">Showing items with %d or fewer in stock. Change the threshold in WooCommerce → Settings → Products → Inventory.</p>',
        $threshold,
    );
}
