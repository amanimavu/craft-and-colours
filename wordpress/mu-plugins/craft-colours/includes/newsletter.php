<?php
/**
 * POST /wp-json/craft/v1/newsletter — used by src/components/store/NewsletterForm.tsx.
 *
 * Subscribers are stored in {prefix}craft_subscribers and exported from
 * Craft & Colours → Subscribers in wp-admin.
 */

defined('ABSPATH') || exit;

add_action(
    'rest_api_init',
    static function (): void {
        register_rest_route(CRAFT_REST_NAMESPACE, '/newsletter', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => 'craft_handle_newsletter',
            'permission_callback' => '__return_true',
        ]);
    },
);

function craft_handle_newsletter(WP_REST_Request $request): WP_REST_Response|WP_Error
{
    if (craft_is_bot($request)) {
        return rest_ensure_response(['ok' => true]);
    }

    if (craft_rate_limited('newsletter', 10, HOUR_IN_SECONDS)) {
        return craft_error('craft_rate_limited', 'Too many sign-ups from this connection. Please try again later.', 429);
    }

    $email = craft_email_param($request);
    if ($email === '') {
        return craft_error('craft_invalid_email', 'That email doesn’t look right. Try again?');
    }

    global $wpdb;

    // INSERT IGNORE: signing up twice is not an error, and we don't reveal
    // whether an address was already on the list.
    $wpdb->query(
        $wpdb->prepare(
            "INSERT IGNORE INTO {$wpdb->prefix}craft_subscribers (email, source, created_at) VALUES (%s, %s, %s)",
            $email,
            craft_text_param($request, 'source', 40),
            current_time('mysql'),
        ),
    );

    if ($wpdb->last_error) {
        return craft_error('craft_newsletter_failed', 'We could not add you just now. Please try again in a moment.', 500);
    }

    return rest_ensure_response(['ok' => true]);
}

function craft_subscriber_count(): int
{
    global $wpdb;
    return (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}craft_subscribers");
}
