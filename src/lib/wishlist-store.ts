import { useEffect, useState } from 'react';

export interface WishlistItem {
  id: number;
  slug: string;
  name: string;
  price: string;
  currencyCode: string;
  minorUnit: number;
  image?: string;
  imageAlt?: string;
  category?: string;
}

const STORAGE_KEY = 'craft-wishlist-v1';
const CHANGE_EVENT = 'wishlist:change';

function isWishlistItem(value: unknown): value is WishlistItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'number' &&
    typeof item.slug === 'string' &&
    typeof item.name === 'string' &&
    typeof item.price === 'string'
  );
}

export function readWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isWishlistItem) : [];
  } catch {
    return [];
  }
}

function writeWishlist(items: WishlistItem[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage can be unavailable in private mode; keep the in-memory UI usable.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function toggleWishlist(item: WishlistItem): boolean {
  const items = readWishlist();
  const exists = items.some((saved) => saved.id === item.id);
  const next = exists
    ? items.filter((saved) => saved.id !== item.id)
    : [item, ...items];
  writeWishlist(next);
  return !exists;
}

export function removeWishlist(id: number) {
  writeWishlist(readWishlist().filter((saved) => saved.id !== id));
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readWishlist());
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return {
    items,
    count: items.length,
    isSaved: (id: number) => items.some((saved) => saved.id === id),
    toggle: toggleWishlist,
    remove: removeWishlist,
  };
}
