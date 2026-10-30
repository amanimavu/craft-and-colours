export interface Price {
  price: string;
  regular_price: string;
  sale_price: string;
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
  currency_prefix: string;
  currency_suffix: string;
  price_range?: { min_amount: string; max_amount: string } | null;
}

export interface ProductImage {
  id?: number;
  src: string;
  alt: string;
  thumbnail?: string;
}

export interface VariationAttribute {
  name: string;
  value: string;
  slug?: string;
  taxonomy?: string | null;
}

export interface ProductVariation {
  id: number;
  attributes: VariationAttribute[];
  isInStock: boolean;
  prices: Price;
  image?: ProductImage;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  image?: ProductImage;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  type: string;
  description: string;
  shortDescription: string;
  images: ProductImage[];
  prices: Price;
  isInStock: boolean;
  isPurchasable: boolean;
  hasOptions: boolean;
  categories: Category[];
  variations?: ProductVariation[];
  stockQuantity?: number | null;
  featured?: boolean;
  isNew?: boolean;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  hoverImage?: ProductImage;
  /** Values for CATEGORY_DYNAMIC_FILTERS keys (e.g. finish, material, clay_type). */
  attributes?: Record<string, string>;
  /** Kept out of shop grids, search and category counts, but still purchasable. */
  catalogHidden?: boolean;
  /** Virtual products (e.g. workshop tickets) skip delivery. */
  isVirtual?: boolean;
}

export interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  image?: ProductImage;
  categories: string[];
}

export interface PageContent {
  slug: string;
  title: string;
  content: string;
}

export interface Workshop {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  price: Price;
  isFree: boolean;
  skill: string;
  location: string;
  capacity: number;
  seatsLeft: number;
  kind: 'workshop' | 'meetup';
  image: ProductImage;
  wooProductId?: number;
}

export interface Vibe {
  slug: string;
  title: string;
  description: string;
  href: string;
  image: ProductImage;
  accent: string;
}

export interface UgcPost {
  id: number;
  handle: string;
  caption: string;
  image: ProductImage;
}

export interface Testimonial {
  id: number;
  quote: string;
  name: string;
  detail: string;
  image?: ProductImage;
}

export interface PostalAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
}

export interface BillingAddress extends PostalAddress {
  email: string;
}
