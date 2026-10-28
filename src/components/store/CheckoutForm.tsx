import { useEffect, useState, type SyntheticEvent } from 'react';
import { hasWooCommerce } from '../../lib/cart-api';
import {
  checkout,
  selectShippingRate,
  updateCustomer,
  useCart,
} from '../../lib/cart-store';
import { formatMoney } from '../../lib/format';
import type { BillingAddress, PostalAddress } from '../../lib/types';

const counties = [
  { code: '001', name: 'Mombasa' },
  { code: '002', name: 'Kwale' },
  { code: '003', name: 'Kilifi' },
  { code: '004', name: 'Tana River' },
  { code: '005', name: 'Lamu' },
  { code: '006', name: 'Taita Taveta' },
  { code: '007', name: 'Garissa' },
  { code: '008', name: 'Wajir' },
  { code: '009', name: 'Mandera' },
  { code: '010', name: 'Marsabit' },
  { code: '011', name: 'Isiolo' },
  { code: '012', name: 'Meru' },
  { code: '013', name: 'Tharaka-Nithi' },
  { code: '014', name: 'Embu' },
  { code: '015', name: 'Kitui' },
  { code: '016', name: 'Machakos' },
  { code: '017', name: 'Makueni' },
  { code: '018', name: 'Nyandarua' },
  { code: '019', name: 'Nyeri' },
  { code: '020', name: 'Kirinyaga' },
  { code: '021', name: "Murang'a" },
  { code: '022', name: 'Kiambu' },
  { code: '023', name: 'Turkana' },
  { code: '024', name: 'West Pokot' },
  { code: '025', name: 'Samburu' },
  { code: '026', name: 'Trans Nzoia' },
  { code: '027', name: 'Uasin Gishu' },
  { code: '028', name: 'Elgeyo-Marakwet' },
  { code: '029', name: 'Nandi' },
  { code: '030', name: 'Baringo' },
  { code: '031', name: 'Laikipia' },
  { code: '032', name: 'Nakuru' },
  { code: '033', name: 'Narok' },
  { code: '034', name: 'Kajiado' },
  { code: '035', name: 'Kericho' },
  { code: '036', name: 'Bomet' },
  { code: '037', name: 'Kakamega' },
  { code: '038', name: 'Vihiga' },
  { code: '039', name: 'Bungoma' },
  { code: '040', name: 'Busia' },
  { code: '041', name: 'Siaya' },
  { code: '042', name: 'Kisumu' },
  { code: '043', name: 'Homa Bay' },
  { code: '044', name: 'Migori' },
  { code: '045', name: 'Kisii' },
  { code: '046', name: 'Nyamira' },
  { code: '047', name: 'Nairobi' },
];

const paymentLabels: Record<string, string> = {
  mpesa: 'M-Pesa',
  card: 'Card payment',
  bacs: 'Direct bank transfer',
  cod: 'Cash on delivery',
  paystack: 'Paystack',
  flutterwave: 'Flutterwave',
  stripe: 'Card payment',
};

interface FormFields {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  note: string;
}

const initialFields: FormFields = {
  email: '',
  firstName: '',
  lastName: '',
  company: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  state: '047',
  postcode: '',
  note: '',
};

function toAddresses(fields: FormFields): {
  billing: BillingAddress;
  shipping: PostalAddress;
} {
  const billing: BillingAddress = {
    first_name: fields.firstName.trim(),
    last_name: fields.lastName.trim(),
    company: fields.company.trim(),
    address_1: fields.address1.trim(),
    address_2: fields.address2.trim(),
    city: fields.city.trim(),
    state: fields.state,
    postcode: fields.postcode.trim(),
    country: 'KE',
    phone: fields.phone.trim(),
    email: fields.email.trim(),
  };

  const shipping: PostalAddress = {
    first_name: billing.first_name,
    last_name: billing.last_name,
    company: billing.company,
    address_1: billing.address_1,
    address_2: billing.address_2,
    city: billing.city,
    state: billing.state,
    postcode: billing.postcode,
    country: billing.country,
    phone: billing.phone,
  };

  return { billing, shipping };
}

export default function CheckoutForm() {
  const {
    cart,
    status,
    error: cartError,
    busy,
  } = useCart();
  const [fields, setFields] = useState<FormFields>(initialFields);
  const [step, setStep] = useState<'address' | 'payment'>('address');
  const [selectedRate, setSelectedRate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currency = cart?.totals.currencyCode ?? 'KES';
  const minorUnit = cart?.totals.currencyMinorUnit ?? 2;
  const money = (value: string) => formatMoney(value, currency, minorUnit);

  const rates =
    cart?.shippingPackages.flatMap((pkg) =>
      pkg.rates.map((rate) => ({ ...rate, packageId: pkg.packageId })),
    ) ?? [];

  useEffect(() => {
    if (!cart) return;
    const selected = cart.shippingPackages
      .flatMap((pkg) => pkg.rates)
      .find((rate) => rate.selected);
    if (selected) setSelectedRate((current) => current || selected.rateId);
    const firstMethod = cart.paymentMethods[0];
    if (firstMethod) setPaymentMethod((current) => current || firstMethod);
  }, [cart]);

  function update<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function chooseRate(packageId: number, rateId: string) {
    setSelectedRate(rateId);
    setError(null);
    try {
      await selectShippingRate(packageId, rateId);
    } catch (rateError) {
      setError(
        rateError instanceof Error
          ? rateError.message
          : 'Could not update the delivery option.',
      );
    }
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!cart || cart.items.length === 0) return;

    if (step === 'address') {
      setSubmitting(true);
      try {
        const { billing, shipping } = toAddresses(fields);
        await updateCustomer({
          billing_address: billing,
          shipping_address: shipping,
        });
        setStep('payment');
      } catch (addressError) {
        setError(
          addressError instanceof Error
            ? addressError.message
            : 'Could not save your address.',
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!paymentMethod) {
      setError('Choose a payment method to continue.');
      return;
    }

    if (cart.needsShipping && rates.length === 0) {
      setError(
        'No delivery options are available for this address. Please contact us.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const { billing, shipping } = toAddresses(fields);
      let latestCart = cart;

      const rate =
        rates.find((item) => item.rateId === selectedRate) ??
        rates.find((item) => item.selected);

      if (rate) {
        const pkg = cart.shippingPackages.find(
          (item) => item.packageId === rate.packageId,
        );
        const alreadySelected = pkg?.rates.find(
          (item) => item.rateId === rate.rateId,
        )?.selected;

        if (!alreadySelected) {
          latestCart = await selectShippingRate(rate.packageId, rate.rateId);
        }
      }

      const result = await checkout({
        billing_address: billing,
        shipping_address: shipping,
        customer_note: fields.note.trim() || undefined,
        payment_method: paymentMethod,
        expected_total: latestCart.totals.totalPrice,
      });

      if (result.redirectUrl) {
        window.location.assign(result.redirectUrl);
      } else {
        window.location.assign(
          `/order-confirmation/?order=${encodeURIComponent(result.orderId)}&key=${encodeURIComponent(result.orderKey)}`,
        );
      }
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : 'Checkout could not be completed. Please try again.',
      );
      setSubmitting(false);
    }
  }

  if (status === 'loading' && !cart) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="h-96 animate-pulse rounded-3xl bg-cream-200/70" />
        <div className="h-80 animate-pulse rounded-3xl bg-cream-200/70" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-3xl border border-ink-900/10 bg-white/55 px-6 py-16 text-center">
        <h2 className="font-display text-3xl text-ink-900">
          Your cart is empty
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-ink-500">
          Add something to your cart before heading to checkout.
        </p>
        <a href="/shop/" className="btn-primary mt-7">
          Shop the collection
        </a>
      </div>
    );
  }

  const disabled = busy || submitting;
  const billing = toAddresses(fields).billing;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:items-start">
      <form onSubmit={handleSubmit} className="rounded-3xl border border-ink-900/10 bg-white/55 p-6 sm:p-8">
        <ol className="mb-8 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em]">
          <li className={step === 'address' ? 'text-clay-600' : 'text-olive-700'}>
            1. Delivery
          </li>
          <li aria-hidden="true" className="text-ink-300">/</li>
          <li className={step === 'payment' ? 'text-clay-600' : 'text-ink-300'}>
            2. Payment
          </li>
        </ol>

        {step === 'address' ? (
          <div className="space-y-5">
            <div>
              <p className="field-label">Contact</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="field-label">Email address</span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={fields.email}
                    onChange={(event) => update('email', event.target.value)}
                    className="field"
                    placeholder="you@example.com"
                  />
                </label>
                <label>
                  <span className="field-label">First name</span>
                  <input
                    required
                    autoComplete="given-name"
                    value={fields.firstName}
                    onChange={(event) => update('firstName', event.target.value)}
                    className="field"
                  />
                </label>
                <label>
                  <span className="field-label">Last name</span>
                  <input
                    required
                    autoComplete="family-name"
                    value={fields.lastName}
                    onChange={(event) => update('lastName', event.target.value)}
                    className="field"
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="field-label">Phone</span>
                  <input
                    required
                    type="tel"
                    autoComplete="tel"
                    value={fields.phone}
                    onChange={(event) => update('phone', event.target.value)}
                    className="field"
                    placeholder="+254 700 000 000"
                  />
                </label>
              </div>
            </div>

            <div>
              <p className="field-label">Delivery address</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="field-label">Street address</span>
                  <input
                    required
                    autoComplete="address-line1"
                    value={fields.address1}
                    onChange={(event) => update('address1', event.target.value)}
                    className="field"
                    placeholder="Street address"
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="field-label">Apartment, suite, etc. (optional)</span>
                  <input
                    autoComplete="address-line2"
                    value={fields.address2}
                    onChange={(event) => update('address2', event.target.value)}
                    className="field"
                  />
                </label>
                <label>
                  <span className="field-label">City / suburb</span>
                  <input
                    required
                    autoComplete="address-level2"
                    value={fields.city}
                    onChange={(event) => update('city', event.target.value)}
                    className="field"
                  />
                </label>
                <label>
                  <span className="field-label">County</span>
                  <select
                    required
                    autoComplete="address-level1"
                    value={fields.state}
                    onChange={(event) => update('state', event.target.value)}
                    className="field"
                  >
                    {counties.map((county) => (
                      <option key={county.code} value={county.code}>
                        {county.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="field-label">Postal code</span>
                  <input
                    required
                    autoComplete="postal-code"
                    value={fields.postcode}
                    onChange={(event) => update('postcode', event.target.value)}
                    className="field"
                  />
                </label>
                <div>
                  <span className="field-label">Country</span>
                  <p className="field flex items-center bg-cream-100/60 text-ink-500">
                    Kenya
                  </p>
                </div>
              </div>
            </div>

            <label className="block">
              <span className="field-label">Order note (optional)</span>
              <textarea
                rows={3}
                value={fields.note}
                onChange={(event) => update('note', event.target.value)}
                className="field resize-y"
                placeholder="Anything we should know about this order?"
              />
            </label>

            <button type="submit" disabled={disabled} className="btn-primary w-full">
              {submitting ? 'Saving…' : 'Continue to payment'}
            </button>
          </div>
        ) : (
          <div className="space-y-7">
            <div className="rounded-2xl border border-ink-900/10 bg-cream-100/70 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="field-label">Delivering to</p>
                  <p className="text-sm font-semibold text-ink-900">
                    {billing.first_name} {billing.last_name}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-ink-500">
                    {billing.address_1}
                    {billing.address_2 ? `, ${billing.address_2}` : ''}
                    <br />
                    {billing.city}, {billing.state} {billing.postcode}
                    <br />
                    {billing.email} · {billing.phone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('address')}
                  className="text-xs font-bold uppercase tracking-[0.12em] text-clay-600 underline underline-offset-4"
                >
                  Edit
                </button>
              </div>
            </div>

            {rates.length > 0 && (
              <div>
                <p className="field-label">Delivery option</p>
                <div className="space-y-3">
                  {rates.map((rate) => (
                    <label
                      key={`${rate.packageId}-${rate.rateId}`}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                        selectedRate === rate.rateId
                          ? 'border-ink-900 bg-cream-100/80'
                          : 'border-ink-900/10 hover:border-ink-900/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping_rate"
                        value={rate.rateId}
                        checked={selectedRate === rate.rateId}
                        onChange={() => void chooseRate(rate.packageId, rate.rateId)}
                        className="mt-1 accent-ink-900"
                      />
                      <span className="flex-1">
                        <span className="flex items-center justify-between gap-3">
                          <span className="text-sm font-bold text-ink-900">
                            {rate.name}
                          </span>
                          <span className="text-sm font-semibold text-ink-900">
                            {Number(rate.price) === 0 ? 'Free' : money(rate.price)}
                          </span>
                        </span>
                        {rate.description && (
                          <span className="mt-1 block text-xs leading-5 text-ink-500">
                            {rate.description}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="field-label">Payment method</p>
              {cart.paymentMethods.length > 0 ? (
                <div className="space-y-3">
                  {cart.paymentMethods.map((method) => (
                    <label
                      key={method}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                        paymentMethod === method
                          ? 'border-ink-900 bg-cream-100/80'
                          : 'border-ink-900/10 hover:border-ink-900/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={() => setPaymentMethod(method)}
                        className="mt-1 accent-ink-900"
                      />
                      <span>
                        <span className="block text-sm font-bold text-ink-900">
                          {paymentLabels[method] ?? method}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-ink-500">
                          {method === 'mpesa'
                            ? 'You will receive an M-Pesa payment request on your phone.'
                            : method === 'cod'
                              ? 'Pay the courier when your order arrives.'
                              : method === 'bacs'
                                ? 'Bank details will be shown after you place the order.'
                                : 'You will be redirected to complete payment securely.'}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-clay-100 px-4 py-3 text-sm font-semibold text-clay-600">
                  No payment methods are available. Configure a gateway in
                  WooCommerce first.
                </p>
              )}
            </div>

            <label className="block">
              <span className="field-label">Order note (optional)</span>
              <textarea
                rows={3}
                value={fields.note}
                onChange={(event) => update('note', event.target.value)}
                className="field resize-y"
              />
            </label>

            {!hasWooCommerce && (
              <p className="rounded-xl bg-olive-100 px-4 py-3 text-xs font-semibold leading-6 text-olive-700">
                Demo checkout: no payment will be taken and no order will be
                created in WordPress.
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row-reverse">
              <button
                type="submit"
                disabled={disabled || cart.paymentMethods.length === 0}
                className="btn-primary flex-1"
              >
                {submitting ? 'Placing order…' : 'Place order'}
              </button>
              <button
                type="button"
                onClick={() => setStep('address')}
                disabled={disabled}
                className="btn-secondary"
              >
                Back
              </button>
            </div>
          </div>
        )}

        <div aria-live="polite">
          {(error || cartError) && (
            <p className="mt-4 rounded-xl bg-clay-100 px-4 py-3 text-sm font-semibold text-clay-600">
              {error || cartError}
            </p>
          )}
        </div>
      </form>

      <aside className="rounded-3xl border border-ink-900/10 bg-cream-100/80 p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-2xl text-ink-900">Your order</h2>

        <ul className="mt-5 space-y-4">
          {cart.items.map((item) => {
            const image = item.images[0];
            return (
              <li key={item.key} className="flex items-center gap-3">
                <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                  {image && (
                    <img
                      src={image.thumbnail || image.src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {item.name}
                  </p>
                  <p className="text-xs text-ink-500">Qty {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-ink-900">
                  {money(item.totals.price)}
                </p>
              </li>
            );
          })}
        </ul>

        <dl className="mt-6 space-y-3 border-t border-ink-900/10 pt-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-500">Subtotal</dt>
            <dd className="font-semibold text-ink-900">
              {money(cart.totals.totalItems)}
            </dd>
          </div>
          {Number(cart.totals.totalDiscount) > 0 && (
            <div className="flex justify-between gap-4 text-olive-700">
              <dt>Discount</dt>
              <dd className="font-semibold">
                −{money(cart.totals.totalDiscount)}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-ink-500">Shipping</dt>
            <dd className="font-semibold text-ink-900">
              {Number(cart.totals.totalShipping) === 0
                ? 'Free'
                : money(cart.totals.totalShipping)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-ink-900/10 pt-4">
            <dt className="font-display text-xl text-ink-900">Total</dt>
            <dd className="font-display text-xl text-ink-900">
              {money(cart.totals.totalPrice)}
            </dd>
          </div>
        </dl>

        <a
          href="/cart/"
          className="mt-5 block text-center text-xs font-bold uppercase tracking-[0.14em] text-ink-500 hover:text-ink-900"
        >
          Edit cart
        </a>
      </aside>
    </div>
  );
}
