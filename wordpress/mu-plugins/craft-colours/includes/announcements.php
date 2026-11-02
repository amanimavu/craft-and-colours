<?php
/**
 * Announcement ticker at the top of every storefront page.
 *
 * Edited under Craft & Colours → Settings, one announcement per line.
 * GET /wp-json/craft/v1/announcements is read at build time by
 * getAnnouncements() in src/lib/wordpress.ts.
 */

defined('ABSPATH') || exit;

/**
 * @return string[]
 */
function craft_announcements(): array
{
    $lines = preg_split('/\R/', (string) get_option('craft_announcements', ''));

    return array_values(array_filter(array_map('craft_plain', $lines), 'strlen'));
}

add_action(
    'rest_api_init',
    static function (): void {
        register_rest_route(CRAFT_REST_NAMESPACE, '/announcements', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => static fn (): WP_REST_Response => rest_ensure_response(craft_announcements()),
            'permission_callback' => '__return_true',
        ]);
    },
);

// The first save adds the option rather than updating it.
foreach (['add_option_craft_announcements', 'update_option_craft_announcements'] as $craft_announcement_hook) {
    add_action($craft_announcement_hook, static fn () => craft_schedule_rebuild('Announcements updated'));
}
unset($craft_announcement_hook);
