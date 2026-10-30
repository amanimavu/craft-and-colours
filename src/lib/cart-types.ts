import type {
  BillingAddress,
  PostalAddress,
  Price,
  ProductImage,
  VariationAttribute,
} from './types';

export interface CartItem {
  key: string;
  id: number;
  name: string;
  quantity: number;
  quantityLimits: {
    minimum: number;
    maximum: number;
    multipleOf: number;
    editable: boolean;
  };
  prices: Price;
  totals: Price;
  images: ProductImage[];
  variation: VariationAttribute[];
  /** Automatic free craft gift (mu-plugin, Store API `extensions.craft`). */
  freeGift?: boolean;
  /** The cart line the gift was earned with, e.g. "Test Easel + 1 more". */
  giftFor?: string;
}

export interface CartCoupon {
  code: string;
  totalDiscount: string;
  currencyCode: string;
  currencyMinorUnit: number;
}

export interface CartTotals {
  totalItems: string;
  totalItemsTax: string;
  totalDiscount: string;
  totalDiscountTax: string;
  totalShipping: string;
  totalShippingTax: string;
  totalFees: string;
  totalFeesTax: string;
  totalTax: string;
  totalPrice: string;
  currencyCode: string;
  currencySymbol: string;
  currencyMinorUnit: number;
  taxLines: { name: string; price: string; rate: string }[];
}

export interface ShippingRate {
  rateId: string;
  name: string;
  description: string;
  price: string;
  taxes: string;
  selected: boolean;
  currencyCode: string;
  currencyMinorUnit: number;
}

export interface ShippingPackage {
  packageId: number;
  name: string;
  rates: ShippingRate[];
}

export interface Cart {
  items: CartItem[];
  itemsCount: number;
  coupons: CartCoupon[];
  totals: CartTotals;
  shippingPackages: ShippingPackage[];
  paymentMethods: string[];
  needsShipping: boolean;
  needsPayment: boolean;
  billingAddress?: BillingAddress;
  shippingAddress?: PostalAddress;
}

export interface AddItemInput {
  id: number;
  quantity: number;
  variation?: VariationAttribute[];
}

export interface CheckoutPayload {
  billing_address: BillingAddress;
  shipping_address: PostalAddress;
  customer_note?: string;
  payment_method: string;
  payment_data?: { key: string; value: unknown }[];
  create_account?: boolean;
  expected_total?: string;
}

export interface CheckoutResult {
  orderId: string;
  orderKey: string;
  status: string;
  paymentStatus: string;
  redirectUrl: string;
}

export interface CartBackend {
  getCart(): Promise<Cart>;
  addItem(input: AddItemInput): Promise<Cart>;
  updateItem(key: string, quantity: number): Promise<Cart>;
  removeItem(key: string): Promise<Cart>;
  applyCoupon(code: string): Promise<Cart>;
  removeCoupon(code: string): Promise<Cart>;
  updateCustomer(addresses: {
    billing_address: BillingAddress;
    shipping_address: PostalAddress;
  }): Promise<Cart>;
  selectShippingRate(packageId: number, rateId: string): Promise<Cart>;
  checkout(payload: CheckoutPayload): Promise<CheckoutResult>;
}
