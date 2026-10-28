import { useWishlist } from "../../lib/wishlist-store";

export default function WishlistCount() {
    const { count } = useWishlist();

    if (count === 0) {
        return null;
    }

    return (
        <span
            aria-live="polite"
            className="absolute -right-0.5 -top-0.5 grid min-h-4.5 min-w-4.5 place-items-center rounded-full bg-clay-500 px-1 text-[0.58rem] font-bold leading-none text-cream-50"
        >
            {count > 99 ? "99+" : count}
        </span>
    );
}
