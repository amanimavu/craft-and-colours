<?php
/**
 * Custom tables. Must-use plugins have no activation hook, so the schema is
 * checked against a stored version on each load and upgraded when it changes.
 */

defined('ABSPATH') || exit;

const CRAFT_DB_VERSION = '1';

add_action('init', 'craft_maybe_install', 5);

function craft_maybe_install(): void
{
    // `wp core install` boots WordPress before its own tables exist.
    if (wp_installing() || !is_blog_installed()) {
        return;
    }

    if (get_option('craft_db_version') === CRAFT_DB_VERSION) {
        return;
    }

    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';

    $charset = $wpdb->get_charset_collate();

    dbDelta("CREATE TABLE {$wpdb->prefix}craft_subscribers (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  email varchar(190) NOT NULL,
  source varchar(40) NOT NULL DEFAULT '',
  created_at datetime NOT NULL,
  PRIMARY KEY  (id),
  UNIQUE KEY email (email)
) {$charset};");

    dbDelta("CREATE TABLE {$wpdb->prefix}craft_rsvps (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  workshop_id bigint(20) unsigned NOT NULL,
  name varchar(120) NOT NULL,
  email varchar(190) NOT NULL,
  created_at datetime NOT NULL,
  PRIMARY KEY  (id),
  UNIQUE KEY workshop_email (workshop_id,email),
  KEY workshop_id (workshop_id)
) {$charset};");

    update_option('craft_db_version', CRAFT_DB_VERSION);
}
