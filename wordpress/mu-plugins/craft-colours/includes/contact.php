<?php
/**
 * POST /wp-json/craft/v1/contact — used by src/components/store/ContactForm.tsx.
 */

defined('ABSPATH') || exit;

add_action(
    'rest_api_init',
    static function (): void {
        register_rest_route(CRAFT_REST_NAMESPACE, '/contact', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => 'craft_handle_contact',
            'permission_callback' => '__return_true',
        ]);
    },
);

function craft_handle_contact(WP_REST_Request $request): WP_REST_Response|WP_Error
{
    if (craft_is_bot($request)) {
        return rest_ensure_response(['ok' => true]);
    }

    if (craft_rate_limited('contact', 5, HOUR_IN_SECONDS)) {
        return craft_error('craft_rate_limited', 'Too many messages from this connection. Please try again later or WhatsApp us.', 429);
    }

    $name = craft_text_param($request, 'name', 100);
    $email = craft_email_param($request);
    $message = mb_substr(trim(sanitize_textarea_field((string) $request->get_param('message'))), 0, 5000);

    if ($name === '') {
        return craft_error('craft_invalid_name', 'Please tell us your name.');
    }
    if ($email === '') {
        return craft_error('craft_invalid_email', 'That email address does not look right.');
    }
    if (mb_strlen($message) < 10) {
        return craft_error('craft_invalid_message', 'Please add a little more detail to your message.');
    }

    $body = implode("\n", [
        "Name: {$name}",
        "Email: {$email}",
        '',
        $message,
        '',
        '—',
        'Sent from the contact form on ' . (craft_frontend_url() ?: home_url()),
    ]);

    $sent = wp_mail(
        craft_contact_email(),
        sprintf('[Craft & Colours] Message from %s', $name),
        $body,
        ['Reply-To: ' . $email],
    );

    if (!$sent) {
        return craft_error('craft_mail_failed', 'We could not send your message just now. Please email or WhatsApp us instead.', 500);
    }

    return rest_ensure_response(['ok' => true]);
}
