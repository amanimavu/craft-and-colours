import { useState, type SyntheticEvent } from 'react';
import { getStoreUrl, hasWooCommerce } from '../../lib/cart-api';

interface Fields {
  name: string;
  email: string;
  message: string;
  website: string;
}

const initialFields: Fields = {
  name: '',
  email: '',
  message: '',
  website: '',
};

export default function ContactForm() {
  const [fields, setFields] = useState<Fields>(initialFields);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      if (hasWooCommerce) {
        const response = await fetch(
          `${getStoreUrl()}/wp-json/craft/v1/contact`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'omit',
            body: JSON.stringify({
              name: fields.name,
              email: fields.email,
              message: fields.message,
              website: fields.website,
            }),
          },
        );

        const data = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!response.ok) {
          throw new Error(data?.message || 'Could not send your message.');
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setSent(true);
      setFields(initialFields);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : 'Could not send your message. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-3xl border border-olive-500/20 bg-olive-100 p-8">
        <p className="eyebrow text-olive-700">Message received</p>
        <h2 className="mt-3 font-display text-3xl text-ink-900">
          Thank you. We will be in touch.
        </h2>
        <p className="mt-3 text-sm leading-7 text-ink-700">
          We read every note ourselves and usually reply within two working
          days.
          {!hasWooCommerce && ' (Demo mode: no message was actually sent.)'}
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="btn-secondary mt-6"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-ink-900/10 bg-white/55 p-6 sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="field-label">Your name</span>
          <input
            required
            autoComplete="name"
            value={fields.name}
            onChange={(event) => update('name', event.target.value)}
            className="field"
          />
        </label>
        <label>
          <span className="field-label">Email address</span>
          <input
            required
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={(event) => update('email', event.target.value)}
            className="field"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="field-label">Message</span>
          <textarea
            required
            rows={6}
            value={fields.message}
            onChange={(event) => update('message', event.target.value)}
            className="field resize-y"
            placeholder="Tell us what you are looking for, or ask about an order."
          />
        </label>
      </div>

      <label className="sr-only" aria-hidden="true">
        Website
        <input
          tabIndex={-1}
          autoComplete="off"
          value={fields.website}
          onChange={(event) => update('website', event.target.value)}
        />
      </label>

      <div className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? 'Sending…' : 'Send message'}
        </button>
        <p className="text-xs leading-5 text-ink-500">
          We usually reply within two working days.
        </p>
      </div>

      {!hasWooCommerce && (
        <p className="mt-4 rounded-xl bg-olive-100 px-4 py-3 text-xs font-semibold leading-6 text-olive-700">
          Demo mode: the contact form is simulated until WordPress is connected.
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-clay-100 px-4 py-3 text-sm font-semibold text-clay-600">
          {error}
        </p>
      )}
    </form>
  );
}
