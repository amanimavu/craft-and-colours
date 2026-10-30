import { demoProducts } from './demo-data';
import type {
  AddItemInput,
  Cart,
  CartBackend,
  CartCoupon,
  CartItem,
  CartTotals,
  CheckoutPayload,
  CheckoutResult,
  ShippingPackage,
  ShippingRate,
} from './cart-types';
import type {
  BillingAddress,
  PostalAddress,
  Price,
  Product,
  ProductImage,
  ProductVariation,
  VariationAttribute,
} from './types';

const storeUrl = (import.meta.env.PUBLIC_WC_STORE_URL || '').replace(/\/$/, '');
export const hasWooCommerce = Boolean(storeUrl);
export const getStoreUrl = () => storeUrl;

const CART_TOKEN_KEY = 'craft_cart_token';
const DEMO_CART_KEY = 'craft_demo_cart_v1';
const DEMO_FLAT_SHIPPING = 30000;
const DEMO_FREE_SHIPPING_THRESHOLD = 450000;
export const DEMO_FREE_GIFT_THRESHOLD = 500000;

function readToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(CART_TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (token) window.localStorage.setItem(CART_TOKEN_KEY, token);
    else window.localStorage.removeItem(CART_TOKEN_KEY);
  } catch {
    // Storage can be unavailable in private browsing; the cart still works in-memory.
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!storeUrl) throw new Error('WooCommerce Store URL is not configured.');

  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');

  const token = readToken();
  if (token) headers.set('Cart-Token', token);

  const response = await fetch(`${storeUrl}/wp-json/wc/store/v1${path}`, {
    ...init,
    headers,
    credentials: 'omit',
  });

  const nextToken = response.headers.get('Cart-Token');
  if (nextToken) writeToken(nextToken);

  const data = (await response.json().catch(() => null)) as
    | { message?: string; code?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      data?.message || `Store request failed (${response.status}).`,
    );
  }

  return data as T;
}

function normalizePrice(raw: Record<string, unknown> | undefined): Price {
  const value = raw ?? {};
  const str = (key: string, fallback = '0') =>
    typeof value[key] === 'string' || typeof value[key] === 'number'
      ? String(value[key])
      : fallback;

  return {
    price: str('price'),
    regular_price: str('regular_price', str('price')),
    sale_price: str('sale_price', str('price')),
    currency_code: str('currency_code', 'KES'),
    currency_symbol: str('currency_symbol', 'KSh'),
    currency_minor_unit: Number(value.currency_minor_unit ?? 2),
    currency_decimal_separator: str('currency_decimal_separator', '.'),
    currency_thousand_separator: str('currency_thousand_separator', ','),
    currency_prefix: str('currency_prefix', str('currency_symbol', 'KSh')),
    currency_suffix: str('currency_suffix', ''),
    price_range: null,
  };
}

function normalizeImage(raw: Record<string, unknown>): ProductImage {
  return {
    id: typeof raw.id === 'number' ? raw.id : undefined,
    src: typeof raw.src === 'string' ? raw.src : '',
    alt:
      typeof raw.alt === 'string' && raw.alt.length > 0
        ? raw.alt
        : typeof raw.name === 'string'
          ? raw.name
          : 'Product image',
    thumbnail: typeof raw.thumbnail === 'string' ? raw.thumbnail : undefined,
  };
}

function normalizeCartItem(raw: Record<string, unknown>): CartItem {
  const prices = normalizePrice(raw.prices as Record<string, unknown>);
  const totals = (raw.totals ?? {}) as Record<string, unknown>;
  const quantityLimits = (raw.quantity_limits ?? {}) as Record<string, unknown>;
  const variation = Array.isArray(raw.variation)
    ? (raw.variation as Record<string, unknown>[]).map((attribute) => ({
        name: String(attribute.name ?? ''),
        value: String(attribute.value ?? ''),
        slug: typeof attribute.slug === 'string' ? attribute.slug : undefined,
        taxonomy:
          typeof attribute.taxonomy === 'string' ? attribute.taxonomy : null,
      }))
    : [];

  return {
    key: String(raw.key ?? ''),
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? ''),
    quantity: Number(raw.quantity ?? 1),
    quantityLimits: {
      minimum: Number(quantityLimits.minimum ?? 1),
      maximum: Number(quantityLimits.maximum ?? 9999),
      multipleOf: Number(quantityLimits.multiple_of ?? 1),
      editable: Boolean(quantityLimits.editable ?? true),
    },
    prices,
    totals: {
      ...prices,
      price: String(totals.line_total ?? prices.price),
      regular_price: String(totals.line_subtotal ?? prices.regular_price),
      sale_price: String(totals.line_total ?? prices.sale_price),
    },
    images: Array.isArray(raw.images)
      ? (raw.images as Record<string, unknown>[]).map(normalizeImage)
      : [],
    variation,
  };
}

function normalizeCart(raw: Record<string, unknown>): Cart {
  const totals = (raw.totals ?? {}) as Record<string, unknown>;
  const shippingPackages: ShippingPackage[] = Array.isArray(raw.shipping_rates)
    ? (raw.shipping_rates as Record<string, unknown>[]).map((pkg) => ({
        packageId: Number(pkg.package_id ?? 0),
        name: String(pkg.name ?? 'Shipping'),
        rates: Array.isArray(pkg.shipping_rates)
          ? (pkg.shipping_rates as Record<string, unknown>[]).map(
              (rate): ShippingRate => ({
                rateId: String(rate.rate_id ?? ''),
                name: String(rate.name ?? ''),
                description: String(rate.description ?? ''),
                price: String(rate.price ?? '0'),
                taxes: String(rate.taxes ?? '0'),
                selected: Boolean(rate.selected),
                currencyCode: String(rate.currency_code ?? 'KES'),
                currencyMinorUnit: Number(rate.currency_minor_unit ?? 2),
              }),
            )
          : [],
      }))
    : [];

  const coupons: CartCoupon[] = Array.isArray(raw.coupons)
    ? (raw.coupons as Record<string, unknown>[]).map((coupon) => {
        const couponTotals = (coupon.totals ?? {}) as Record<string, unknown>;
        return {
          code: String(coupon.code ?? ''),
          totalDiscount: String(couponTotals.total_discount ?? '0'),
          currencyCode: String(couponTotals.currency_code ?? 'KES'),
          currencyMinorUnit: Number(couponTotals.currency_minor_unit ?? 2),
        };
      })
    : [];

  return {
    items: Array.isArray(raw.items)
      ? (raw.items as Record<string, unknown>[]).map(normalizeCartItem)
      : [],
    itemsCount: Number(raw.items_count ?? 0),
    coupons,
    totals: {
      totalItems: String(totals.total_items ?? '0'),
      totalItemsTax: String(totals.total_items_tax ?? '0'),
      totalDiscount: String(totals.total_discount ?? '0'),
      totalDiscountTax: String(totals.total_discount_tax ?? '0'),
      totalShipping: String(totals.total_shipping ?? '0'),
      totalShippingTax: String(totals.total_shipping_tax ?? '0'),
      totalFees: String(totals.total_fees ?? '0'),
      totalFeesTax: String(totals.total_fees_tax ?? '0'),
      totalTax: String(totals.total_tax ?? '0'),
      totalPrice: String(totals.total_price ?? '0'),
      currencyCode: String(totals.currency_code ?? 'KES'),
      currencySymbol: String(totals.currency_symbol ?? 'KSh'),
      currencyMinorUnit: Number(totals.currency_minor_unit ?? 2),
      taxLines: Array.isArray(totals.tax_lines)
        ? (totals.tax_lines as Record<string, unknown>[]).map((line) => ({
            name: String(line.name ?? 'Tax'),
            price: String(line.price ?? '0'),
            rate: String(line.rate ?? ''),
          }))
        : [],
    },
    shippingPackages,
    paymentMethods: Array.isArray(raw.payment_methods)
      ? (raw.payment_methods as unknown[]).map(String)
      : [],
    needsShipping: Boolean(raw.needs_shipping ?? true),
    needsPayment: Boolean(raw.needs_payment ?? true),
    billingAddress: raw.billing_address as BillingAddress | undefined,
    shippingAddress: raw.shipping_address as PostalAddress | undefined,
  };
}

const storeBackend: CartBackend = {
  async getCart() {
    return normalizeCart(await request<Record<string, unknown>>('/cart'));
  },

  async addItem({ id, quantity, variation }: AddItemInput) {
    const body: Record<string, unknown> = { id, quantity };
    if (variation && variation.length > 0) {
      body.variation = variation.map((attribute) => ({
        attribute: attribute.taxonomy || attribute.name,
        value: attribute.slug || attribute.value,
      }));
    }
    return normalizeCart(
      await request<Record<string, unknown>>('/cart/add-item', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    );
  },

  async updateItem(key, quantity) {
    return normalizeCart(
      await request<Record<string, unknown>>('/cart/update-item', {
        method: 'POST',
        body: JSON.stringify({ key, quantity }),
      }),
    );
  },

  async removeItem(key) {
    return normalizeCart(
      await request<Record<string, unknown>>('/cart/remove-item', {
        method: 'POST',
        body: JSON.stringify({ key }),
      }),
    );
  },

  async applyCoupon(code) {
    return normalizeCart(
      await request<Record<string, unknown>>('/cart/apply-coupon', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
    );
  },

  async removeCoupon(code) {
    return normalizeCart(
      await request<Record<string, unknown>>('/cart/remove-coupon', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
    );
  },

  async updateCustomer(addresses) {
    return normalizeCart(
      await request<Record<string, unknown>>('/cart/update-customer', {
        method: 'POST',
        body: JSON.stringify(addresses),
      }),
    );
  },

  async selectShippingRate(packageId, rateId) {
    return normalizeCart(
      await request<Record<string, unknown>>('/cart/select-shipping-rate', {
        method: 'POST',
        body: JSON.stringify({ package_id: packageId, rate_id: rateId }),
      }),
    );
  },

  async checkout(payload: CheckoutPayload): Promise<CheckoutResult> {
    const raw = await request<Record<string, unknown>>('/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    writeToken(null);

    const paymentResult = raw.payment_result as
      | Record<string, unknown>
      | null
      | undefined;

    return {
      orderId: String(raw.order_id ?? ''),
      orderKey: String(raw.order_key ?? ''),
      status: String(raw.status ?? ''),
      paymentStatus: String(paymentResult?.payment_status ?? ''),
      redirectUrl: String(paymentResult?.redirect_url ?? ''),
    };
  },
};

interface DemoLine {
  id: number;
  quantity: number;
  variation?: VariationAttribute[];
}

interface DemoState {
  lines: DemoLine[];
  coupon?: string;
  shippingRate?: string;
  billingAddress?: BillingAddress;
  shippingAddress?: PostalAddress;
}

function readDemoState(): DemoState {
  if (typeof window === 'undefined') return { lines: [] };
  try {
    const raw = window.localStorage.getItem(DEMO_CART_KEY);
    if (!raw) return { lines: [] };
    const parsed = JSON.parse(raw) as DemoState;
    return {
      ...parsed,
      lines: Array.isArray(parsed.lines) ? parsed.lines : [],
    };
  } catch {
    return { lines: [] };
  }
}

function writeDemoState(state: DemoState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DEMO_CART_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures.
  }
}

function findDemoLine(id: number): {
  product: Product;
  variation?: ProductVariation;
} | null {
  for (const product of demoProducts) {
    if (product.id === id) return { product };
    const variation = product.variations?.find((item) => item.id === id);
    if (variation) return { product, variation };
  }
  return null;
}

function demoTotals(
  subtotal: number,
  discount: number,
  shipping: number,
): CartTotals {
  return {
    totalItems: String(subtotal),
    totalItemsTax: '0',
    totalDiscount: String(discount),
    totalDiscountTax: '0',
    totalShipping: String(shipping),
    totalShippingTax: '0',
    totalFees: '0',
    totalFeesTax: '0',
    totalTax: '0',
    totalPrice: String(Math.max(0, subtotal - discount + shipping)),
    currencyCode: 'KES',
    currencySymbol: 'KSh',
    currencyMinorUnit: 2,
    taxLines: [],
  };
}

function buildDemoCart(state: DemoState): Cart {
  const items: CartItem[] = [];
  let needsShipping = false;

  for (const line of state.lines) {
    const found = findDemoLine(line.id);
    if (!found) continue;

    const { product, variation } = found;
    if (!product.isVirtual) needsShipping = true;
    const unitPrice = Number(
      variation?.prices.price ?? product.prices.price ?? '0',
    );
    const lineTotal = unitPrice * line.quantity;
    const unit = variation?.prices ?? product.prices;
    const image = variation?.image ?? product.images[0];

    items.push({
      key: `demo-${line.id}`,
      id: line.id,
      name: product.name,
      quantity: line.quantity,
      quantityLimits: {
        minimum: 1,
        maximum: 99,
        multipleOf: 1,
        editable: true,
      },
      prices: unit,
      totals: {
        ...unit,
        price: String(lineTotal),
        regular_price: String(lineTotal),
        sale_price: String(lineTotal),
      },
      images: image ? [image] : [],
      variation: variation?.attributes ?? line.variation ?? [],
    });
  }

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.totals.price),
    0,
  );
  const couponCode = state.coupon?.trim().toUpperCase();
  const discountRate = couponCode === 'CRAFT10' ? 0.1 : 0;
  const discount = Math.round(subtotal * discountRate);
  const freeShipping = subtotal >= DEMO_FREE_SHIPPING_THRESHOLD;
  const selectedRate =
    state.shippingRate ?? (freeShipping ? 'free_shipping' : 'flat_rate');
  const shipping =
    !needsShipping || selectedRate === 'free_shipping' || freeShipping
      ? 0
      : DEMO_FLAT_SHIPPING;

  const shippingPackages: ShippingPackage[] = needsShipping
    ? [
        {
          packageId: 0,
          name: 'Delivery',
          rates: [
            {
              rateId: 'flat_rate',
              name: 'Courier delivery',
              description: '3–5 working days',
              price: String(DEMO_FLAT_SHIPPING),
              taxes: '0',
              selected: selectedRate === 'flat_rate' && !freeShipping,
              currencyCode: 'KES',
              currencyMinorUnit: 2,
            },
            {
              rateId: 'free_shipping',
              name: 'Free delivery',
              description: 'Free delivery in Nairobi over KES 4,500',
              price: '0',
              taxes: '0',
              selected: selectedRate === 'free_shipping' || freeShipping,
              currencyCode: 'KES',
              currencyMinorUnit: 2,
            },
          ],
        },
      ]
    : [];

  const coupons: CartCoupon[] = couponCode
    ? [
        {
          code: couponCode,
          totalDiscount: String(discount),
          currencyCode: 'KES',
          currencyMinorUnit: 2,
        },
      ]
    : [];

  return {
    items,
    itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
    coupons,
    totals: demoTotals(subtotal, discount, shipping),
    shippingPackages,
    paymentMethods: items.length ? ['mpesa', 'card'] : [],
    needsShipping,
    needsPayment: items.length > 0,
    billingAddress: state.billingAddress,
    shippingAddress: state.shippingAddress,
  };
}

function sleep(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const demoBackend: CartBackend = {
  async getCart() {
    return buildDemoCart(readDemoState());
  },

  async addItem({ id, quantity, variation }) {
    await sleep(200);
    const state = readDemoState();
    const existing = state.lines.find((line) => line.id === id);
    if (existing) existing.quantity = Math.min(99, existing.quantity + quantity);
    else state.lines.push({ id, quantity, variation });
    writeDemoState(state);
    return buildDemoCart(state);
  },

  async updateItem(key, quantity) {
    await sleep(150);
    const state = readDemoState();
    const id = Number(key.replace(/^demo-/, ''));
    const line = state.lines.find((item) => item.id === id);
    if (line) line.quantity = Math.max(1, Math.min(99, quantity));
    writeDemoState(state);
    return buildDemoCart(state);
  },

  async removeItem(key) {
    await sleep(150);
    const state = readDemoState();
    const id = Number(key.replace(/^demo-/, ''));
    state.lines = state.lines.filter((item) => item.id !== id);
    writeDemoState(state);
    return buildDemoCart(state);
  },

  async applyCoupon(code) {
    await sleep(200);
    const state = readDemoState();
    const normalized = code.trim().toUpperCase();
    if (normalized !== 'CRAFT10') {
      throw new Error('That coupon code is not valid.');
    }
    state.coupon = normalized;
    writeDemoState(state);
    return buildDemoCart(state);
  },

  async removeCoupon() {
    const state = readDemoState();
    state.coupon = undefined;
    writeDemoState(state);
    return buildDemoCart(state);
  },

  async updateCustomer(addresses) {
    await sleep(300);
    const state = {
      ...readDemoState(),
      billingAddress: addresses.billing_address,
      shippingAddress: addresses.shipping_address,
    };
    writeDemoState(state);
    return buildDemoCart(state);
  },

  async selectShippingRate(_packageId, rateId) {
    const state = { ...readDemoState(), shippingRate: rateId };
    writeDemoState(state);
    return buildDemoCart(state);
  },

  async checkout(payload: CheckoutPayload): Promise<CheckoutResult> {
    await sleep(600);
    const state = readDemoState();
    const cart = buildDemoCart(state);
    if (cart.items.length === 0) throw new Error('Your cart is empty.');

    if (
      payload.expected_total &&
      payload.expected_total !== cart.totals.totalPrice
    ) {
      throw new Error('Your cart total changed. Please review it and try again.');
    }

    writeDemoState({ lines: [] });
    const orderId = `CC-${String(Date.now()).slice(-6)}`;

    return {
      orderId,
      orderKey: `demo_${Date.now()}`,
      status: 'processing',
      paymentStatus: 'success',
      redirectUrl: '',
    };
  },
};

export function createBackend(): CartBackend {
  return hasWooCommerce ? storeBackend : demoBackend;
}
