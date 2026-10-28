import { useEffect, useRef, useState } from 'react';
import { Gift, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { DEMO_FREE_GIFT_THRESHOLD } from '../../lib/cart-api';
import { useCart } from '../../lib/cart-store';
import { formatMoney } from '../../lib/format';

export default function CartDrawer() {
  const { cart, busy, updateItem, removeItem } = useCart();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const trigger = target?.closest('[data-cart-open]');
      if (!trigger) return;
      if (!(trigger instanceof HTMLElement)) return;
      event.preventDefault();
      openerRef.current = trigger;
      setOpen(true);
    };

    const onOpenEvent = () => setOpen(true);

    document.addEventListener('click', onDocumentClick);
    window.addEventListener('cart:open', onOpenEvent);
    return () => {
      document.removeEventListener('click', onDocumentClick);
      window.removeEventListener('cart:open', onOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open && openerRef.current) {
      openerRef.current.focus();
      openerRef.current = null;
    }
  }, [open]);

  if (!open) return null;

  const currency = cart?.totals.currencyCode ?? 'KES';
  const minorUnit = cart?.totals.currencyMinorUnit ?? 2;
  const money = (value: string) => formatMoney(value, currency, minorUnit);

  const subtotal = Number(cart?.totals.totalItems ?? 0);
  const remaining = Math.max(0, DEMO_FREE_GIFT_THRESHOLD - subtotal);
  const giftProgress = Math.min(
    100,
    Math.round((subtotal / DEMO_FREE_GIFT_THRESHOLD) * 100),
  );

  const close = () => setOpen(false);
  const items = cart?.items ?? [];

  return (
    <div
      className="fixed inset-0 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping cart"
    >
      <button
        type="button"
        onClick={close}
        aria-label="Close cart"
        tabIndex={-1}
        className="drawer-backdrop absolute inset-0 cursor-default bg-ink-900/45 backdrop-blur-[2px]"
      />

      <div className="drawer-panel absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream-50 shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-900/10 px-5 py-4">
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-ink-400">
              Your basket
            </p>
            <h2 className="mt-1 font-display text-2xl text-ink-900">
              {cart?.itemsCount
                ? `${cart.itemsCount} ${cart.itemsCount === 1 ? 'piece' : 'pieces'}`
                : 'Nothing in here yet'}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close cart"
            className="grid h-10 w-10 place-items-center rounded-full border border-ink-900/15 text-ink-700 transition hover:bg-ink-900 hover:text-cream-50"
          >
            <X size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="border-b border-ink-900/10 px-5 py-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-ink-600">
            <Gift size={15} strokeWidth={2} aria-hidden="true" className="text-clay-600" />
            {remaining === 0 ? 'Free craft gift unlocked' : 'Free craft gift'}
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-900/10"
            role="progressbar"
            aria-label="Progress towards a free craft gift"
            aria-valuemin={0}
            aria-valuemax={DEMO_FREE_GIFT_THRESHOLD}
            aria-valuenow={Math.min(subtotal, DEMO_FREE_GIFT_THRESHOLD)}
          >
            <div
              className="h-full rounded-full bg-clay-500 transition-all duration-500"
              style={{ width: `${giftProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs leading-5 text-ink-500" aria-live="polite">
            {remaining === 0
              ? 'A little extra something is going in your parcel.'
              : `${money(String(remaining))} away from a free craft gift.`}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-cream-200 text-ink-700">
              <ShoppingBag size={26} strokeWidth={1.5} aria-hidden="true" />
            </div>
            <h3 className="mt-5 font-display text-2xl text-ink-900">
              Your basket is waiting
            </h3>
            <p className="mt-2 max-w-xs text-sm leading-7 text-ink-500">
              Start with something small. The good stuff tends to find its way
              home.
            </p>
            <a href="/shop/" onClick={close} className="btn-primary mt-6">
              Shop the collection
            </a>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <ul className="space-y-4">
              {items.map((item) => {
                const image = item.images[0];
                const variation = item.variation
                  .map((entry) => entry.value)
                  .filter(Boolean)
                  .join(' · ');

                return (
                  <li key={item.key} className="flex gap-3">
                    <a
                      href="/shop/"
                      onClick={close}
                      className="block h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-200"
                      aria-label={`View ${item.name}`}
                    >
                      {image ? (
                        <img
                          src={image.thumbnail || image.src}
                          alt={image.alt}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </a>

                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink-900">
                            {item.name}
                          </p>
                          {variation && (
                            <p className="mt-0.5 text-[0.68rem] font-semibold text-ink-500">
                              {variation}
                            </p>
                          )}
                        </div>
                        <p className="shrink-0 text-sm font-bold text-ink-900">
                          {money(item.totals.price)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-full border border-ink-900/15 bg-cream-50 px-1">
                          <button
                            type="button"
                            onClick={() =>
                              void updateItem(item.key, item.quantity - 1)
                            }
                            disabled={
                              busy ||
                              item.quantity <= item.quantityLimits.minimum
                            }
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="grid h-7 w-7 place-items-center rounded-full text-ink-700 transition hover:bg-cream-200 disabled:opacity-40"
                          >
                            <Minus size={13} strokeWidth={2.4} aria-hidden="true" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              void updateItem(item.key, item.quantity + 1)
                            }
                            disabled={
                              busy ||
                              item.quantity >= item.quantityLimits.maximum
                            }
                            aria-label={`Increase quantity of ${item.name}`}
                            className="grid h-7 w-7 place-items-center rounded-full text-ink-700 transition hover:bg-cream-200 disabled:opacity-40"
                          >
                            <Plus size={13} strokeWidth={2.4} aria-hidden="true" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => void removeItem(item.key)}
                          disabled={busy}
                          className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink-500 underline underline-offset-4 transition hover:text-clay-600 disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="border-t border-ink-900/10 bg-cream-100/60 px-5 py-5">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-semibold text-ink-500">Subtotal</span>
            <span className="font-display text-2xl text-ink-900">
              {money(cart?.totals.totalItems ?? '0')}
            </span>
          </div>
          <a
            href="/checkout/"
            onClick={close}
            className={`btn-primary mt-4 w-full ${items.length === 0 ? 'pointer-events-none opacity-50' : ''}`}
            aria-disabled={items.length === 0}
          >
            Checkout
          </a>
          <div className="mt-3 flex items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-ink-500">
            <a href="/cart/" onClick={close} className="hover:text-ink-900">
              View basket
            </a>
            <button type="button" onClick={close} className="hover:text-ink-900">
              Keep shopping
            </button>
          </div>
          <p className="mt-3 text-center text-[0.62rem] leading-5 text-ink-500">
            Shipping and payment options are confirmed at checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
