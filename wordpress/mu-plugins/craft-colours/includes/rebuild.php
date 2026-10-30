<?php
/**
 * Static-site rebuild hook.
 *
 * Content changes schedule a GitHub repository_dispatch (event type
 * "wordpress_update") after CRAFT_REBUILD_DELAY seconds, so a burst of edits
 * or orders produces one build. The deploy workflow (Phase 9) listens for it.
 *
 * wp-config.php:
 *   CRAFT_GITHUB_REPO   "owner/repo"
 *   CRAFT_GITHUB_TOKEN  fine-grained token, this repo only, Contents: read & write
 *   CRAFT_REBUILD_DELAY optional, seconds (default 300)
 */

defined('ABSPATH') || exit;

const CRAFT_REBUILD_HOOK = 'craft_rebuild_dispatch';
const CRAFT_REBUILD_EVENT = 'wordpress_update';

function craft_rebuild_configured(): bool
{
    return (string) craft_config('CRAFT_GITHUB_REPO', '') !== '' && (string) craft_config('CRAFT_GITHUB_TOKEN', '') !== '';
}

function craft_schedule_rebuild(string $reason): void
{
    if (!craft_rebuild_configured()) {
        return;
    }

    update_option('craft_rebuild_reason', mb_substr($reason, 0, 200), false);

    if (!wp_next_scheduled(CRAFT_REBUILD_HOOK)) {
        wp_schedule_single_event(time() + (int) craft_config('CRAFT_REBUILD_DELAY', 300), CRAFT_REBUILD_HOOK);
    }
}

add_action(CRAFT_REBUILD_HOOK, 'craft_dispatch_rebuild');

function craft_dispatch_rebuild(): bool
{
    if (!craft_rebuild_configured()) {
        return false;
    }

    $reason = (string) get_option('craft_rebuild_reason', 'manual');
    $repo = trim((string) craft_config('CRAFT_GITHUB_REPO'), '/');

    $response = wp_remote_post("https://api.github.com/repos/{$repo}/dispatches", [
        'timeout' => 15,
        'headers' => [
            'Accept' => 'application/vnd.github+json',
            'Authorization' => 'Bearer ' . craft_config('CRAFT_GITHUB_TOKEN'),
            'Content-Type' => 'application/json',
            'User-Agent' => 'craft-colours-wordpress',
            'X-GitHub-Api-Version' => '2022-11-28',
        ],
        'body' => wp_json_encode([
            'event_type' => CRAFT_REBUILD_EVENT,
            'client_payload' => ['reason' => $reason, 'source' => home_url()],
        ]),
    ]);

    $code = is_wp_error($response) ? 0 : (int) wp_remote_retrieve_response_code($response);
    $ok = $code === 204;

    update_option('craft_rebuild_last', [
        'time' => time(),
        'ok' => $ok,
        'code' => $code,
        'reason' => $reason,
        'error' => $ok ? '' : (is_wp_error($response) ? $response->get_error_message() : mb_substr((string) wp_remote_retrieve_body($response), 0, 300)),
    ], false);

    return $ok;
}

/* -------------------------------------------------------------------------
 * Triggers
 * ---------------------------------------------------------------------- */

function craft_rebuild_post_types(): array
{
    return ['post', 'page', 'product', CRAFT_WORKSHOP_TYPE, CRAFT_UGC_TYPE];
}

add_action(
    'transition_post_status',
    static function (string $new_status, string $old_status, WP_Post $post): void {
        if (
            !in_array($post->post_type, craft_rebuild_post_types(), true)
            || wp_is_post_revision($post)
            || wp_is_post_autosave($post)
            || ($new_status !== 'publish' && $old_status !== 'publish')
        ) {
            return;
        }
        craft_schedule_rebuild(sprintf('%s: %s', $post->post_type, $post->post_title));
    },
    10,
    3,
);

add_action('woocommerce_product_set_stock', static fn () => craft_schedule_rebuild('stock change'));
add_action('woocommerce_variation_set_stock', static fn () => craft_schedule_rebuild('stock change'));

foreach (['created_term', 'edited_term', 'delete_term'] as $craft_term_hook) {
    add_action(
        $craft_term_hook,
        static function (int $term_id, int $tt_id, string $taxonomy): void {
            if (in_array($taxonomy, ['category', 'product_cat', 'product_tag'], true)) {
                craft_schedule_rebuild("{$taxonomy} updated");
            }
        },
        10,
        3,
    );
}
unset($craft_term_hook);

/* -------------------------------------------------------------------------
 * Manual "Rebuild site" button in the admin bar
 * ---------------------------------------------------------------------- */

function craft_rebuild_capability(): string
{
    return function_exists('WC') ? 'manage_woocommerce' : 'manage_options';
}

add_action(
    'admin_bar_menu',
    static function (WP_Admin_Bar $bar): void {
        if (!craft_rebuild_configured() || !current_user_can(craft_rebuild_capability())) {
            return;
        }
        $bar->add_node([
            'id' => 'craft-rebuild',
            'title' => 'Rebuild site',
            'href' => wp_nonce_url(admin_url('admin-post.php?action=craft_rebuild_now'), 'craft_rebuild_now'),
            'meta' => ['title' => 'Publish the latest content to the storefront now'],
        ]);
    },
    100,
);

add_action(
    'admin_post_craft_rebuild_now',
    static function (): void {
        check_admin_referer('craft_rebuild_now');
        if (!current_user_can(craft_rebuild_capability())) {
            wp_die('Sorry, you are not allowed to rebuild the site.', 403);
        }

        update_option('craft_rebuild_reason', 'manual: ' . wp_get_current_user()->user_login, false);
        wp_clear_scheduled_hook(CRAFT_REBUILD_HOOK);
        $ok = craft_dispatch_rebuild();

        $back = wp_get_referer() ?: admin_url();
        wp_safe_redirect(add_query_arg('craft_rebuild', $ok ? 'ok' : 'failed', $back));
        exit;
    },
);

add_action(
    'admin_notices',
    static function (): void {
        $status = sanitize_key($_GET['craft_rebuild'] ?? '');
        if ($status === 'ok') {
            echo '<div class="notice notice-success is-dismissible"><p>Rebuild started. The storefront updates in a few minutes.</p></div>';
        } elseif ($status === 'failed') {
            $last = get_option('craft_rebuild_last', []);
            printf(
                '<div class="notice notice-error"><p>Rebuild could not start (HTTP %d). %s</p></div>',
                (int) ($last['code'] ?? 0),
                esc_html($last['error'] ?? ''),
            );
        }
    },
);
