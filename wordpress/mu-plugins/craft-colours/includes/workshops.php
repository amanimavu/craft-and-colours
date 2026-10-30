<?php
/**
 * Workshops & meetups.
 *
 * - "Workshops" post type with a details box (date, time, capacity, skill,
 *   location, linked WooCommerce ticket product).
 * - GET  /wp-json/craft/v1/workshops — read at build time by src/lib/workshops.ts,
 *   in the storefront's Workshop shape.
 * - POST /wp-json/craft/v1/rsvp      — free-meetup RSVPs from WorkshopBooking.tsx.
 *
 * A workshop with a ticket product is paid (booked through the cart, seats =
 * ticket stock). Without one it is a free meetup (seats = capacity − RSVPs).
 */

defined('ABSPATH') || exit;

const CRAFT_WORKSHOP_TYPE = 'craft_workshop';

add_action(
    'init',
    static function (): void {
        register_post_type(CRAFT_WORKSHOP_TYPE, [
            'labels' => [
                'name' => 'Workshops',
                'singular_name' => 'Workshop',
                'add_new_item' => 'Add workshop or meetup',
                'edit_item' => 'Edit workshop',
                'all_items' => 'All workshops',
                'search_items' => 'Search workshops',
                'not_found' => 'No workshops yet.',
            ],
            'public' => false,
            'show_ui' => true,
            'show_in_menu' => true,
            'show_in_rest' => false,
            'menu_position' => 56,
            'menu_icon' => 'dashicons-calendar-alt',
            'supports' => ['title', 'editor', 'excerpt', 'thumbnail'],
            'rewrite' => false,
        ]);
    },
);

/* -------------------------------------------------------------------------
 * Details box
 * ---------------------------------------------------------------------- */

function craft_workshop_meta(int $post_id): array
{
    $get = static fn (string $key) => (string) get_post_meta($post_id, "_craft_{$key}", true);

    return [
        'start' => $get('start'),
        'end' => $get('end'),
        'kind' => $get('kind') === 'meetup' ? 'meetup' : 'workshop',
        'skill' => $get('skill'),
        'location' => $get('location') ?: 'Village Market, Nairobi',
        'capacity' => (int) $get('capacity'),
        'ticket_product' => (int) $get('ticket_product'),
    ];
}

add_action(
    'add_meta_boxes_' . CRAFT_WORKSHOP_TYPE,
    static function (): void {
        add_meta_box('craft_workshop_details', 'Session details', 'craft_render_workshop_details', CRAFT_WORKSHOP_TYPE, 'normal', 'high');
        add_meta_box('craft_workshop_rsvps', 'RSVPs', 'craft_render_workshop_rsvps', CRAFT_WORKSHOP_TYPE, 'side');
    },
);

function craft_render_workshop_details(WP_Post $post): void
{
    $meta = craft_workshop_meta($post->ID);
    $tickets = function_exists('wc_get_products')
        ? wc_get_products(['virtual' => true, 'status' => ['publish', 'private'], 'limit' => -1, 'orderby' => 'title', 'order' => 'ASC'])
        : [];

    wp_nonce_field('craft_workshop_save', 'craft_workshop_nonce');
    ?>
    <table class="form-table" role="presentation">
        <tr>
            <th><label for="craft_start">Starts</label></th>
            <td><input type="datetime-local" id="craft_start" name="craft_start" value="<?php echo esc_attr($meta['start']); ?>" required></td>
        </tr>
        <tr>
            <th><label for="craft_end">Ends (time)</label></th>
            <td><input type="time" id="craft_end" name="craft_end" value="<?php echo esc_attr($meta['end']); ?>"></td>
        </tr>
        <tr>
            <th><label for="craft_kind">Type</label></th>
            <td>
                <select id="craft_kind" name="craft_kind">
                    <option value="workshop" <?php selected($meta['kind'], 'workshop'); ?>>Workshop</option>
                    <option value="meetup" <?php selected($meta['kind'], 'meetup'); ?>>Meetup</option>
                </select>
            </td>
        </tr>
        <tr>
            <th><label for="craft_skill">Skill level</label></th>
            <td><input type="text" class="regular-text" id="craft_skill" name="craft_skill" value="<?php echo esc_attr($meta['skill']); ?>" placeholder="Zero experience needed"></td>
        </tr>
        <tr>
            <th><label for="craft_location">Location</label></th>
            <td><input type="text" class="regular-text" id="craft_location" name="craft_location" value="<?php echo esc_attr($meta['location']); ?>"></td>
        </tr>
        <tr>
            <th><label for="craft_capacity">Capacity</label></th>
            <td><input type="number" min="0" step="1" id="craft_capacity" name="craft_capacity" value="<?php echo esc_attr((string) $meta['capacity']); ?>"></td>
        </tr>
        <tr>
            <th><label for="craft_ticket_product">Ticket product</label></th>
            <td>
                <select id="craft_ticket_product" name="craft_ticket_product">
                    <option value="0">None — free meetup (RSVP)</option>
                    <?php foreach ($tickets as $ticket) : ?>
                        <option value="<?php echo esc_attr((string) $ticket->get_id()); ?>" <?php selected($meta['ticket_product'], $ticket->get_id()); ?>>
                            <?php echo esc_html(sprintf('%s (#%d)', $ticket->get_name(), $ticket->get_id())); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                <p class="description">
                    Paid sessions need a <strong>virtual</strong> WooCommerce product with “Manage stock” on;
                    its stock is the number of seats left. Set its catalog visibility to “Hidden”.
                </p>
            </td>
        </tr>
    </table>
    <?php
}

add_action(
    'save_post_' . CRAFT_WORKSHOP_TYPE,
    static function (int $post_id): void {
        if (
            !isset($_POST['craft_workshop_nonce'])
            || !wp_verify_nonce(sanitize_key($_POST['craft_workshop_nonce']), 'craft_workshop_save')
            || (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE)
            || !current_user_can('edit_post', $post_id)
        ) {
            return;
        }

        $start = sanitize_text_field(wp_unslash($_POST['craft_start'] ?? ''));
        $end = sanitize_text_field(wp_unslash($_POST['craft_end'] ?? ''));

        $values = [
            'start' => preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/', $start) ? $start : '',
            'end' => preg_match('/^\d{2}:\d{2}$/', $end) ? $end : '',
            'kind' => ($_POST['craft_kind'] ?? '') === 'meetup' ? 'meetup' : 'workshop',
            'skill' => sanitize_text_field(wp_unslash($_POST['craft_skill'] ?? '')),
            'location' => sanitize_text_field(wp_unslash($_POST['craft_location'] ?? '')),
            'capacity' => max(0, absint($_POST['craft_capacity'] ?? 0)),
            'ticket_product' => absint($_POST['craft_ticket_product'] ?? 0),
        ];

        foreach ($values as $key => $value) {
            update_post_meta($post_id, "_craft_{$key}", $value);
        }
    },
);

/* -------------------------------------------------------------------------
 * Admin list columns
 * ---------------------------------------------------------------------- */

add_filter(
    'manage_' . CRAFT_WORKSHOP_TYPE . '_posts_columns',
    static function (array $columns): array {
        $date = $columns['date'] ?? null;
        unset($columns['date']);
        $columns['craft_starts'] = 'Starts';
        $columns['craft_seats'] = 'Seats left';
        if ($date) {
            $columns['date'] = $date;
        }
        return $columns;
    },
);

add_action(
    'manage_' . CRAFT_WORKSHOP_TYPE . '_posts_custom_column',
    static function (string $column, int $post_id): void {
        $payload = craft_workshop_payload(get_post($post_id));
        if ($column === 'craft_starts') {
            echo esc_html($payload['date'] ? wp_date('j M Y, H:i', strtotime($payload['date'])) : '—');
        }
        if ($column === 'craft_seats') {
            echo esc_html(sprintf('%d / %d%s', $payload['seatsLeft'], $payload['capacity'], $payload['isFree'] ? ' (RSVP)' : ''));
        }
    },
    10,
    2,
);

/* -------------------------------------------------------------------------
 * RSVPs
 * ---------------------------------------------------------------------- */

function craft_rsvp_count(int $workshop_id): int
{
    global $wpdb;
    return (int) $wpdb->get_var(
        $wpdb->prepare("SELECT COUNT(*) FROM {$wpdb->prefix}craft_rsvps WHERE workshop_id = %d", $workshop_id),
    );
}

function craft_rsvps(int $workshop_id): array
{
    global $wpdb;
    return $wpdb->get_results(
        $wpdb->prepare(
            "SELECT name, email, created_at FROM {$wpdb->prefix}craft_rsvps WHERE workshop_id = %d ORDER BY created_at ASC",
            $workshop_id,
        ),
        ARRAY_A,
    ) ?: [];
}

function craft_render_workshop_rsvps(WP_Post $post): void
{
    $rsvps = craft_rsvps($post->ID);

    if (!$rsvps) {
        echo '<p>No RSVPs yet.</p>';
        return;
    }

    echo '<ol style="margin-left:1.2em">';
    foreach ($rsvps as $rsvp) {
        printf('<li>%s<br><a href="mailto:%2$s">%2$s</a></li>', esc_html($rsvp['name']), esc_attr($rsvp['email']));
    }
    echo '</ol>';

    $url = wp_nonce_url(
        admin_url('admin-post.php?action=craft_export_rsvps&workshop=' . $post->ID),
        'craft_export_rsvps_' . $post->ID,
    );
    printf('<p><a class="button" href="%s">Download CSV</a></p>', esc_url($url));
}

add_action(
    'admin_post_craft_export_rsvps',
    static function (): void {
        $workshop_id = absint($_GET['workshop'] ?? 0);
        check_admin_referer('craft_export_rsvps_' . $workshop_id);

        if (!current_user_can('edit_post', $workshop_id)) {
            wp_die('Sorry, you are not allowed to export these RSVPs.', 403);
        }

        $rows = array_map(
            static fn (array $rsvp) => [$rsvp['name'], $rsvp['email'], $rsvp['created_at']],
            craft_rsvps($workshop_id),
        );

        craft_send_csv(
            sprintf('rsvps-%s.csv', get_post_field('post_name', $workshop_id) ?: $workshop_id),
            ['Name', 'Email', 'RSVP date'],
            $rows,
        );
    },
);

/* -------------------------------------------------------------------------
 * REST
 * ---------------------------------------------------------------------- */

add_action(
    'rest_api_init',
    static function (): void {
        register_rest_route(CRAFT_REST_NAMESPACE, '/workshops', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => 'craft_list_workshops',
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(CRAFT_REST_NAMESPACE, '/rsvp', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => 'craft_handle_rsvp',
            'permission_callback' => '__return_true',
        ]);
    },
);

function craft_workshop_start(array $meta): ?DateTimeImmutable
{
    if ($meta['start'] === '') {
        return null;
    }
    $start = DateTimeImmutable::createFromFormat('Y-m-d\TH:i', $meta['start'], wp_timezone());
    return $start ?: null;
}

function craft_format_duration(int $seconds): string
{
    $hours = $seconds / HOUR_IN_SECONDS;
    if ($hours < 1) {
        return sprintf('%d minutes', round($seconds / MINUTE_IN_SECONDS));
    }
    $label = rtrim(rtrim(number_format($hours, 1), '0'), '.');
    return $label === '1' ? '1 hour' : "{$label} hours";
}

/**
 * Price in the Store API shape (amounts in minor units, as strings).
 */
function craft_store_price(?WC_Product $product): array
{
    $decimals = function_exists('wc_get_price_decimals') ? wc_get_price_decimals() : 2;
    $symbol = function_exists('get_woocommerce_currency_symbol')
        ? html_entity_decode(get_woocommerce_currency_symbol(), ENT_QUOTES, 'UTF-8')
        : 'KSh';
    $minor = static fn ($amount) => (string) (int) round((float) $amount * (10 ** $decimals));

    $price = $product ? $minor($product->get_price()) : '0';

    return [
        'price' => $price,
        'regular_price' => $product ? $minor($product->get_regular_price() ?: $product->get_price()) : '0',
        'sale_price' => $price,
        'currency_code' => function_exists('get_woocommerce_currency') ? get_woocommerce_currency() : 'KES',
        'currency_symbol' => $symbol,
        'currency_minor_unit' => $decimals,
        'currency_decimal_separator' => function_exists('wc_get_price_decimal_separator') ? wc_get_price_decimal_separator() : '.',
        'currency_thousand_separator' => function_exists('wc_get_price_thousand_separator') ? wc_get_price_thousand_separator() : ',',
        'currency_prefix' => $symbol . ' ',
        'currency_suffix' => '',
        'price_range' => null,
    ];
}

function craft_workshop_payload(WP_Post $post): array
{
    $meta = craft_workshop_meta($post->ID);
    $start = craft_workshop_start($meta);
    $end = null;

    if ($start && $meta['end'] !== '') {
        [$hour, $minute] = array_map('intval', explode(':', $meta['end']));
        $end = $start->setTime($hour, $minute);
    }

    $product = $meta['ticket_product'] && function_exists('wc_get_product')
        ? wc_get_product($meta['ticket_product'])
        : null;
    $product = $product instanceof WC_Product ? $product : null;

    if ($product) {
        $seats_left = $product->managing_stock()
            ? max(0, (int) $product->get_stock_quantity())
            : ($product->is_in_stock() ? $meta['capacity'] : 0);
    } else {
        $seats_left = max(0, $meta['capacity'] - craft_rsvp_count($post->ID));
    }

    $title = craft_plain(get_the_title($post));

    return [
        'id' => $post->ID,
        'slug' => $post->post_name,
        'title' => $title,
        'excerpt' => craft_plain(get_the_excerpt($post)),
        'description' => apply_filters('the_content', $post->post_content),
        'date' => $start ? $start->format(DATE_ATOM) : '',
        'time' => $start ? $start->format('H:i') . ($end ? '–' . $end->format('H:i') : '') : '',
        'duration' => $start && $end && $end > $start ? craft_format_duration($end->getTimestamp() - $start->getTimestamp()) : '',
        'price' => craft_store_price($product),
        'isFree' => !$product,
        'skill' => $meta['skill'],
        'location' => $meta['location'],
        'capacity' => $meta['capacity'],
        'seatsLeft' => $seats_left,
        'kind' => $meta['kind'],
        'image' => craft_featured_image($post->ID, $title),
        'wooProductId' => $product ? $product->get_id() : null,
    ];
}

function craft_list_workshops(): WP_REST_Response
{
    $posts = get_posts([
        'post_type' => CRAFT_WORKSHOP_TYPE,
        'post_status' => 'publish',
        'posts_per_page' => 200,
        'meta_key' => '_craft_start',
        'orderby' => 'meta_value',
        'order' => 'ASC',
    ]);

    $workshops = array_values(array_filter(
        array_map('craft_workshop_payload', $posts),
        static fn (array $workshop) => $workshop['date'] !== '',
    ));

    return rest_ensure_response($workshops);
}

function craft_handle_rsvp(WP_REST_Request $request): WP_REST_Response|WP_Error
{
    if (craft_is_bot($request)) {
        return rest_ensure_response(['ok' => true]);
    }

    if (craft_rate_limited('rsvp', 10, HOUR_IN_SECONDS)) {
        return craft_error('craft_rate_limited', 'Too many RSVPs from this connection. Please try again later.', 429);
    }

    $workshop = get_post(absint($request->get_param('workshop_id')));
    if (!$workshop || $workshop->post_type !== CRAFT_WORKSHOP_TYPE || $workshop->post_status !== 'publish') {
        return craft_error('craft_unknown_workshop', 'We could not find that session.', 404);
    }

    $name = craft_text_param($request, 'name', 120);
    $email = craft_email_param($request);
    if ($name === '' || $email === '') {
        return craft_error('craft_invalid_rsvp', 'Please add your name and email so we can save your seat.');
    }

    $payload = craft_workshop_payload($workshop);

    if (!$payload['isFree']) {
        return craft_error('craft_paid_workshop', 'This is a paid workshop — please book a ticket instead.');
    }
    if ($payload['date'] === '' || strtotime($payload['date']) < time()) {
        return craft_error('craft_workshop_past', 'This session has already happened.', 410);
    }

    global $wpdb;
    $table = "{$wpdb->prefix}craft_rsvps";

    $existing = (int) $wpdb->get_var(
        $wpdb->prepare("SELECT id FROM {$table} WHERE workshop_id = %d AND email = %s", $workshop->ID, $email),
    );
    if ($existing) {
        return rest_ensure_response(['ok' => true, 'already' => true, 'seats_left' => $payload['seatsLeft']]);
    }

    if ($payload['seatsLeft'] <= 0) {
        return craft_error('craft_workshop_full', 'Sorry, this meetup is full. Message us and we will add you to the waitlist.', 409);
    }

    $inserted = $wpdb->insert($table, [
        'workshop_id' => $workshop->ID,
        'name' => $name,
        'email' => $email,
        'created_at' => current_time('mysql'),
    ]);

    if (!$inserted) {
        return craft_error('craft_rsvp_failed', 'We could not save your RSVP just now. Please try again.', 500);
    }

    craft_send_rsvp_emails($payload, $name, $email);
    craft_schedule_rebuild('RSVP: ' . $payload['title']);

    return rest_ensure_response(['ok' => true, 'seats_left' => max(0, $payload['seatsLeft'] - 1)]);
}

function craft_send_rsvp_emails(array $workshop, string $name, string $email): void
{
    $when = wp_date('l j F Y', strtotime($workshop['date'])) . ', ' . $workshop['time'];
    $url = craft_frontend_url() ? craft_frontend_url() . '/workshops/' . $workshop['slug'] . '/' : '';

    wp_mail(
        $email,
        sprintf('You’re on the list: %s', $workshop['title']),
        implode("\n", [
            "Hi {$name},",
            '',
            "Your seat at {$workshop['title']} is saved.",
            '',
            "When: {$when}",
            "Where: {$workshop['location']}",
            ...($url ? ["Details: {$url}"] : []),
            '',
            'Plans changed? Just reply to this email so someone else can take your seat.',
            '',
            'See you there,',
            'Craft & Colours',
        ]),
        ['Reply-To: ' . craft_contact_email()],
    );

    wp_mail(
        craft_contact_email(),
        sprintf('[Craft & Colours] New RSVP: %s', $workshop['title']),
        sprintf("%s <%s> RSVP'd for %s (%s).\nSeats left: %d", $name, $email, $workshop['title'], $when, max(0, $workshop['seatsLeft'] - 1)),
        ['Reply-To: ' . $email],
    );
}
