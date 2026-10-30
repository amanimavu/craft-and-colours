<?php
/**
 * Plugin Name: Craft & Colours
 * Description: Headless storefront support for craftandcolours.co.ke — CORS, security headers, contact/newsletter/RSVP endpoints, workshops and maker-post types, free-gift logic, low-stock widget and static-site rebuild hook.
 * Version: 1.0.0
 * Requires PHP: 8.1
 * Author: Craft & Colours
 *
 * Must-use plugins only auto-load top-level files, so this loader pulls in
 * the modules from craft-colours/includes/. See docs/wordpress-setup.md.
 */

defined('ABSPATH') || exit;

define('CRAFT_PLUGIN_VERSION', '1.0.0');
define('CRAFT_PLUGIN_DIR', __DIR__ . '/craft-colours');

foreach (
    [
        'helpers',
        'install',
        'cors',
        'security',
        'contact',
        'newsletter',
        'workshops',
        'ugc',
        'free-gift',
        'product-content',
        'whatsapp-payment',
        'address-fields',
        'low-stock',
        'rebuild',
        'admin',
    ] as $craft_module
) {
    require_once CRAFT_PLUGIN_DIR . "/includes/{$craft_module}.php";
}

unset($craft_module);
