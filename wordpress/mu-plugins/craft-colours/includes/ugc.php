<?php
/**
 * Maker posts — the home page "made by you" wall.
 *
 * Title = Instagram handle, excerpt = caption, featured image = photo,
 * "Order" (page attributes) = position on the wall.
 * GET /wp-json/craft/v1/ugc is read at build time by src/lib/wordpress.ts.
 */

defined('ABSPATH') || exit;

const CRAFT_UGC_TYPE = 'craft_ugc';

add_action(
    'init',
    static function (): void {
        register_post_type(CRAFT_UGC_TYPE, [
            'labels' => [
                'name' => 'Maker posts',
                'singular_name' => 'Maker post',
                'add_new_item' => 'Add maker post',
                'edit_item' => 'Edit maker post',
                'all_items' => 'All maker posts',
                'not_found' => 'No maker posts yet.',
            ],
            'public' => false,
            'show_ui' => true,
            'show_in_menu' => true,
            'show_in_rest' => false,
            'menu_position' => 57,
            'menu_icon' => 'dashicons-format-gallery',
            'supports' => ['title', 'excerpt', 'thumbnail', 'page-attributes'],
            'rewrite' => false,
        ]);
    },
);

add_filter(
    'enter_title_here',
    static fn (string $text, WP_Post $post): string => $post->post_type === CRAFT_UGC_TYPE ? 'Handle, e.g. @wanjiru.makes' : $text,
    10,
    2,
);

add_action(
    'rest_api_init',
    static function (): void {
        register_rest_route(CRAFT_REST_NAMESPACE, '/ugc', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => 'craft_list_ugc',
            'permission_callback' => '__return_true',
            'args' => [
                'limit' => ['type' => 'integer', 'default' => 12, 'minimum' => 1, 'maximum' => 50],
            ],
        ]);
    },
);

function craft_list_ugc(WP_REST_Request $request): WP_REST_Response
{
    $posts = get_posts([
        'post_type' => CRAFT_UGC_TYPE,
        'post_status' => 'publish',
        'posts_per_page' => (int) $request->get_param('limit'),
        'orderby' => ['menu_order' => 'ASC', 'date' => 'DESC'],
        'meta_query' => [['key' => '_thumbnail_id', 'compare' => 'EXISTS']],
    ]);

    $items = array_map(
        static function (WP_Post $post): array {
            $handle = craft_plain(get_the_title($post));
            $handle = str_starts_with($handle, '@') ? $handle : '@' . $handle;
            $caption = craft_plain($post->post_excerpt);

            return [
                'id' => $post->ID,
                'handle' => $handle,
                'caption' => $caption,
                'image' => craft_featured_image($post->ID, $caption ?: "Made by {$handle}"),
            ];
        },
        $posts,
    );

    return rest_ensure_response($items);
}
