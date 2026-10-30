<?php
/**
 * Hardening for a WordPress install that only serves the admin and APIs.
 */

defined('ABSPATH') || exit;

function craft_security_headers(): array
{
    return [
        'X-Content-Type-Options' => 'nosniff',
        'Referrer-Policy' => 'strict-origin-when-cross-origin',
        'X-Frame-Options' => 'SAMEORIGIN',
        'Permissions-Policy' => 'camera=(), microphone=(), geolocation=()',
    ];
}

// Front-end and admin pages. The CMS is not the public site, so keep it out
// of search results.
add_action(
    'send_headers',
    static function (): void {
        foreach (craft_security_headers() as $name => $value) {
            header("{$name}: {$value}");
        }
        header('X-Robots-Tag: noindex, nofollow');
    },
);

// REST responses skip send_headers, so add the same headers there.
add_filter(
    'rest_post_dispatch',
    static function (WP_REST_Response $response): WP_REST_Response {
        foreach (craft_security_headers() as $name => $value) {
            $response->header($name, $value);
        }
        return $response;
    },
);

add_filter('xmlrpc_enabled', '__return_false');
add_filter('the_generator', '__return_empty_string');
remove_action('wp_head', 'wp_generator');

add_filter(
    'wp_headers',
    static function (array $headers): array {
        unset($headers['X-Pingback']);
        return $headers;
    },
);

// Stop anonymous user enumeration through the REST API and ?author=N.
add_filter(
    'rest_pre_dispatch',
    static function (mixed $result, WP_REST_Server $server, WP_REST_Request $request): mixed {
        if (str_starts_with($request->get_route(), '/wp/v2/users') && !current_user_can('list_users')) {
            return craft_error('rest_forbidden', __('Sorry, you are not allowed to do that.'), 401);
        }
        return $result;
    },
    10,
    3,
);

add_action(
    'template_redirect',
    static function (): void {
        if (isset($_GET['author']) && !is_admin()) {
            wp_safe_redirect(home_url('/'), 301);
            exit;
        }
    },
);
