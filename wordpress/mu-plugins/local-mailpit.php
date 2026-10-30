<?php
/**
 * Local Docker stack only (wordpress/docker-compose.yml): sends every
 * wp_mail() to Mailpit at http://localhost:8025. Don't upload it to the real
 * CMS — and if it is, it does nothing outside WP_ENVIRONMENT_TYPE 'local'.
 */

defined('ABSPATH') || exit;

if (wp_get_environment_type() !== 'local') {
    return;
}

add_action(
    'phpmailer_init',
    static function ($mailer): void {
        $mailer->isSMTP();
        $mailer->Host = 'mailpit';
        $mailer->Port = 1025;
        $mailer->SMTPAuth = false;
        $mailer->SMTPAutoTLS = false;
    },
);

// WordPress defaults to wordpress@localhost, which fails its own email check.
add_filter('wp_mail_from', static fn () => 'shop@craftandcolours.test');
add_filter('wp_mail_from_name', static fn () => 'Craft & Colours (local)');
