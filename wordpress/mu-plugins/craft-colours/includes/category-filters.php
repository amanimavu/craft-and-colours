<?php
/**
 * Per-category shop filters.
 *
 * Each product category chooses which global attributes (Products → Attributes)
 * appear as filters on the storefront, in what order, under what label, and
 * whether shoppers pick one option or many. The storefront decides which input
 * to render from that (see src/lib/filters.ts).
 *
 * - Settings live on the category edit screen (term meta _craft_filters).
 * - GET /wp-json/craft/v1/category-filters is read at build time by
 *   getCategoryFilters() in src/lib/woocommerce.ts.
 * - Each product's values are exposed on the Store API as
 *   extensions.craft.filter_attributes (see product-content.php).
 */

defined('ABSPATH') || exit;

const CRAFT_CATEGORY_FILTERS_META = '_craft_filters';

// /shop/ already uses these as query parameters, so an attribute with one of
// these slugs can't be a filter.
const CRAFT_FILTER_RESERVED_KEYS = ['category', 'fresh', 'sale', 'max'];

/**
 * Global attributes that can be used as filters: slug (no pa_ prefix) => label.
 *
 * @return array<string, string>
 */
function craft_filterable_attributes(): array
{
    $attributes = [];

    foreach (wc_get_attribute_taxonomies() as $attribute) {
        if (!in_array($attribute->attribute_name, CRAFT_FILTER_RESERVED_KEYS, true)) {
            $attributes[$attribute->attribute_name] = craft_plain($attribute->attribute_label);
        }
    }

    return $attributes;
}

/**
 * @return array<string, array{show: bool, order: int, label: string, mode: string}>
 */
function craft_category_filter_settings(int $term_id): array
{
    $settings = get_term_meta($term_id, CRAFT_CATEGORY_FILTERS_META, true);
    return is_array($settings) ? $settings : [];
}

/* -------------------------------------------------------------------------
 * Category edit screen
 * ---------------------------------------------------------------------- */

add_action(
    'product_cat_edit_form_fields',
    static function (WP_Term $term): void {
        $attributes = craft_filterable_attributes();
        $settings = craft_category_filter_settings($term->term_id);
        $attributes_url = admin_url('edit.php?post_type=product&page=product_attributes');
        ?>
        <tr class="form-field">
            <th scope="row">Shop filters</th>
            <td>
                <?php wp_nonce_field('craft_category_filters_save', 'craft_category_filters_nonce'); ?>
                <?php if ($attributes === []) : ?>
                    <p>No attributes yet. <a href="<?php echo esc_url($attributes_url); ?>">Add one under Products → Attributes</a> first.</p>
                <?php else : ?>
                    <table class="widefat striped" style="max-width: 720px">
                        <thead>
                            <tr>
                                <th>Attribute</th>
                                <th>Show</th>
                                <th>Position</th>
                                <th>Label</th>
                                <th>Shoppers can pick</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($attributes as $key => $default_label) :
                                $row = $settings[$key] ?? [];
                                $name = 'craft_category_filters[' . $key . ']';
                                $mode = ($row['mode'] ?? 'many') === 'one' ? 'one' : 'many';
                                ?>
                                <tr>
                                    <td><?php echo esc_html($default_label); ?></td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            name="<?php echo esc_attr($name); ?>[show]"
                                            value="1"
                                            aria-label="<?php echo esc_attr("Show {$default_label} filter"); ?>"
                                            <?php checked(!empty($row['show'])); ?>
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            style="width: 70px"
                                            name="<?php echo esc_attr($name); ?>[order]"
                                            value="<?php echo esc_attr((string) ($row['order'] ?? 0)); ?>"
                                            aria-label="<?php echo esc_attr("{$default_label} filter position"); ?>"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            style="width: 100%"
                                            name="<?php echo esc_attr($name); ?>[label]"
                                            value="<?php echo esc_attr((string) ($row['label'] ?? '')); ?>"
                                            placeholder="<?php echo esc_attr($default_label); ?>"
                                            aria-label="<?php echo esc_attr("{$default_label} filter label"); ?>"
                                        />
                                    </td>
                                    <td>
                                        <select
                                            style="width: auto"
                                            name="<?php echo esc_attr($name); ?>[mode]"
                                            aria-label="<?php echo esc_attr("{$default_label} filter selection"); ?>"
                                        >
                                            <option value="many" <?php selected($mode, 'many'); ?>>Many options</option>
                                            <option value="one" <?php selected($mode, 'one'); ?>>One option</option>
                                        </select>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    <p class="description">
                        Lower positions show first. Leave a label empty to use the attribute's name.
                        A filter only lists options used by products in this category, and is hidden if there are none.
                        The shop chooses the input: checkboxes or radio buttons for up to 6 options, a dropdown above that.
                    </p>
                <?php endif; ?>
            </td>
        </tr>
        <?php
    },
);

add_action(
    'edited_product_cat',
    static function (int $term_id): void {
        // Quick edit doesn't send this form, so it leaves the settings alone.
        if (
            !isset($_POST['craft_category_filters_nonce'])
            || !wp_verify_nonce(sanitize_key($_POST['craft_category_filters_nonce']), 'craft_category_filters_save')
            || !current_user_can('manage_product_terms')
        ) {
            return;
        }

        $submitted = wp_unslash($_POST['craft_category_filters'] ?? []);
        $settings = [];

        foreach (array_keys(craft_filterable_attributes()) as $key) {
            $row = is_array($submitted[$key] ?? null) ? $submitted[$key] : [];

            $settings[$key] = [
                'show' => !empty($row['show']),
                'order' => absint($row['order'] ?? 0),
                'label' => sanitize_text_field((string) ($row['label'] ?? '')),
                'mode' => ($row['mode'] ?? 'many') === 'one' ? 'one' : 'many',
            ];
        }

        update_term_meta($term_id, CRAFT_CATEGORY_FILTERS_META, $settings);
    },
);

/* -------------------------------------------------------------------------
 * REST: GET /craft/v1/category-filters
 * ---------------------------------------------------------------------- */

add_action(
    'rest_api_init',
    static function (): void {
        register_rest_route(CRAFT_REST_NAMESPACE, '/category-filters', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => 'craft_list_category_filters',
            'permission_callback' => '__return_true',
        ]);
    },
);

/**
 * Products the shop lists under this category. The storefront matches a
 * product's own categories only, so child categories are left out here too.
 *
 * @return int[]
 */
function craft_category_catalog_product_ids(int $term_id): array
{
    return get_posts([
        'post_type' => 'product',
        'post_status' => 'publish',
        'posts_per_page' => -1,
        'fields' => 'ids',
        'no_found_rows' => true,
        'tax_query' => [
            [
                'taxonomy' => 'product_cat',
                'field' => 'term_id',
                'terms' => $term_id,
                'include_children' => false,
            ],
            [
                'taxonomy' => 'product_visibility',
                'field' => 'name',
                'terms' => ['exclude-from-catalog'],
                'operator' => 'NOT IN',
            ],
        ],
    ]);
}

/**
 * The options a category's filter offers, in the order set on the attribute.
 *
 * @param int[] $product_ids
 * @return array<int, array{value: string, label: string}>
 */
function craft_filter_options(string $key, array $product_ids): array
{
    $terms = get_terms([
        'taxonomy' => wc_attribute_taxonomy_name($key),
        'object_ids' => $product_ids,
        'hide_empty' => false,
    ]);

    if (is_wp_error($terms)) {
        return [];
    }

    return array_map(
        static fn (WP_Term $term): array => [
            'value' => $term->slug,
            'label' => craft_plain($term->name),
        ],
        $terms,
    );
}

function craft_list_category_filters(): WP_REST_Response
{
    $attributes = craft_filterable_attributes();
    $categories = get_terms(['taxonomy' => 'product_cat', 'hide_empty' => false]);
    $filters = [];

    foreach (is_wp_error($categories) ? [] : $categories as $category) {
        $rows = array_filter(
            craft_category_filter_settings($category->term_id),
            static fn (array $row, string $key): bool => !empty($row['show']) && isset($attributes[$key]),
            ARRAY_FILTER_USE_BOTH,
        );

        if ($rows === []) {
            continue;
        }

        $product_ids = craft_category_catalog_product_ids($category->term_id);

        if ($product_ids === []) {
            continue;
        }

        $groups = [];

        foreach ($rows as $key => $row) {
            $options = craft_filter_options($key, $product_ids);

            if ($options !== []) {
                $groups[] = [
                    'key' => $key,
                    'label' => $row['label'] !== '' ? $row['label'] : $attributes[$key],
                    'mode' => $row['mode'],
                    'order' => (int) $row['order'],
                    'options' => $options,
                ];
            }
        }

        usort(
            $groups,
            static fn (array $a, array $b): int => [$a['order'], $a['label']] <=> [$b['order'], $b['label']],
        );

        if ($groups !== []) {
            $filters[$category->slug] = array_map(
                static function (array $group): array {
                    unset($group['order']);
                    return $group;
                },
                $groups,
            );
        }
    }

    // As an object, so "no filters" is {} rather than [].
    return rest_ensure_response((object) $filters);
}

/* -------------------------------------------------------------------------
 * Store API: a product's filter values
 * ---------------------------------------------------------------------- */

/**
 * Attribute term slugs on a product: ['finish' => ['matte'], ...].
 *
 * Reads the product directly instead of the Store API's `attributes` field, so
 * a filter still works when "Visible on the product page" is unticked.
 *
 * @return array<string, string[]>
 */
function craft_product_filter_attributes(WC_Product $product): array
{
    $values = [];

    foreach ($product->get_attributes() as $attribute) {
        // Variations hold plain strings here, and custom (non-global)
        // attributes can't be chosen as filters.
        if ($attribute instanceof WC_Product_Attribute && $attribute->is_taxonomy()) {
            $key = preg_replace('/^pa_/', '', $attribute->get_name());
            $values[$key] = array_values($attribute->get_slugs());
        }
    }

    return $values;
}
