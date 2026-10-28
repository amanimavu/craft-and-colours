import { useState, type SyntheticEvent } from 'react';
import { ArrowRight, Check } from 'lucide-react';

type Status = 'idle' | 'error' | 'done';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus('error');
      return;
    }

    // Newsletter provider is not connected yet; keep the confirmation local.
    setStatus('done');
  };

  if (status === 'done') {
    return (
      <div
        className="flex items-start gap-3 rounded-2xl border border-olive-500/30 bg-olive-100 px-5 py-4"
        role="status"
      >
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-olive-700 text-cream-50">
          <Check size={16} strokeWidth={2.4} aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-bold text-ink-900">You’re on the list.</p>
          <p className="mt-1 text-xs leading-6 text-ink-500">
            Watch your inbox for workshop dates and new supplies. No noise.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <label
        htmlFor="newsletter-email"
        className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-ink-500"
      >
        Email address
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status === 'error') setStatus('idle');
          }}
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={status === 'error'}
          aria-describedby={status === 'error' ? 'newsletter-error' : undefined}
          className="field flex-1"
        />
        <button type="submit" className="btn-primary shrink-0">
          Join the list
          <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>

      {status === 'error' ? (
        <p id="newsletter-error" className="mt-2 text-xs font-semibold text-clay-600">
          That email doesn’t look right. Try again?
        </p>
      ) : (
        <p className="mt-2 text-xs leading-5 text-ink-500">
          One or two letters a month. Workshop dates, new supplies, small ideas.
        </p>
      )}
    </form>
  );
}
