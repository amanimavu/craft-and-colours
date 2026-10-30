<?php
/**
 * "Order now, pay on confirmation" — launch payment method. Nothing is
 * charged online: the order is placed "On hold" (awaiting payment, stock
 * reserved), the customer messages the shop on WhatsApp to arrange M-Pesa or
 * card payment, and staff mark it Processing once paid.
 *
 * Loaded from whatsapp-payment.php once WooCommerce is available.
 */

defined('ABSPATH') || exit;

class Craft_WhatsApp_Gateway extends WC_Payment_Gateway
{
    public string $instructions = '';

    public function __construct()
    {
        $this->id = 'craft_whatsapp';
        $this->method_title = 'Order now, pay on confirmation';
        $this->method_description = 'Orders are placed On hold with no online charge. The customer messages the shop on WhatsApp for M-Pesa or card payment details; mark the order Processing once paid.';
        $this->has_fields = false;
        $this->supports = ['products'];

        $this->init_form_fields();
        $this->init_settings();

        $this->title = $this->get_option('title');
        $this->description = $this->get_option('description');
        $this->instructions = $this->get_option('instructions');

        add_action('woocommerce_update_options_payment_gateways_' . $this->id, [$this, 'process_admin_options']);
        add_action('woocommerce_email_before_order_table', [$this, 'email_instructions'], 10, 3);
    }

    public function init_form_fields(): void
    {
        $this->form_fields = [
            'enabled' => [
                'title' => 'Enable',
                'type' => 'checkbox',
                'label' => 'Take orders now, collect payment on WhatsApp',
                'default' => 'yes',
            ],
            'title' => [
                'title' => 'Title',
                'type' => 'text',
                'default' => 'Order now, pay on confirmation',
            ],
            'description' => [
                'title' => 'Description',
                'type' => 'textarea',
                'default' => 'Place your order now. We’ll confirm delivery and send payment details (M-Pesa or card) on WhatsApp.',
            ],
            'instructions' => [
                'title' => 'Email instructions',
                'type' => 'textarea',
                'description' => 'Added to the order emails while the order is awaiting payment.',
                'default' => 'Your items are reserved. Message us on WhatsApp with your order number and we’ll send M-Pesa or card payment details. We ship as soon as it’s paid.',
            ],
        ];
    }

    public function process_payment($order_id): array
    {
        $order = wc_get_order($order_id);

        // On hold reserves stock (WooCommerce reduces it on this status).
        $order->update_status('on-hold', 'Awaiting payment on WhatsApp.');

        if (function_exists('WC') && WC()->cart) {
            WC()->cart->empty_cart();
        }

        return [
            'result' => 'success',
            'redirect' => craft_whatsapp_confirmation_url($order) ?: $this->get_return_url($order),
        ];
    }

    public function email_instructions(WC_Order $order, bool $sent_to_admin, bool $plain_text = false): void
    {
        if ($sent_to_admin || $order->get_payment_method() !== $this->id || !$order->has_status('on-hold')) {
            return;
        }

        $link = craft_whatsapp_order_link($order);

        if ($plain_text) {
            echo esc_html(wp_strip_all_tags($this->instructions)) . "\n";
            if ($link) {
                echo esc_url_raw($link) . "\n";
            }
            echo "\n";
            return;
        }

        echo wp_kses_post(wpautop(wptexturize($this->instructions)));
        if ($link) {
            printf(
                '<p><a href="%s" style="display:inline-block;padding:10px 18px;border-radius:999px;background:#25D366;color:#211d19;font-weight:bold;text-decoration:none">Message us on WhatsApp to pay</a></p>',
                esc_url($link),
            );
        }
    }
}
