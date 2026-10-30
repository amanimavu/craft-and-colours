<?php
/**
 * wp-admin → Craft & Colours: newsletter subscribers (with CSV export),
 * free-gift product setting and storefront rebuild status.
 */

defined('ABSPATH') || exit;

add_action(
    'admin_menu',
    static function (): void {
        $capability = craft_rebuild_capability();

        add_menu_page('Craft & Colours', 'Craft & Colours', $capability, 'craft-colours', 'craft_render_subscribers_page', 'dashicons-art', 58);
        add_submenu_page('craft-colours', 'Newsletter subscribers', 'Subscribers', $capability, 'craft-colours', 'craft_render_subscribers_page');
        add_submenu_page('craft-colours', 'Craft & Colours settings', 'Settings', $capability, 'craft-colours-settings', 'craft_render_settings_page');
    },
);

add_action(
    'admin_init',
    static function (): void {
        register_setting('craft_colours', 'craft_free_gift_product_id', [
            'type' => 'integer',
            'sanitize_callback' => 'absint',
            'default' => 0,
        ]);
        register_setting('craft_colours', 'craft_default_good_to_know', [
            'type' => 'string',
            'sanitize_callback' => 'wp_kses_post',
            'default' => '',
        ]);
    },
);

// Let shop managers (not just admins) save the settings form.
add_filter('option_page_capability_craft_colours', static fn () => craft_rebuild_capability());

/* -------------------------------------------------------------------------
 * Subscribers
 * ---------------------------------------------------------------------- */

function craft_render_subscribers_page(): void
{
    global $wpdb;

    $per_page = 50;
    $page = max(1, absint($_GET['paged'] ?? 1));
    $total = craft_subscriber_count();
    $rows = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT email, source, created_at FROM {$wpdb->prefix}craft_subscribers ORDER BY created_at DESC LIMIT %d OFFSET %d",
            $per_page,
            ($page - 1) * $per_page,
        ),
    );
    $export_url = wp_nonce_url(admin_url('admin-post.php?action=craft_export_subscribers'), 'craft_export_subscribers');
    ?>
    <div class="wrap">
        <h1 class="wp-heading-inline">Newsletter subscribers</h1>
        <a class="page-title-action" href="<?php echo esc_url($export_url); ?>">Download CSV</a>
        <p><?php echo esc_html(sprintf(_n('%s subscriber', '%s subscribers', $total), number_format_i18n($total))); ?> from the storefront sign-up forms.</p>

        <table class="widefat striped">
            <thead><tr><th>Email</th><th>Signed up from</th><th>Date</th></tr></thead>
            <tbody>
            <?php if (!$rows) : ?>
                <tr><td colspan="3">No subscribers yet.</td></tr>
            <?php endif; ?>
            <?php foreach ($rows as $row) : ?>
                <tr>
                    <td><a href="mailto:<?php echo esc_attr($row->email); ?>"><?php echo esc_html($row->email); ?></a></td>
                    <td><?php echo esc_html($row->source ?: '—'); ?></td>
                    <td><?php echo esc_html(mysql2date('j M Y, H:i', $row->created_at)); ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>

        <?php
        $pages = (int) ceil($total / $per_page);
        if ($pages > 1) {
            echo '<div class="tablenav"><div class="tablenav-pages">';
            echo wp_kses_post(paginate_links([
                'base' => add_query_arg('paged', '%#%'),
                'format' => '',
                'current' => $page,
                'total' => $pages,
            ]));
            echo '</div></div>';
        }
        ?>
    </div>
    <?php
}

add_action(
    'admin_post_craft_export_subscribers',
    static function (): void {
        check_admin_referer('craft_export_subscribers');
        if (!current_user_can(craft_rebuild_capability())) {
            wp_die('Sorry, you are not allowed to export subscribers.', 403);
        }

        global $wpdb;
        $rows = $wpdb->get_results(
            "SELECT email, source, created_at FROM {$wpdb->prefix}craft_subscribers ORDER BY created_at ASC",
            ARRAY_N,
        ) ?: [];

        craft_send_csv('subscribers-' . wp_date('Y-m-d') . '.csv', ['Email', 'Source', 'Signed up'], $rows);
    },
);

/* -------------------------------------------------------------------------
 * Settings + rebuild status
 * ---------------------------------------------------------------------- */

function craft_render_settings_page(): void
{
    $gift_id = craft_free_gift_product_id();
    $products = function_exists('wc_get_products')
        ? wc_get_products(['type' => 'simple', 'status' => ['publish', 'private'], 'limit' => -1, 'orderby' => 'title', 'order' => 'ASC'])
        : [];
    $last = get_option('craft_rebuild_last', []);
    $next = wp_next_scheduled(CRAFT_REBUILD_HOOK);
    ?>
    <div class="wrap">
        <h1>Craft &amp; Colours settings</h1>

        <form method="post" action="options.php">
            <?php settings_fields('craft_colours'); ?>
            <h2>Free craft gift</h2>
            <table class="form-table" role="presentation">
                <tr>
                    <th><label for="craft_free_gift_product_id">Gift product</label></th>
                    <td>
                        <select id="craft_free_gift_product_id" name="craft_free_gift_product_id">
                            <option value="0">No free gift</option>
                            <?php foreach ($products as $product) : ?>
                                <option value="<?php echo esc_attr((string) $product->get_id()); ?>" <?php selected($gift_id, $product->get_id()); ?>>
                                    <?php echo esc_html(sprintf('%s (#%d)', $product->get_name(), $product->get_id())); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                        <p class="description">
                            Added automatically at KES 0 once the cart reaches
                            KES <?php echo esc_html(number_format_i18n(craft_free_gift_threshold())); ?>.
                            Use a simple product with regular price 0, catalog visibility “Hidden” and stock managed.
                        </p>
                    </td>
                </tr>
            </table>

            <h2>Product pages</h2>
            <table class="form-table" role="presentation">
                <tr>
                    <th><label for="craftdefaultgoodtoknow">Default “Good to know”</label></th>
                    <td>
                        <?php
                        wp_editor(craft_default_good_to_know(), 'craftdefaultgoodtoknow', [
                            'textarea_name' => 'craft_default_good_to_know',
                            'textarea_rows' => 6,
                            'media_buttons' => false,
                            'teeny' => true,
                        ]);
                        ?>
                        <p class="description">Shown on every product that leaves its own “Good to know” box empty.</p>
                    </td>
                </tr>
            </table>

            <?php submit_button(); ?>
        </form>

        <h2>Storefront rebuild</h2>
        <?php if (!craft_rebuild_configured()) : ?>
            <p>Not configured. Add <code>CRAFT_GITHUB_REPO</code> and <code>CRAFT_GITHUB_TOKEN</code> to <code>wp-config.php</code>.</p>
        <?php else : ?>
            <table class="form-table" role="presentation">
                <tr>
                    <th>Repository</th>
                    <td><code><?php echo esc_html((string) craft_config('CRAFT_GITHUB_REPO')); ?></code></td>
                </tr>
                <tr>
                    <th>Last request</th>
                    <td>
                        <?php if ($last) : ?>
                            <?php echo esc_html(wp_date('j M Y, H:i', (int) $last['time'])); ?> —
                            <?php echo $last['ok'] ? 'sent' : esc_html(sprintf('failed (HTTP %d) %s', $last['code'], $last['error'])); ?>
                            <br><span class="description"><?php echo esc_html($last['reason']); ?></span>
                        <?php else : ?>
                            Never
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th>Next scheduled</th>
                    <td><?php echo $next ? esc_html(wp_date('j M Y, H:i', $next)) : 'Nothing pending'; ?></td>
                </tr>
            </table>
            <p>
                <a class="button button-primary" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=craft_rebuild_now'), 'craft_rebuild_now')); ?>">
                    Rebuild now
                </a>
            </p>
        <?php endif; ?>
    </div>
    <?php
}
