import type { Price, Product } from "./types";

export function formatMoney(
    value: string | number,
    currency = "KES",
    minorUnit = 2,
): string {
    const amount = Number(value) / 10 ** minorUnit;
    if (!Number.isFinite(amount)) return "—";

    try {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch {
        return `KSh ${amount.toFixed(0)}`;
    }
}

export function formatPrice(price: Price): string {
    return formatMoney(
        price.price,
        price.currency_code,
        price.currency_minor_unit,
    );
}

export function formatProductPrice(product: Product): string {
    const range = product.prices.price_range;
    if (range?.min_amount && range?.max_amount) {
        return `${formatMoney(
            range.min_amount,
            product.prices.currency_code,
            product.prices.currency_minor_unit,
        )} – ${formatMoney(
            range.max_amount,
            product.prices.currency_code,
            product.prices.currency_minor_unit,
        )}`;
    }

    if (product.variations && product.variations.length > 1) {
        const amounts = product.variations.map((variation) =>
            Number(variation.prices.price),
        );
        const min = Math.min(...amounts);
        const max = Math.max(...amounts);
        if (min !== max) {
            return `${formatMoney(
                min,
                product.prices.currency_code,
                product.prices.currency_minor_unit,
            )} – ${formatMoney(
                max,
                product.prices.currency_code,
                product.prices.currency_minor_unit,
            )}`;
        }
    }

    return formatPrice(product.prices);
}

export function formatCardPrice(product: Product): string {
    const range = product.prices.price_range;
    if (range?.min_amount && range?.max_amount && range.min_amount !== range.max_amount) {
        return `From ${formatMoney(
            range.min_amount,
            product.prices.currency_code,
            product.prices.currency_minor_unit,
        )}`;
    }

    if (product.variations && product.variations.length > 1) {
        const amounts = product.variations.map((variation) =>
            Number(variation.prices.price),
        );
        const min = Math.min(...amounts);
        const max = Math.max(...amounts);
        if (min !== max) {
            return `From ${formatMoney(
                min,
                product.prices.currency_code,
                product.prices.currency_minor_unit,
            )}`;
        }
    }

    return formatPrice(product.prices);
}

export function formatWorkshopDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

export function stripHtml(value: string): string {
    return value
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&#8217;/g, "’")
        .replace(/&#8216;/g, "‘")
        .replace(/&#8220;/g, "“")
        .replace(/&#8221;/g, "”")
        .replace(/&#8211;/g, "–")
        .replace(/&#8212;/g, "—")
        .replace(/&hellip;/g, "…")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
}

export function truncate(value: string, length = 160): string {
    const text = stripHtml(value);
    if (text.length <= length) return text;
    return `${text.slice(0, length).trimEnd()}…`;
}

export function pluralise(
    count: number,
    singular: string,
    plural = `${singular}s`,
): string {
    return count === 1 ? singular : plural;
}

export function formatDate(date: string): string {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return date;
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(d);
}
