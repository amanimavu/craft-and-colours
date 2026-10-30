import { useEffect, useState } from "react";
import { ArrowUpRight, Check, ShoppingBag } from "lucide-react";
import type { Product } from "../../lib/types";
import { CATEGORY_DYNAMIC_FILTERS } from "../../lib/filters";
import { formatCardPrice, formatMoney } from "../../lib/format";
import { addItem } from "../../lib/cart-store";

interface ShopFiltersProps {
    products: Product[];
    categories: { name: string; slug: string; count: number }[];
}

const DEFAULT_MAX_PRICE = 15000;
const RESERVED_PARAMS = new Set(["category", "fresh", "sale", "max"]);

// Client-only. Must only ever be called after mount (inside useEffect),
// never during render — otherwise SSR output and the first client render
// would diverge and React would log a hydration mismatch.
function readParamsFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const dynamicFilters: Record<string, string[]> = {};
    params.forEach((value, key) => {
        if (RESERVED_PARAMS.has(key)) return;
        const options = value.split(",").filter(Boolean);
        if (options.length > 0) dynamicFilters[key] = options;
    });

    return {
        category: params.get("category") ?? "",
        fresh: params.get("fresh") === "1",
        onSale: params.get("sale") === "1",
        maxPrice: params.has("max")
            ? Number(params.get("max"))
            : DEFAULT_MAX_PRICE,
        dynamicFilters,
    };
}

export default function ShopFilters({
    products,
    categories,
}: ShopFiltersProps) {
    // SSR-safe neutral defaults. These must be identical on the server render
    // and the first client render — the real values are only known on the
    // client, so they're applied in an effect after mount (see below).
    const [mounted, setMounted] = useState(false);
    const [category, setCategory] = useState("");
    const [fresh, setFresh] = useState(false);
    const [onSale, setOnSale] = useState(false);
    const [maxPrice, setMaxPrice] = useState(DEFAULT_MAX_PRICE);
    const [dynamicFilters, setDynamicFilters] = useState<
        Record<string, string[]>
    >({});

    const dynamicFilterConfigs = category
        ? CATEGORY_DYNAMIC_FILTERS[category] || []
        : [];

    // Hydrate the real filter values from the URL once, right after mount.
    // This runs strictly after hydration, so it's an ordinary state update
    // (not part of hydration) and never triggers a mismatch warning.
    useEffect(() => {
        const parsed = readParamsFromUrl();
        setCategory(parsed.category);
        setFresh(parsed.fresh);
        setOnSale(parsed.onSale);
        setMaxPrice(parsed.maxPrice);
        setDynamicFilters(parsed.dynamicFilters);
        setMounted(true);
    }, []);

    // /shop/ hides the results while a filtered URL loads (see the inline
    // script in pages/shop/index.astro). This runs after the commit that
    // applied the URL filters, so the first thing shown is the right result.
    useEffect(() => {
        if (mounted)
            document.documentElement.removeAttribute("data-shop-filtering");
    }, [mounted]);

    // Keep the URL in sync so filters + category are shareable/bookmarkable.
    // Skip until mounted, otherwise this fires on the very first commit while
    // state is still the neutral defaults, clobbering the real query string
    // before the hydration effect above gets to read it.
    useEffect(() => {
        if (!mounted) return;

        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (fresh) params.set("fresh", "1");
        if (onSale) params.set("sale", "1");
        if (maxPrice < DEFAULT_MAX_PRICE) params.set("max", String(maxPrice));
        for (const [key, options] of Object.entries(dynamicFilters)) {
            if (options.length > 0) params.set(key, options.join(","));
        }

        const query = params.toString();
        const url = `${window.location.pathname}${query ? `?${query}` : ""}`;
        window.history.replaceState(null, "", url);
    }, [mounted, category, fresh, onSale, maxPrice, dynamicFilters]);

    const handleCategoryChange = (slug: string) => {
        setCategory(slug);
        setDynamicFilters({});
    };

    const handleDynamicChange = (key: string, option: string) => {
        setDynamicFilters((prev) => {
            const current = prev[key] || [];
            if (current.includes(option)) {
                const next = current.filter((item) => item !== option);
                if (next.length === 0) {
                    const copy = { ...prev };
                    delete copy[key];
                    return copy;
                }
                return { ...prev, [key]: next };
            } else {
                return { ...prev, [key]: [...current, option] };
            }
        });
    };

    const resetFilters = () => {
        setFresh(false);
        setOnSale(false);
        setMaxPrice(DEFAULT_MAX_PRICE);
        setDynamicFilters({});
    };

    const [cartStatus, setCartStatus] = useState<
        Record<number, "busy" | "added">
    >({});

    const handleQuickAdd = async (productId: number) => {
        setCartStatus((prev) => ({ ...prev, [productId]: "busy" }));
        try {
            await addItem({ id: productId, quantity: 1 });
            setCartStatus((prev) => ({ ...prev, [productId]: "added" }));
            window.dispatchEvent(new CustomEvent("cart:open"));
            window.setTimeout(() => {
                setCartStatus((prev) => {
                    const next = { ...prev };
                    delete next[productId];
                    return next;
                });
            }, 2000);
        } catch {
            setCartStatus((prev) => {
                const next = { ...prev };
                delete next[productId];
                return next;
            });
        }
    };

    const filteredProducts = products.filter((product) => {
        if (category && !product.categories.some((c) => c.slug === category))
            return false;

        const priceNum = Number(product.prices.price) / 100;
        if (priceNum > maxPrice) return false;

        if (onSale) {
            const reg = Number(product.prices.regular_price) / 100;
            const cur = priceNum;
            if (reg <= cur) return false;
        }

        if (fresh && !product.isNew) return false;

        for (const [key, selectedOptions] of Object.entries(dynamicFilters)) {
            if (selectedOptions.length === 0) continue;
            const value = product.attributes?.[key];
            if (!value || !selectedOptions.includes(value)) return false;
        }

        return true;
    });

    const pillClass = (active: boolean) =>
        `rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${
            active
                ? "bg-ink-900 text-cream-50"
                : "border border-ink-900/15 text-ink-700 hover:border-ink-900 hover:text-ink-900"
        }`;

    return (
        <div>
            {/* Category pills */}
            <div className="sticky top-18 z-40 flex flex-wrap items-center gap-2 border-b border-ink-900/10 bg-cream-50/95 py-4 backdrop-blur-md">
                <a
                    href="/shop/"
                    onClick={(e) => {
                        e.preventDefault();
                        handleCategoryChange("");
                    }}
                    className={pillClass(mounted && category === "")}
                    aria-current={
                        mounted && category === "" ? "page" : undefined
                    }
                >
                    All pieces
                </a>
                {categories.map((cat) => (
                    <a
                        key={cat.slug}
                        href={`/shop/?category=${cat.slug}`}
                        onClick={(e) => {
                            e.preventDefault();
                            handleCategoryChange(cat.slug);
                        }}
                        className={pillClass(mounted && category === cat.slug)}
                        aria-current={
                            mounted && category === cat.slug
                                ? "page"
                                : undefined
                        }
                    >
                        {cat.name}
                    </a>
                ))}
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[280px_1fr]">
                {/* Sidebar Filters */}
                <aside className="space-y-8 rounded-3xl border border-ink-900/10 bg-white/60 p-6 shadow-sm h-fit lg:sticky lg:top-38">
                    <div>
                        <h3 className="font-display text-lg text-ink-900">
                            Filters
                        </h3>
                        <p className="text-xs text-ink-500 mt-1">
                            Refine your selection
                        </p>
                    </div>

                    {/* Shared Filter 1: Fresh Arrivals */}
                    <div className="space-y-3 pt-4 border-t border-ink-900/10">
                        <label className="flex items-center gap-3 text-sm font-semibold text-ink-800 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={fresh}
                                onChange={(e) => setFresh(e.target.checked)}
                                className="h-4 w-4 rounded border-ink-900/20 text-poppy-500 focus:ring-poppy-500"
                            />
                            Fresh arrivals (New)
                        </label>
                    </div>

                    {/* Shared Filter 2: Items on Sale */}
                    <div className="space-y-3 pt-4 border-t border-ink-900/10">
                        <label className="flex items-center gap-3 text-sm font-semibold text-ink-800 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={onSale}
                                onChange={(e) => setOnSale(e.target.checked)}
                                className="h-4 w-4 rounded border-ink-900/20 text-poppy-500 focus:ring-poppy-500"
                            />
                            Items on sale
                        </label>
                    </div>

                    {/* Shared Filter 3: Price Slider */}
                    <div className="space-y-3 pt-4 border-t border-ink-900/10">
                        <div className="flex items-center justify-between text-sm font-semibold text-ink-800">
                            <span>Max Price</span>
                            <span className="text-poppy-600 font-bold">
                                KES {maxPrice.toLocaleString()}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="500"
                            max="15000"
                            step="500"
                            value={maxPrice}
                            onChange={(e) =>
                                setMaxPrice(Number(e.target.value))
                            }
                            className="w-full accent-poppy-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[0.68rem] text-ink-400 font-semibold">
                            <span>KES 500</span>
                            <span>KES 15,000</span>
                        </div>
                    </div>

                    {/* Dynamic Category Filters */}
                    {dynamicFilterConfigs.length > 0 && (
                        <div className="space-y-6 pt-4 border-t border-ink-900/10">
                            <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-ink-400">
                                Category Filters
                            </h4>
                            {dynamicFilterConfigs.map((group) => (
                                <div key={group.key} className="space-y-3">
                                    <p className="text-xs font-bold text-ink-700">
                                        {group.name}
                                    </p>
                                    <div className="space-y-2">
                                        {group.options.map((opt) => {
                                            const isChecked =
                                                dynamicFilters[
                                                    group.key
                                                ]?.includes(opt) || false;
                                            return (
                                                <label
                                                    key={opt}
                                                    className="flex items-center gap-2.5 text-xs text-ink-600 cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() =>
                                                            handleDynamicChange(
                                                                group.key,
                                                                opt,
                                                            )
                                                        }
                                                        className="h-3.5 w-3.5 rounded border-ink-900/25 text-poppy-500 focus:ring-poppy-500"
                                                    />
                                                    {opt}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Reset */}
                    {(fresh ||
                        onSale ||
                        maxPrice < 15000 ||
                        Object.keys(dynamicFilters).length > 0) && (
                        <button
                            onClick={resetFilters}
                            className="w-full rounded-full border border-ink-900/15 py-2 text-xs font-bold uppercase tracking-[0.12em] text-ink-700 transition hover:bg-ink-900 hover:text-cream-50"
                        >
                            Reset Filters
                        </button>
                    )}
                </aside>

                {/* Product Grid */}
                <main data-shop-results>
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-xs font-semibold text-ink-500">
                            Showing {filteredProducts.length}{" "}
                            {filteredProducts.length === 1 ? "piece" : "pieces"}
                        </p>
                    </div>

                    {filteredProducts.length > 0 ? (
                        <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                            {filteredProducts.map((product) => {
                                const image = product.images[0];
                                const productCategory = product.categories[0];
                                const onSaleItem =
                                    Number(product.prices.sale_price) > 0 &&
                                    Number(product.prices.sale_price) <
                                        Number(product.prices.regular_price);
                                const soldOut =
                                    !product.isInStock ||
                                    !product.isPurchasable;
                                return (
                                    <article
                                        key={product.id}
                                        className="group rounded-3xl border border-ink-900/10 bg-white/70 p-4 shadow-sm transition hover:shadow-md"
                                    >
                                        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream-200/60">
                                            <a
                                                href={`/shop/${product.slug}/`}
                                                className="block h-full w-full"
                                            >
                                                {image ? (
                                                    <img
                                                        src={image.src}
                                                        alt={image.alt}
                                                        loading="lazy"
                                                        decoding="async"
                                                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                                                    />
                                                ) : (
                                                    <div className="grid h-full place-items-center bg-cream-200 text-sm text-ink-500">
                                                        Image coming soon
                                                    </div>
                                                )}
                                            </a>

                                            <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
                                                {onSaleItem && !soldOut && (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-clay-500 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-cream-50">
                                                        Sale
                                                    </span>
                                                )}
                                                {soldOut && (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-cream-50">
                                                        Sold out
                                                    </span>
                                                )}
                                            </div>

                                            <span
                                                className="pointer-events-none absolute bottom-3 right-3 grid h-10 w-10 translate-y-2 place-items-center rounded-full bg-cream-50 text-ink-900 opacity-0 shadow-sm transition duration-300 ease-bounce group-hover:translate-y-0 group-hover:opacity-100"
                                                aria-hidden="true"
                                            >
                                                <ArrowUpRight className="h-4 w-4" />
                                            </span>

                                            {!soldOut &&
                                                !product.hasOptions && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void handleQuickAdd(
                                                                product.id,
                                                            )
                                                        }
                                                        disabled={
                                                            cartStatus[
                                                                product.id
                                                            ] === "busy"
                                                        }
                                                        aria-label={`Quick add ${product.name} to cart`}
                                                        className="absolute bottom-3 left-3 grid h-10 w-10 place-items-center rounded-full bg-poppy-500 text-cream-50 shadow-sm transition duration-300 ease-bounce hover:bg-poppy-600 hover:scale-105 disabled:cursor-wait"
                                                    >
                                                        {cartStatus[
                                                            product.id
                                                        ] === "added" ? (
                                                            <Check className="h-4 w-4" />
                                                        ) : (
                                                            <ShoppingBag className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                )}
                                        </div>

                                        <div className="mt-4 flex items-start justify-between gap-4">
                                            <div>
                                                {productCategory && (
                                                    <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-300">
                                                        {productCategory.name}
                                                    </p>
                                                )}
                                                <h3 className="mt-1 font-display text-base leading-snug text-ink-900">
                                                    <a
                                                        href={`/shop/${product.slug}/`}
                                                        className="hover:text-clay-600"
                                                    >
                                                        {product.name}
                                                    </a>
                                                </h3>
                                            </div>

                                            <div className="shrink-0 text-right">
                                                {onSaleItem ? (
                                                    <>
                                                        <p className="text-xs font-bold text-clay-600">
                                                            {formatMoney(
                                                                product.prices
                                                                    .sale_price,
                                                                product.prices
                                                                    .currency_code,
                                                                product.prices
                                                                    .currency_minor_unit,
                                                            )}
                                                        </p>
                                                        <p className="text-[0.68rem] text-ink-300 line-through">
                                                            {formatMoney(
                                                                product.prices
                                                                    .regular_price,
                                                                product.prices
                                                                    .currency_code,
                                                                product.prices
                                                                    .currency_minor_unit,
                                                            )}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <p className="text-xs font-bold text-ink-900">
                                                        {formatCardPrice(
                                                            product,
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-ink-900/10 bg-white/55 px-6 py-16 text-center">
                            <h2 className="font-display text-3xl text-ink-900">
                                No pieces match your filters
                            </h2>
                            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-ink-500">
                                Try adjusting your price range or clearing some
                                filters to see more supplies.
                            </p>
                            <button
                                onClick={() => {
                                    handleCategoryChange("");
                                    resetFilters();
                                }}
                                className="btn-secondary mt-6"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
