import { useState, type FormEvent } from "react";
import { Check, Loader2, ShoppingBag } from "lucide-react";
import { addItem } from "../../lib/cart-store";
import { formatMoney } from "../../lib/format";

interface Props {
    workshopId: number;
    slug: string;
    isFree: boolean;
    ticketProductId?: number;
    price: string;
    currencyCode: string;
    minorUnit: number;
    seatsLeft: number;
}

const RSVP_KEY = "craft-rsvps-v1";

function saveRsvp(entry: {
    workshopId: number;
    slug: string;
    name: string;
    email: string;
    createdAt: string;
}) {
    try {
        const raw = window.localStorage.getItem(RSVP_KEY);
        const existing = raw ? (JSON.parse(raw) as unknown[]) : [];
        window.localStorage.setItem(
            RSVP_KEY,
            JSON.stringify([...existing, entry]),
        );
    } catch {
        // Storage can be unavailable in private browsing; the confirmation still shows.
    }
}

export default function WorkshopBooking({
    workshopId,
    slug,
    isFree,
    ticketProductId,
    price,
    currencyCode,
    minorUnit,
    seatsLeft,
}: Props) {
    const [busy, setBusy] = useState(false);
    const [added, setAdded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [rsvpDone, setRsvpDone] = useState(false);

    const priceLabel = formatMoney(price, currencyCode, minorUnit);
    const soldOut = seatsLeft <= 0 || !ticketProductId;

    async function handleBook() {
        if (!ticketProductId || soldOut) return;

        setBusy(true);
        setError(null);

        try {
            await addItem({ id: ticketProductId, quantity: 1 });
            setAdded(true);
            window.dispatchEvent(new CustomEvent("cart:open"));
        } catch (bookError) {
            setError(
                bookError instanceof Error
                    ? bookError.message
                    : "Could not add this workshop to your cart.",
            );
        } finally {
            setBusy(false);
        }
    }

    function handleRsvp(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const trimmedName = name.trim();
        const trimmedEmail = email.trim();

        if (!trimmedName || !trimmedEmail) {
            setError("Please add your name and email so we can save your seat.");
            return;
        }

        saveRsvp({
            workshopId,
            slug,
            name: trimmedName,
            email: trimmedEmail,
            createdAt: new Date().toISOString(),
        });
        setRsvpDone(true);
    }

    if (isFree) {
        if (rsvpDone) {
            return (
                <div
                    role="status"
                    aria-live="polite"
                    className="rounded-2xl bg-olive-100 p-5 text-ink-900"
                >
                    <p className="flex items-center gap-2 font-bold">
                        <Check className="h-4 w-4 text-olive-700" />
                        You&rsquo;re on the list, {name.trim().split(" ")[0]}.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-ink-600">
                        We&rsquo;ll email {email.trim()} before the session with
                        everything you need to bring.
                    </p>
                    <p className="mt-3 text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-ink-400">
                        Demo RSVP — no email is sent yet
                    </p>
                </div>
            );
        }

        return (
            <form onSubmit={handleRsvp} className="space-y-4">
                <div>
                    <label className="field-label" htmlFor="rsvp-name">
                        Your name
                    </label>
                    <input
                        id="rsvp-name"
                        required
                        autoComplete="name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="field"
                    />
                </div>
                <div>
                    <label className="field-label" htmlFor="rsvp-email">
                        Email address
                    </label>
                    <input
                        id="rsvp-email"
                        required
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="field"
                    />
                </div>

                {error && (
                    <p role="alert" className="text-sm font-semibold text-clay-600">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-poppy-500 px-6 py-3 text-sm font-bold text-cream-50 transition hover:bg-poppy-600"
                >
                    RSVP — free
                </button>

                <p className="text-xs leading-5 text-ink-500">
                    No payment needed. One place per RSVP; bring a friend and
                    they can RSVP separately.
                </p>
            </form>
        );
    }

    return (
        <div>
            <p className="font-display text-3xl text-ink-900">{priceLabel}</p>
            <p className="mt-1 text-xs font-semibold text-ink-500">
                Per seat · all materials included
            </p>

            <button
                type="button"
                onClick={handleBook}
                disabled={busy || added || soldOut}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-poppy-500 px-6 py-3 text-sm font-bold text-cream-50 transition hover:bg-poppy-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : added ? (
                    <Check className="h-4 w-4" />
                ) : (
                    <ShoppingBag className="h-4 w-4" />
                )}
                {soldOut
                    ? "Sold out"
                    : busy
                      ? "Adding your seat…"
                      : added
                        ? "Seat added to cart"
                        : `Save my spot — ${priceLabel}`}
            </button>

            {added && (
                <p className="mt-3 text-center text-xs font-semibold text-olive-700">
                    <a href="/cart/" className="underline underline-offset-2">
                        View your cart
                    </a>{" "}
                    to finish booking.
                </p>
            )}

            {error && (
                <p role="alert" className="mt-3 text-sm font-semibold text-clay-600">
                    {error}
                </p>
            )}

            <p className="mt-4 text-xs leading-5 text-ink-500">
                Your seat is held once the ticket is in your cart. You can
                remove it before checkout if plans change.
            </p>
        </div>
    );
}
