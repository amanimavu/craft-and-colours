import { useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { addItem } from '../../lib/cart-store';
import { formatMoney } from '../../lib/format';
import type { Product, ProductVariation, VariationAttribute } from '../../lib/types';

interface Props {
  product: Product;
}

interface OptionGroup {
  name: string;
  values: VariationAttribute[];
}

const SWATCH_COLORS: Record<string, string> = {
  terracotta: '#d99a7b',
  sage: '#9caf88',
  butter: '#f2d388',
  cobalt: '#2354e6',
};

function buildOptionGroups(product: Product): OptionGroup[] {
  const groups = new Map<string, Map<string, VariationAttribute>>();

  for (const variation of product.variations ?? []) {
    for (const attribute of variation.attributes) {
      if (!groups.has(attribute.name)) groups.set(attribute.name, new Map());
      const valueKey = attribute.slug || attribute.value;
      groups.get(attribute.name)?.set(valueKey, attribute);
    }
  }

  return [...groups.entries()].map(([name, values]) => ({
    name,
    values: [...values.values()],
  }));
}

function findVariation(
  product: Product,
  selected: Record<string, string>,
): ProductVariation | undefined {
  return product.variations?.find((variation) =>
    variation.attributes.every(
      (attribute) =>
        selected[attribute.name] === (attribute.slug || attribute.value),
    ),
  );
}

export default function AddToCart({ product }: Props) {
  const optionGroups = useMemo(() => buildOptionGroups(product), [product]);
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const group of optionGroups) {
      const first = group.values[0];
      if (first) initial[group.name] = first.slug || first.value;
    }
    return initial;
  });
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const variation = findVariation(product, selected);
  const prices = variation?.prices ?? product.prices;
  const inStock = variation?.isInStock ?? product.isInStock;
  const purchasable = product.isPurchasable && inStock;
  const onSale =
    Number(prices.sale_price) > 0 &&
    Number(prices.sale_price) < Number(prices.regular_price);

  const optionUnavailable =
    optionGroups.length > 0 && product.variations && product.variations.length > 0
      ? !variation
      : false;

  async function handleAdd() {
    if (!purchasable || optionUnavailable) return;

    setBusy(true);
    setError(null);
    setAdded(false);

    try {
      await addItem({
        id: variation?.id ?? product.id,
        quantity,
        variation: variation?.attributes,
      });
      setAdded(true);
      setQuantity(1);
      window.setTimeout(() => setAdded(false), 3000);
    } catch (addError) {
      setError(
        addError instanceof Error
          ? addError.message
          : 'Could not add this item to your cart.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        {onSale ? (
          <>
            <p className="font-display text-3xl text-clay-600">
              {formatMoney(
                prices.sale_price,
                prices.currency_code,
                prices.currency_minor_unit,
              )}
            </p>
            <p className="pb-1 text-sm text-ink-300 line-through">
              {formatMoney(
                prices.regular_price,
                prices.currency_code,
                prices.currency_minor_unit,
              )}
            </p>
          </>
        ) : (
          <p className="font-display text-3xl text-ink-900">
            {formatMoney(
              prices.price,
              prices.currency_code,
              prices.currency_minor_unit,
            )}
          </p>
        )}
        <p className="pb-1 text-xs font-semibold text-ink-500">
          Tax included
        </p>
      </div>

      <p className="mt-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]">
        <span
          className={
            purchasable
              ? 'inline-block h-2 w-2 rounded-full bg-olive-500'
              : 'inline-block h-2 w-2 rounded-full bg-clay-500'
          }
          aria-hidden="true"
        />
        <span className={purchasable ? 'text-olive-700' : 'text-clay-600'}>
          {purchasable
            ? product.stockQuantity !== null &&
              product.stockQuantity !== undefined &&
              product.stockQuantity <= 5
              ? `Only ${product.stockQuantity} left`
              : 'In stock'
            : 'Sold out'}
        </span>
      </p>

      {optionGroups.length > 0 && (
        <div className="mt-6 space-y-5">
          {optionGroups.map((group) => {
            const isColor = /colou?r/i.test(group.name);
            const activeValue = group.values.find(
              (value) => (value.slug || value.value) === selected[group.name],
            );
            return (
              <div key={group.name}>
                <p className="field-label">
                  {group.name}
                  {isColor && activeValue && `: ${activeValue.value}`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.values.map((value) => {
                    const valueKey = value.slug || value.value;
                    const active = selected[group.name] === valueKey;
                    const swatchColor = isColor
                      ? SWATCH_COLORS[valueKey.toLowerCase()]
                      : undefined;

                    if (swatchColor) {
                      return (
                        <button
                          key={valueKey}
                          type="button"
                          onClick={() =>
                            setSelected((current) => ({
                              ...current,
                              [group.name]: valueKey,
                            }))
                          }
                          aria-pressed={active}
                          aria-label={value.value}
                          title={value.value}
                          className={`grid h-10 w-10 place-items-center rounded-full border-2 transition ${
                            active
                              ? 'border-ink-900'
                              : 'border-transparent hover:border-ink-300'
                          }`}
                        >
                          <span
                            className="block h-7 w-7 rounded-full ring-1 ring-inset ring-ink-900/10"
                            style={{ backgroundColor: swatchColor }}
                          />
                        </button>
                      );
                    }

                    return (
                      <button
                        key={valueKey}
                        type="button"
                        onClick={() =>
                          setSelected((current) => ({
                            ...current,
                            [group.name]: valueKey,
                          }))
                        }
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          active
                            ? 'border-ink-900 bg-ink-900 text-cream-50'
                            : 'border-ink-900/15 text-ink-700 hover:border-ink-900'
                        }`}
                        aria-pressed={active}
                      >
                        {value.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {optionUnavailable && (
        <p className="mt-4 rounded-xl bg-clay-100 px-4 py-3 text-sm font-semibold text-clay-600">
          That combination is currently unavailable. Try another option.
        </p>
      )}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <div className="inline-flex items-center justify-between rounded-full border border-ink-900/15 bg-white/60 px-2 py-1">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className="grid h-9 w-9 place-items-center rounded-full text-lg text-ink-700 transition hover:bg-cream-200 disabled:opacity-40"
            disabled={quantity <= 1 || busy}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-bold" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(99, value + 1))}
            className="grid h-9 w-9 place-items-center rounded-full text-lg text-ink-700 transition hover:bg-cream-200 disabled:opacity-40"
            disabled={quantity >= 99 || busy}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={() => void handleAdd()}
          disabled={!purchasable || busy || optionUnavailable}
          className="btn-primary flex-1"
        >
          {busy ? 'Adding…' : added ? 'Added to cart' : 'Add to cart'}
          {!busy && !added && (
            <ShoppingBag size={16} strokeWidth={1.6} aria-hidden="true" />
          )}
        </button>
      </div>

      <div aria-live="polite">
        {added && (
          <p className="mt-3 text-sm font-semibold text-olive-700">
            Added to your cart.{' '}
            <a href="/cart/" className="underline underline-offset-4">
              View cart
            </a>
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-xl bg-clay-100 px-4 py-3 text-sm font-semibold text-clay-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
