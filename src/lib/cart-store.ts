import { useSyncExternalStore } from 'react';
import { createBackend } from './cart-api';
import type {
  AddItemInput,
  Cart,
  CheckoutPayload,
  CheckoutResult,
} from './cart-types';

type Status = 'idle' | 'loading' | 'ready' | 'error';

export interface CartState {
  cart: Cart | null;
  status: Status;
  error: string | null;
  busy: boolean;
}

const backend = createBackend();
const listeners = new Set<() => void>();
let state: CartState = {
  cart: null,
  status: 'idle',
  error: null,
  busy: false,
};
let initPromise: Promise<void> | null = null;

function emit() {
  for (const listener of listeners) listener();
}

function setState(patch: Partial<CartState>) {
  state = { ...state, ...patch };
  emit();
}

function getSnapshot(): CartState {
  return state;
}

function getServerSnapshot(): CartState {
  return state;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Please try again.';
}

function ensureInit(): Promise<void> {
  if (initPromise) return initPromise;

  setState({ status: 'loading' });
  initPromise = backend
    .getCart()
    .then((cart) => {
      setState({ cart, status: 'ready', error: null });
    })
    .catch((error: unknown) => {
      setState({ status: 'error', error: errorMessage(error) });
    });

  return initPromise;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  void ensureInit();
  return () => {
    listeners.delete(listener);
  };
}

async function mutate(action: () => Promise<Cart>): Promise<Cart> {
  setState({ busy: true, error: null });
  try {
    const cart = await action();
    setState({ cart, status: 'ready', busy: false });
    return cart;
  } catch (error) {
    setState({ busy: false, error: errorMessage(error) });
    throw error;
  }
}

export async function addItem(input: AddItemInput): Promise<Cart> {
  return mutate(() => backend.addItem(input));
}

export async function updateItem(
  key: string,
  quantity: number,
): Promise<Cart> {
  return mutate(() => backend.updateItem(key, quantity));
}

export async function removeItem(key: string): Promise<Cart> {
  return mutate(() => backend.removeItem(key));
}

export async function applyCoupon(code: string): Promise<Cart> {
  return mutate(() => backend.applyCoupon(code));
}

export async function removeCoupon(code: string): Promise<Cart> {
  return mutate(() => backend.removeCoupon(code));
}

export async function updateCustomer(addresses: {
  billing_address: CheckoutPayload['billing_address'];
  shipping_address: CheckoutPayload['shipping_address'];
}): Promise<Cart> {
  return mutate(() => backend.updateCustomer(addresses));
}

export async function selectShippingRate(
  packageId: number,
  rateId: string,
): Promise<Cart> {
  return mutate(() => backend.selectShippingRate(packageId, rateId));
}

export async function checkout(
  payload: CheckoutPayload,
): Promise<CheckoutResult> {
  setState({ busy: true, error: null });
  try {
    const result = await backend.checkout(payload);
    const cart = await backend.getCart();
    setState({ cart, status: 'ready', busy: false });
    return result;
  } catch (error) {
    setState({ busy: false, error: errorMessage(error) });
    throw error;
  }
}

export async function refreshCart(): Promise<void> {
  initPromise = null;
  await ensureInit();
}

export function useCart() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return {
    ...snapshot,
    addItem,
    updateItem,
    removeItem,
    applyCoupon,
    removeCoupon,
    updateCustomer,
    selectShippingRate,
    checkout,
    refreshCart,
  };
}
