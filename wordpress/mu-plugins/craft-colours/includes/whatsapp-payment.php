<?php
/**
 * Launch payment flow: every order is placed with "Order now, pay on
 * confirmation" (gateway id craft_whatsapp, see class-whatsapp-gateway.php)
 * and paid off the platform, arranged on WhatsApp. Disable it under WooCommerce → Settings → Payments once a
 * real M-Pesa/card gateway is live.
 *
 * wp-config.php: CRAFT_WHATSAPP — shop number in international format, e.g.
 * '+254700000000'. Used for the "Message us on WhatsApp" links in emails.
 */

defined('ABSPATH') || exit;

// WC_Payment_Gateway only exists once WooCommerce has loaded, which is after
// must-use plugins.
add_action(
    'plugins_loaded',
    static function (): void {
        if (class_exists('WC_Payment_Gateway')) {
            require_once __DIR__ . '/class-whatsapp-gateway.php';
        }
    },
    11,
);

add_filter(
    'woocommerce_payment_gateways',
    static function (array $gateways): array {
        if (class_exists('Craft_WhatsApp_Gateway')) {
            $gateways[] = 'Craft_WhatsApp_Gateway';
        }
        return $gateways;
    },
);

function craft_whatsapp_number(): string
{
    return preg_replace('/\D/', '', (string) craft_config('CRAFT_WHATSAPP', ''));
}

function craft_order_total_label(WC_Order $order): string
{
    return html_entity_decode(wp_strip_all_tags(wc_price($order->get_total(), ['currency' => $order->get_currency()])), ENT_QUOTES, 'UTF-8');
}

/**
 * wa.me link with the order number and total prefilled, or '' if no number.
 */
function craft_whatsapp_order_link(WC_Order $order): string
{
    $number = craft_whatsapp_number();
    if ($number === '') {
        return '';
    }

    $message = sprintf(
        'Hi Craft & Colours! I\'ve just placed order #%s (%s). How do I pay?',
        $order->get_order_number(),
        craft_order_total_label($order),
    );

    return 'https://wa.me/' . $number . '?text=' . rawurlencode($message);
}

/**
 * The storefront's confirmation page with the WhatsApp next step, or '' if
 * CRAFT_FRONTEND_URL isn't set.
 */
function craft_whatsapp_confirmation_url(WC_Order $order): string
{
    $frontend = craft_frontend_url();
    if ($frontend === '') {
        return '';
    }

    return add_query_arg(
        [
            'order' => $order->get_order_number(),
            'key' => $order->get_order_key(),
            'pay' => 'whatsapp',
            'total' => rawurlencode(craft_order_total_label($order)),
        ],
        $frontend . '/order-confirmation/',
    );
}
