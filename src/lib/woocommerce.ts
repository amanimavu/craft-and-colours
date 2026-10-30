import { demoCategories, demoProducts } from './demo-data';
import type {
  Category,
  Price,
  Product,
  ProductImage,
  ProductVariation,
  VariationAttribute,
} from './types';

const storeUrl = (import.meta.env.PUBLIC_WC_STORE_URL || '').replace(/\/$/, '');
export const hasStore = Boolean(storeUrl);

interface RawRecord {
  [key: string]: unknown;
}

function normalizePrice(raw: RawRecord | undefined): Price {
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
    price_range:
      value.price_range && typeof value.price_range === 'object'
        ? (value.price_range as Price['price_range'])
        : null,
  };
}

function normalizeImage(raw: RawRecord): ProductImage {
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

function normalizeCategory(raw: RawRecord): Category {
  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? ''),
    slug: String(raw.slug ?? ''),
    description: String(raw.description ?? ''),
    count: Number(raw.count ?? 0),
  };
}

function normalizeProduct(raw: RawRecord): Product {
  const categories = Array.isArray(raw.categories)
    ? (raw.categories as RawRecord[]).map(normalizeCategory)
    : [];
  const images = Array.isArray(raw.images)
    ? (raw.images as RawRecord[]).map(normalizeImage)
    : [];
  const rating = Number(raw.average_rating);
  const reviewCount = Number(raw.review_count);

  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? ''),
    slug: String(raw.slug ?? ''),
    type: String(raw.type ?? 'simple'),
    description: String(raw.description ?? ''),
    shortDescription: String(raw.short_description ?? raw.summary ?? ''),
    images,
    hoverImage: images[1],
    prices: normalizePrice(raw.prices as RawRecord | undefined),
    isInStock: Boolean(raw.is_in_stock ?? true),
    isPurchasable: Boolean(raw.is_purchasable ?? true),
    hasOptions: Boolean(raw.has_options) || raw.type === 'variable',
    categories,
    stockQuantity: null,
    featured: Boolean(raw.featured ?? false),
    rating: Number.isFinite(rating) && rating > 0 ? rating : undefined,
    reviewCount:
      Number.isFinite(reviewCount) && reviewCount > 0 ? reviewCount : undefined,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeVariation(raw: RawRecord): ProductVariation {
  const attributes: VariationAttribute[] = Array.isArray(raw.attributes)
    ? (raw.attributes as RawRecord[]).map((attribute) => {
        const name = String(
          attribute.name ?? attribute.attribute ?? 'Option',
        );
        const value = String(attribute.value ?? '');
        const taxonomy =
          typeof attribute.taxonomy === 'string'
            ? attribute.taxonomy
            : typeof attribute.attribute === 'string' &&
                attribute.attribute.startsWith('pa_')
              ? attribute.attribute
              : null;

        return {
          name,
          value,
          slug:
            typeof attribute.slug === 'string'
              ? attribute.slug
              : slugify(value),
          taxonomy,
        };
      })
    : [];

  return {
    id: Number(raw.id ?? 0),
    attributes,
    isInStock: Boolean(raw.is_in_stock ?? true),
    prices: normalizePrice(raw.prices as RawRecord | undefined),
    image: Array.isArray(raw.images)
      ? normalizeImage(raw.images[0] as RawRecord)
      : undefined,
  };
}

async function fetchAllProducts(
  params: URLSearchParams = new URLSearchParams(),
): Promise<RawRecord[]> {
  const all: RawRecord[] = [];
  const search = new URLSearchParams(params);
  search.set('per_page', '100');

  for (let page = 1; page <= 20; page += 1) {
    search.set('page', String(page));
    const response = await fetch(
      `${storeUrl}/wp-json/wc/store/v1/products?${search.toString()}`,
      { headers: { Accept: 'application/json' } },
    );

    if (!response.ok) {
      throw new Error(`WooCommerce request failed (${response.status}).`);
    }

    const batch = (await response.json()) as RawRecord[];
    all.push(...batch);

    const totalPages = Number(response.headers.get('x-wp-totalpages') ?? 1);
    if (batch.length === 0 || page >= totalPages) break;
  }

  return all;
}

function filterDemoCategory(category?: string): Product[] {
  const visible = demoProducts.filter((product) => !product.catalogHidden);
  if (!category) return visible;
  return visible.filter((product) =>
    product.categories.some((item) => item.slug === category),
  );
}

export async function getProducts(
  options: { category?: string; limit?: number } = {},
): Promise<Product[]> {
  if (!hasStore) {
    const products = filterDemoCategory(options.category);
    return options.limit ? products.slice(0, options.limit) : products;
  }

  try {
    const params = new URLSearchParams();
    if (options.category) params.set('category', options.category);
    const raw = await fetchAllProducts(params);
    const products = raw.map(normalizeProduct);
    return options.limit ? products.slice(0, options.limit) : products;
  } catch (error) {
    console.warn(
      `Could not load WooCommerce products from ${storeUrl}; using demo products.`,
      error,
    );
    return filterDemoCategory(options.category);
  }
}

export async function getBestsellers(limit = 5): Promise<Product[]> {
  if (!hasStore) {
    return [...demoProducts]
      .filter((product) => !product.catalogHidden)
      .sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0))
      .slice(0, limit);
  }

  try {
    const response = await fetch(
      `${storeUrl}/wp-json/wc/store/v1/products?orderby=popularity&per_page=${limit}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!response.ok) {
      throw new Error(`WooCommerce request failed (${response.status}).`);
    }
    const raw = (await response.json()) as RawRecord[];
    if (raw.length > 0) return raw.map(normalizeProduct);
  } catch (error) {
    console.warn('Could not load bestsellers; falling back.', error);
  }

  return (await getProducts({ limit })).slice(0, limit);
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  if (!hasStore) {
    return demoProducts
      .filter((product) => product.featured && !product.catalogHidden)
      .slice(0, limit);
  }

  try {
    const response = await fetch(
      `${storeUrl}/wp-json/wc/store/v1/products?featured=true&per_page=${limit}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!response.ok) {
      throw new Error(`WooCommerce request failed (${response.status}).`);
    }
    const raw = (await response.json()) as RawRecord[];
    if (raw.length > 0) return raw.map(normalizeProduct);
  } catch (error) {
    console.warn('Could not load featured products; falling back.', error);
  }

  return (await getProducts({ limit })).slice(0, limit);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  if (!hasStore) {
    return demoProducts.find((product) => product.slug === slug);
  }

  try {
    const response = await fetch(
      `${storeUrl}/wp-json/wc/store/v1/products/${encodeURIComponent(slug)}`,
      { headers: { Accept: 'application/json' } },
    );

    if (response.status === 404) return undefined;
    if (!response.ok) {
      throw new Error(`WooCommerce request failed (${response.status}).`);
    }

    const raw = (await response.json()) as RawRecord;
    const product = normalizeProduct(raw);

    if (raw.type === 'variable' || raw.has_options) {
      const variationResponse = await fetch(
        `${storeUrl}/wp-json/wc/store/v1/products?type=variation&parent=${product.id}&per_page=100`,
        { headers: { Accept: 'application/json' } },
      );

      if (variationResponse.ok) {
        const variations = (await variationResponse.json()) as RawRecord[];
        product.variations = variations.map(normalizeVariation);
      }
    }

    return product;
  } catch (error) {
    console.warn(`Could not load product "${slug}"; using demo data.`, error);
    return demoProducts.find((product) => product.slug === slug);
  }
}

export async function getCategories(): Promise<Category[]> {
  const products = await getProducts();
  const counts = new Map<string, number>();
  const categories = new Map<string, Category>();

  for (const product of products) {
    for (const category of product.categories) {
      if (!category.slug) continue;
      categories.set(category.slug, category);
      counts.set(category.slug, (counts.get(category.slug) ?? 0) + 1);
    }
  }

  if (categories.size === 0) {
    return demoCategories;
  }

  return [...categories.values()]
    .map((category) => ({
      ...category,
      count: counts.get(category.slug) ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  if (!hasStore) {
    return demoProducts
      .filter(
        (item) =>
          item.id !== product.id &&
          item.categories.some((category) =>
            product.categories.some(
              (productCategory) => productCategory.slug === category.slug,
            ),
          ),
      )
      .slice(0, limit);
  }

  try {
    const response = await fetch(
      `${storeUrl}/wp-json/wc/store/v1/products?related=${product.id}&per_page=${limit}`,
      { headers: { Accept: 'application/json' } },
    );
    if (response.ok) {
      const raw = (await response.json()) as RawRecord[];
      if (raw.length > 0) return raw.map(normalizeProduct);
    }
  } catch (error) {
    console.warn('Could not load related products; falling back.', error);
  }

  const category = product.categories[0]?.slug;
  const products = await getProducts({ category });
  return products.filter((item) => item.id !== product.id).slice(0, limit);
}
