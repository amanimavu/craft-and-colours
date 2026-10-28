import { Heart } from 'lucide-react';
import { toggleWishlist, useWishlist, type WishlistItem } from '../../lib/wishlist-store';

interface Props {
  product: WishlistItem;
}

export default function WishlistToggle({ product }: Props) {
  const { isSaved } = useWishlist();
  const saved = isSaved(product.id);

  return (
    <button
      type="button"
      onClick={() => toggleWishlist(product)}
      aria-pressed={saved}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${
        saved
          ? 'border-clay-500 bg-clay-100 text-clay-600'
          : 'border-ink-900/20 text-ink-700 hover:border-ink-900 hover:text-ink-900'
      }`}
    >
      <Heart
        size={15}
        strokeWidth={2}
        aria-hidden="true"
        fill={saved ? 'currentColor' : 'none'}
      />
      {saved ? 'Saved' : 'Save for later'}
    </button>
  );
}
