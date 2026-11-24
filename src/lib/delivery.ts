/**
 * Free Nairobi delivery from this order total. The storefront copy reads it
 * from here; checkout charges by WooCommerce → Shipping → Nairobi → Free
 * shipping "Minimum order amount", which must be set to the same value.
 */
export const FREE_DELIVERY_THRESHOLD_KES = 7500;

/** "KES 7,500" */
export const freeDeliveryAmount = `KES ${FREE_DELIVERY_THRESHOLD_KES.toLocaleString("en")}`;
