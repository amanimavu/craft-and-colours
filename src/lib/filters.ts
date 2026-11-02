import type { CategoryFilter, CategoryFilterMode } from "./types";

/** Above this many options, a filter uses a dropdown instead of a visible list. */
export const MAX_LISTED_FILTER_OPTIONS = 6;

export type FilterInput = "checkbox" | "multi-select" | "radio" | "select";

/** The CMS sets one/many; the input follows from that and the option count. */
export function getFilterInput(
    mode: CategoryFilterMode,
    optionCount: number,
): FilterInput {
    const listed = optionCount <= MAX_LISTED_FILTER_OPTIONS;
    if (mode === "many") return listed ? "checkbox" : "multi-select";
    return listed ? "radio" : "select";
}

/**
 * Selections from the URL can be stale or hand-edited. Keep only options the
 * category's filters still offer, and at most one for a "pick one" filter.
 * Unrelated parameters (e.g. utm_source) are dropped here too.
 */
export function keepValidSelections(
    selections: Record<string, string[]>,
    filters: CategoryFilter[],
): Record<string, string[]> {
    const valid: Record<string, string[]> = {};

    for (const filter of filters) {
        const known = (selections[filter.key] ?? []).filter((value) =>
            filter.options.some((option) => option.value === value),
        );
        const kept = filter.mode === "one" ? known.slice(0, 1) : known;
        if (kept.length > 0) valid[filter.key] = kept;
    }

    return valid;
}
