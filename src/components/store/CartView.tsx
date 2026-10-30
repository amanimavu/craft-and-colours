import { useState, type SyntheticEvent } from 'react';
import { Gift, ShoppingBag, Trash2 } from 'lucide-react';
import { hasWooCommerce } from '../../lib/cart-api';
import {
  applyCoupon,
  removeCoupon,
  removeItem,
  updateItem,
  useCart,
} from '../../lib/cart-store';
import { formatMoney } from '../../lib/format';

export default function CartView() {
  const { cart, status, error, busy } = useCart();
  const [coupon, setCoupon] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  const currency = cart?.totals.currencyCode ?? 'KES';
  const minorUnit = cart?.totals.currencyMinorUnit ?? 2;
  const money = (value: string) => formatMoney(value, currency, minorUnit);

  async function handleCoupon(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!coupon.trim()) return;
    setCouponError(null);
    try {
      await applyCoupon(coupon.trim());
      setCoupon('');
    } catch (applyError) {
      setCouponError(
        applyError instanceof Error ? applyError.message : 'Invalid coupon.',
      );
    }
  }

  if (status === 'loading' && !cart) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="h-72 animate-pulse rounded-3xl bg-cream-200/70" />
        <div className="h-72 animate-pulse rounded-3xl bg-cream-200/70" />
      </div>
    );
  }

  if (status === 'error' && !cart) {
    return (
      <div className="rounded-3xl border border-clay-300/60 bg-clay-100 p-8">
        <h2 className="font-display text-2xl text-ink-900">
          We could not load your cart
        </h2>
        <p className="mt-2 text-sm leading-7 text-ink-700">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-primary mt-5"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-3xl border border-ink-900/10 bg-white/55 px-6 py-16 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-cream-200 text-ink-700">
          <ShoppingBag size={26} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <h2 className="mt-6 font-display text-3xl text-ink-900">
          Your cart is empty
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-ink-500">
          Start with something small and useful. The good stuff tends to find
          its way home.
        </p>
        <a href="/shop/" className="btn-primary mt-7">
          Shop the collection
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
      <div>
        <div className="divide-y divide-ink-900/10 rounded-3xl border border-ink-900/10 bg-white/55">
          {cart.items.map((item) => {
            const image = item.images[0];
            const variation = item.variation
              .map((attribute) => `${attribute.name}: ${attribute.value}`)
              .join(' · ');

            return (
              <div key={item.key} className="flex gap-4 p-4 sm:p-5">
                <a
                  href={`/shop/`}
                  className="block h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-200"
                  aria-label={`View ${item.name}`}
                >
                  {image ? (
                    <img
                      src={image.thumbnail || image.src}
                      alt={image.alt}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-cream-200" />
                  )}
                </a>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-lg text-ink-900">
                        {item.name}
                      </h3>
                      {item.freeGift && (
                        <p className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-full bg-olive-100 px-2.5 py-1 text-xs font-bold text-olive-700">
                          <Gift size={13} strokeWidth={2.4} aria-hidden="true" className="shrink-0" />
                          <span className="truncate">
                            Free gift{item.giftFor ? ` · with ${item.giftFor}` : ''}
                          </span>
                        </p>
                      )}
                      {variation && (
                        <p className="mt-1 text-xs font-semibold text-ink-500">
                          {variation}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-sm font-bold text-ink-900">
                      {item.freeGift ? 'Free' : money(item.totals.price)}
                    </p>
                  </div>

                  {!item.freeGift && (
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-full border border-ink-900/15 bg-cream-50 px-1">
                        <button
                          type="button"
                          onClick={() =>
                            void updateItem(item.key, item.quantity - 1)
                          }
                          disabled={
                            busy || item.quantity <= item.quantityLimits.minimum
                          }
                          className="grid h-8 w-8 place-items-center rounded-full text-ink-700 transition hover:bg-cream-200 disabled:opacity-40"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            void updateItem(item.key, item.quantity + 1)
                          }
                          disabled={
                            busy || item.quantity >= item.quantityLimits.maximum
                          }
                          className="grid h-8 w-8 place-items-center rounded-full text-ink-700 transition hover:bg-cream-200 disabled:opacity-40"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => void removeItem(item.key)}
                        disabled={busy}
                        className="btn-remove px-3.5 py-2 text-xs"
                      >
                        <Trash2 size={13} strokeWidth={2.4} aria-hidden="true" className="btn-remove-icon" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-ink-900/10 bg-white/40 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-500">
            Have a coupon?
          </p>
          {cart.coupons.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {cart.coupons.map((item) => (
                <span
                  key={item.code}
                  className="inline-flex items-center gap-2 rounded-full bg-olive-100 px-3 py-1.5 text-xs font-bold text-olive-700"
                >
                  {item.code}
                  <button
                    type="button"
                    onClick={() => void removeCoupon(item.code)}
                    className="text-olive-700/70 hover:text-olive-700"
                    aria-label={`Remove coupon ${item.code}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <form onSubmit={handleCoupon} className="mt-3 flex gap-2">
              <input
                value={coupon}
                onChange={(event) => setCoupon(event.target.value)}
                placeholder="Enter code"
                className="field max-w-xs"
                aria-label="Coupon code"
              />
              <button
                type="submit"
                disabled={busy || !coupon.trim()}
                className="btn-secondary shrink-0"
              >
                Apply
              </button>
            </form>
          )}
          {couponError && (
            <p className="mt-2 text-xs font-semibold text-clay-600">
              {couponError}
            </p>
          )}
        </div>

        {!hasWooCommerce && (
          <p className="mt-6 rounded-xl bg-olive-100 px-4 py-3 text-xs font-semibold leading-6 text-olive-700">
            Demo mode: cart actions are stored in this browser and checkout is
            simulated. Try coupon <code className="font-mono">CRAFT10</code>.
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-clay-100 px-4 py-3 text-sm font-semibold text-clay-600">
            {error}
          </p>
        )}
      </div>

      <aside className="rounded-3xl border border-ink-900/10 bg-cream-100/80 p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-2xl text-ink-900">Order summary</h2>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-ink-500">Subtotal</dt>
            <dd className="font-semibold text-ink-900">
              {money(cart.totals.totalItems)}
            </dd>
          </div>

          {Number(cart.totals.totalDiscount) > 0 && (
            <div className="flex items-center justify-between gap-4 text-olive-700">
              <dt>Discount</dt>
              <dd className="font-semibold">−{money(cart.totals.totalDiscount)}</dd>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <dt className="text-ink-500">Shipping</dt>
            <dd className="font-semibold text-ink-900">
              {Number(cart.totals.totalShipping) === 0
                ? 'Free'
                : money(cart.totals.totalShipping)}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-ink-900/10 pt-4">
            <dt className="font-display text-xl text-ink-900">Total</dt>
            <dd className="font-display text-xl text-ink-900">
              {money(cart.totals.totalPrice)}
            </dd>
          </div>
        </dl>

        <a href="/checkout/" className="btn-primary mt-6 w-full">
          Continue to checkout
        </a>
        <a
          href="/shop/"
          className="mt-4 block text-center text-xs font-bold uppercase tracking-[0.14em] text-ink-500 hover:text-ink-900"
        >
          Continue shopping
        </a>

        <p className="mt-6 text-center text-[0.68rem] leading-5 text-ink-500">
          Taxes included. Shipping and payment options are confirmed at
          checkout.
        </p>
      </aside>
    </div>
  );
}
