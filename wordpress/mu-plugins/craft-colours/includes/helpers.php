<?php
/**
 * Shared helpers: wp-config lookups, request guards and CSV output.
 */

defined('ABSPATH') || exit;

const CRAFT_REST_NAMESPACE = 'craft/v1';

/**
 * Read an optional constant from wp-config.php.
 */
function craft_config(string $name, mixed $default = null): mixed
{
    return defined($name) ? constant($name) : $default;
}

/**
 * Public storefront URL (the Astro site), without a trailing slash.
 */
function craft_frontend_url(): string
{
    return untrailingslashit((string) craft_config('CRAFT_FRONTEND_URL', ''));
}

function craft_contact_email(): string
{
    $email = (string) craft_config('CRAFT_CONTACT_EMAIL', '');
    return is_email($email) ? $email : (string) get_option('admin_email');
}

function craft_client_ip(): string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : '0.0.0.0';
}

/**
 * Simple per-IP throttle backed by transients. Returns true once the caller
 * has used up $limit requests inside $window seconds.
 */
function craft_rate_limited(string $bucket, int $limit, int $window): bool
{
    $key = 'craft_rl_' . $bucket . '_' . md5(craft_client_ip());
    $hits = (int) get_transient($key);

    if ($hits >= $limit) {
        return true;
    }

    set_transient($key, $hits + 1, $window);
    return false;
}

function craft_error(string $code, string $message, int $status = 400): WP_Error
{
    return new WP_Error($code, $message, ['status' => $status]);
}

/**
 * Forms carry a hidden "website" field that people never fill in.
 */
function craft_is_bot(WP_REST_Request $request): bool
{
    return trim((string) $request->get_param('website')) !== '';
}

function craft_text_param(WP_REST_Request $request, string $key, int $max): string
{
    $value = sanitize_text_field((string) $request->get_param($key));
    return mb_substr(trim($value), 0, $max);
}

function craft_email_param(WP_REST_Request $request, string $key = 'email'): string
{
    $email = sanitize_email((string) $request->get_param($key));
    return is_email($email) ? strtolower($email) : '';
}

/**
 * Plain-text decode for titles/excerpts that WordPress has texturized.
 */
function craft_plain(string $value): string
{
    return trim(html_entity_decode(wp_strip_all_tags($value), ENT_QUOTES, 'UTF-8'));
}

/**
 * Featured image in the storefront's ProductImage shape.
 */
function craft_featured_image(int $post_id, string $fallback_alt): array
{
    $attachment_id = (int) get_post_thumbnail_id($post_id);
    $src = $attachment_id ? wp_get_attachment_image_url($attachment_id, 'large') : '';
    $alt = $attachment_id ? (string) get_post_meta($attachment_id, '_wp_attachment_image_alt', true) : '';

    return [
        'id' => $attachment_id ?: null,
        'src' => $src ?: '',
        'alt' => $alt !== '' ? $alt : $fallback_alt,
    ];
}

/**
 * Stream a CSV download and stop. Cells that start with a formula character
 * are prefixed so spreadsheet apps treat them as text.
 */
function craft_send_csv(string $filename, array $header, array $rows): never
{
    nocache_headers();
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . sanitize_file_name($filename) . '"');

    $out = fopen('php://output', 'w');
    fputcsv($out, $header);

    foreach ($rows as $row) {
        fputcsv(
            $out,
            array_map(
                static fn ($cell) => preg_match('/^[=+\-@\t\r]/', (string) $cell) ? "'" . $cell : $cell,
                $row,
            ),
        );
    }

    fclose($out);
    exit;
}
