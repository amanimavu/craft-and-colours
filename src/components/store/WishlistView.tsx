import { Heart, X } from 'lucide-react';
import { formatMoney } from '../../lib/format';
import { useWishlist } from '../../lib/wishlist-store';

export default function WishlistView() {
  const { items, remove } = useWishlist();

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-ink-900/10 bg-white/55 px-6 py-16 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-cream-200 text-clay-600">
          <Heart size={26} strokeWidth={1.6} aria-hidden="true" />
        </div>
        <h2 className="mt-6 font-display text-3xl text-ink-900">
          Nothing saved yet
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-ink-500">
          Tap the heart on something you love and it will wait for you here.
          No account needed.
        </p>
        <a href="/shop/" className="btn-primary mt-7">
          Browse the collection
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article key={item.id} className="group">
          <div className="relative overflow-hidden rounded-2xl bg-cream-200">
            <a href={`/shop/${item.slug}/`} className="block aspect-[4/5]">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.imageAlt || item.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="grid h-full place-items-center text-sm text-ink-500">
                  Image coming soon
                </div>
              )}
            </a>
            <button
              type="button"
              onClick={() => remove(item.id)}
              aria-label={`Remove ${item.name} from wishlist`}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-cream-50/95 text-ink-700 shadow-sm transition hover:bg-ink-900 hover:text-cream-50"
            >
              <X size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              {item.category && (
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-ink-300">
                  {item.category}
                </p>
              )}
              <h3 className="mt-1 font-display text-xl leading-tight text-ink-900">
                <a href={`/shop/${item.slug}/`} className="hover:text-clay-600">
                  {item.name}
                </a>
              </h3>
            </div>
            <p className="shrink-0 text-sm font-bold text-ink-900">
              {formatMoney(item.price, item.currencyCode, item.minorUnit)}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
