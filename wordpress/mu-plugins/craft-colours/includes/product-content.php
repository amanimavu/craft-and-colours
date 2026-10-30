<?php
/**
 * Extra product copy for the storefront product page.
 *
 * - "Good to know" box on each product (meta _craft_good_to_know). Left empty,
 *   the site-wide default from Craft & Colours → Settings is used
 *   (option craft_default_good_to_know).
 * - Exposed on Store API products as `extensions.craft.good_to_know` (HTML),
 *   read by normalizeProduct() in src/lib/woocommerce.ts.
 *
 * "Details" on the product page is the normal WooCommerce product description.
 */

defined('ABSPATH') || exit;

const CRAFT_GOOD_TO_KNOW_META = '_craft_good_to_know';

function craft_default_good_to_know(): string
{
    return (string) get_option('craft_default_good_to_know', '');
}

/**
 * Product's own "Good to know", or the site default, as safe HTML.
 */
function craft_good_to_know_html(int $product_id): string
{
    $own = (string) get_post_meta($product_id, CRAFT_GOOD_TO_KNOW_META, true);
    $html = trim($own) !== '' ? $own : craft_default_good_to_know();

    return trim($html) === '' ? '' : wpautop(wp_kses_post($html));
}

add_action(
    'add_meta_boxes_product',
    static function (): void {
        add_meta_box('craft-good-to-know-box', 'Good to know', 'craft_render_good_to_know_box', 'product', 'normal', 'default');
    },
);

function craft_render_good_to_know_box(WP_Post $post): void
{
    wp_nonce_field('craft_good_to_know_save', 'craft_good_to_know_nonce');

    echo '<p class="description">Care, safety and usage tips shown under “Good to know” on the product page. Leave empty to use the default from Craft &amp; Colours → Settings.</p>';

    // The editor ID must differ from the meta box ID, or TinyMCE attaches to
    // the box itself and the field never reaches the form. wp_editor() IDs
    // should be lowercase letters only.
    wp_editor(
        (string) get_post_meta($post->ID, CRAFT_GOOD_TO_KNOW_META, true),
        'craftgoodtoknow',
        [
            'textarea_name' => 'craft_good_to_know',
            'textarea_rows' => 6,
            'media_buttons' => false,
            'teeny' => true,
        ],
    );
}

add_action(
    'save_post_product',
    static function (int $post_id): void {
        if (
            !isset($_POST['craft_good_to_know_nonce'])
            || !wp_verify_nonce(sanitize_key($_POST['craft_good_to_know_nonce']), 'craft_good_to_know_save')
            || (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE)
            || !current_user_can('edit_post', $post_id)
        ) {
            return;
        }

        $html = wp_kses_post(wp_unslash($_POST['craft_good_to_know'] ?? ''));

        if (trim(wp_strip_all_tags($html)) === '') {
            delete_post_meta($post_id, CRAFT_GOOD_TO_KNOW_META);
        } else {
            update_post_meta($post_id, CRAFT_GOOD_TO_KNOW_META, $html);
        }
    },
);

// Changing the default affects every product page.
add_action('update_option_craft_default_good_to_know', static fn () => craft_schedule_rebuild('Default “Good to know” updated'));

add_action(
    'woocommerce_blocks_loaded',
    static function (): void {
        if (!function_exists('woocommerce_store_api_register_endpoint_data')) {
            return;
        }

        woocommerce_store_api_register_endpoint_data([
            'endpoint' => \Automattic\WooCommerce\StoreApi\Schemas\V1\ProductSchema::IDENTIFIER,
            'namespace' => 'craft',
            'data_callback' => static fn (WC_Product $product): array => [
                'good_to_know' => craft_good_to_know_html($product->get_parent_id() ?: $product->get_id()),
            ],
            'schema_callback' => static fn (): array => [
                'good_to_know' => [
                    'description' => 'HTML for the "Good to know" section (product value or site default).',
                    'type' => 'string',
                    'context' => ['view', 'edit'],
                    'readonly' => true,
                ],
            ],
            'schema_type' => ARRAY_A,
        ]);
    },
);
