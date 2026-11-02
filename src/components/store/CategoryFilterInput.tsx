import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { getFilterInput } from "../../lib/filters";
import type { CategoryFilter } from "../../lib/types";

interface CategoryFilterInputProps {
    filter: CategoryFilter;
    selected: string[];
    onChange: (selected: string[]) => void;
}

const LEGEND_CLASS = "text-xs font-bold text-ink-700";
const OPTION_CLASS =
    "flex cursor-pointer items-center gap-2.5 text-xs text-ink-600";
const CONTROL_CLASS =
    "h-3.5 w-3.5 border-ink-900/25 text-poppy-500 focus:ring-poppy-500";
// text-base below lg stops iOS zooming the page when the input is focused.
const FIELD_CLASS =
    "w-full rounded-xl border border-ink-900/20 bg-white px-3 py-2 text-base text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-poppy-500 lg:text-xs";

export default function CategoryFilterInput({
    filter,
    selected,
    onChange,
}: CategoryFilterInputProps) {
    const props = { filter, selected, onChange };

    switch (getFilterInput(filter.mode, filter.options.length)) {
        case "checkbox":
            return <CheckboxFilter {...props} />;
        case "multi-select":
            return <MultiSelectFilter {...props} />;
        case "radio":
            return <RadioFilter {...props} />;
        case "select":
            return <SelectFilter {...props} />;
    }
}

function toggle(selected: string[], value: string): string[] {
    return selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];
}

function CheckboxFilter({ filter, selected, onChange }: CategoryFilterInputProps) {
    return (
        <fieldset className="space-y-3">
            <legend className={LEGEND_CLASS}>{filter.label}</legend>
            <div className="space-y-2">
                {filter.options.map((option) => (
                    <label key={option.value} className={OPTION_CLASS}>
                        <input
                            type="checkbox"
                            checked={selected.includes(option.value)}
                            onChange={() =>
                                onChange(toggle(selected, option.value))
                            }
                            className={`${CONTROL_CLASS} rounded`}
                        />
                        {option.label}
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

function RadioFilter({ filter, selected, onChange }: CategoryFilterInputProps) {
    const name = useId();
    // A radio can't be unticked, so "Any" is how a shopper clears the filter.
    const options = [{ value: "", label: "Any" }, ...filter.options];

    return (
        <fieldset className="space-y-3">
            <legend className={LEGEND_CLASS}>{filter.label}</legend>
            <div className="space-y-2">
                {options.map((option) => (
                    <label key={option.value} className={OPTION_CLASS}>
                        <input
                            type="radio"
                            name={name}
                            checked={(selected[0] ?? "") === option.value}
                            onChange={() =>
                                onChange(option.value ? [option.value] : [])
                            }
                            className={CONTROL_CLASS}
                        />
                        {option.label}
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

function SelectFilter({ filter, selected, onChange }: CategoryFilterInputProps) {
    const id = useId();

    return (
        <div className="space-y-3">
            <label htmlFor={id} className={`block ${LEGEND_CLASS}`}>
                {filter.label}
            </label>
            <select
                id={id}
                value={selected[0] ?? ""}
                onChange={(event) =>
                    onChange(event.target.value ? [event.target.value] : [])
                }
                className={FIELD_CLASS}
            >
                <option value="">Any</option>
                {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

/**
 * A button that opens a checkbox list. The native <select multiple> needs
 * Ctrl/Cmd-click on desktop, which most shoppers don't know. The list opens in
 * the page flow, so it can't be clipped by the sticky sidebar.
 */
function MultiSelectFilter({ filter, selected, onChange }: CategoryFilterInputProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const baseId = useId();
    const labelId = `${baseId}-label`;
    const listId = `${baseId}-list`;

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
                buttonRef.current?.focus();
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    const selectedLabels = filter.options
        .filter((option) => selected.includes(option.value))
        .map((option) => option.label);
    const summary =
        selectedLabels.length === 0
            ? "Any"
            : selectedLabels.length <= 2
              ? selectedLabels.join(", ")
              : `${selectedLabels.length} selected`;

    return (
        <div ref={containerRef} className="space-y-3">
            <p id={labelId} className={LEGEND_CLASS}>
                {filter.label}
            </p>
            <button
                ref={buttonRef}
                type="button"
                aria-expanded={open}
                aria-controls={listId}
                aria-labelledby={`${labelId} ${listId}-summary`}
                onClick={() => setOpen((value) => !value)}
                className={`${FIELD_CLASS} flex items-center justify-between gap-2 text-left`}
            >
                <span id={`${listId}-summary`} className="truncate">
                    {summary}
                </span>
                <ChevronDown
                    aria-hidden="true"
                    className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
                />
            </button>
            <div
                id={listId}
                role="group"
                aria-labelledby={labelId}
                hidden={!open}
                className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-ink-900/15 bg-white p-2"
            >
                {filter.options.map((option) => {
                    const isSelected = selected.includes(option.value);
                    return (
                        <label
                            key={option.value}
                            className={`${OPTION_CLASS} rounded-lg px-2 py-1.5 hover:bg-cream-100`}
                        >
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                    onChange(toggle(selected, option.value))
                                }
                                className={`${CONTROL_CLASS} rounded`}
                            />
                            <span className="flex-1">{option.label}</span>
                            {isSelected && (
                                <Check
                                    aria-hidden="true"
                                    className="h-3.5 w-3.5 text-poppy-600"
                                />
                            )}
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
