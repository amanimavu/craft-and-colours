import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Search, X } from 'lucide-react';
import { formatMoney } from '../../lib/format';

export interface SearchProduct {
  id: number;
  name: string;
  slug: string;
  category?: string;
  price: string;
  currencyCode: string;
  minorUnit: number;
  image?: string;
  imageAlt?: string;
}

interface Props {
  products: SearchProduct[];
  categories: { name: string; slug: string }[];
}

export default function SearchOverlay({ products, categories }: Props) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const trigger = target?.closest('[data-search-open]');
      if (!trigger) return;
      if (!(trigger instanceof HTMLElement)) return;
      event.preventDefault();
      openerRef.current = trigger;
      setOpen(true);
    };

    const onOpenEvent = () => setOpen(true);

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('click', onDocumentClick);
    window.addEventListener('search:open', onOpenEvent);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('click', onDocumentClick);
      window.removeEventListener('search:open', onOpenEvent);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 40);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      openerRef.current?.focus();
      openerRef.current = null;
    }
  }, [open]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products.slice(0, 5);
    return products
      .filter((product) => {
        const haystack = `${product.name} ${product.category ?? ''}`.toLowerCase();
        return term.split(/\s+/).every((part) => haystack.includes(part));
      })
      .slice(0, 8);
  }, [products, query]);

  if (!mounted || !open) return null;

  const close = () => setOpen(false);

  const goToFirst = () => {
    const first = results[0];
    if (first) window.location.href = `/shop/${first.slug}/`;
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search the shop"
    >
      <button
        type="button"
        onClick={close}
        aria-label="Close search"
        tabIndex={-1}
        className="drawer-backdrop absolute inset-0 cursor-default bg-ink-900/50 backdrop-blur-[3px]"
      />

      <div className="modal-pop relative w-full max-w-2xl overflow-hidden rounded-3xl border border-ink-900/10 bg-cream-50 shadow-soft">
        <div className="flex items-center gap-3 border-b border-ink-900/10 px-5 py-4">
          <Search size={19} strokeWidth={2} aria-hidden="true" className="shrink-0 text-ink-500" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                goToFirst();
              }
            }}
            placeholder="Search supplies, kits, yarn…"
            aria-label="Search products"
            autoComplete="off"
            className="w-full bg-transparent text-base text-ink-900 outline-none placeholder:text-ink-300 sm:text-lg"
          />
          <button
            type="button"
            onClick={close}
            aria-label="Close search"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink-900/15 text-ink-700 transition hover:bg-ink-900 hover:text-cream-50"
          >
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-3 py-3">
          {results.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="font-display text-2xl text-ink-900">
                Nothing matched “{query}”.
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-ink-500">
                Try a colour, a material, or browse the whole collection.
              </p>
              <a href="/shop/" onClick={close} className="btn-secondary mt-5">
                Shop all supplies
              </a>
            </div>
          ) : (
            <ul className="space-y-1">
              {results.map((product) => (
                <li key={product.id}>
                  <a
                    href={`/shop/${product.slug}/`}
                    onClick={close}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-cream-100"
                  >
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cream-200">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.imageAlt || product.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-snug text-ink-900">
                        {product.name}
                      </span>
                      {product.category && (
                        <span className="mt-0.5 block text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-300">
                          {product.category}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-sm font-bold text-ink-900">
                      {formatMoney(
                        product.price,
                        product.currencyCode,
                        product.minorUnit,
                      )}
                    </span>
                    <ArrowRight
                      size={15}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="shrink-0 text-ink-300"
                    />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-900/10 bg-cream-100/60 px-5 py-3">
          {query.trim() ? (
            <a
              href="/shop/"
              onClick={close}
              className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-500 transition hover:text-ink-900"
            >
              Browse all supplies
            </a>
          ) : (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {categories.slice(0, 4).map((category) => (
                <a
                  key={category.slug}
                  href={`/shop/?category=${category.slug}`}
                  onClick={close}
                  className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-500 transition hover:text-ink-900"
                >
                  {category.name}
                </a>
              ))}
            </div>
          )}
          <p className="text-[0.62rem] font-semibold text-ink-300">
            <kbd className="rounded border border-ink-900/15 bg-cream-50 px-1.5 py-0.5 font-sans">
              Esc
            </kbd>{' '}
            to close ·{' '}
            <kbd className="rounded border border-ink-900/15 bg-cream-50 px-1.5 py-0.5 font-sans">
              Enter
            </kbd>{' '}
            to open
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
