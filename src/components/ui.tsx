import { ReactNode } from "react";
import { Lock, X } from "lucide-react";

export interface Option<T extends string> {
  value: T;
  label: string;
}

/** A row of mutually exclusive buttons (behaves as a radio group). */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid auto-cols-fr grid-flow-col gap-0.5 rounded-lg bg-sunk p-[3px]"
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={`cursor-pointer rounded-md px-1 py-1.5 text-[0.8rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
              selected
                ? "bg-surface text-ink shadow-sm dark:bg-line"
                : "text-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Like Segmented, but wraps onto several lines. */
export function Pills<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={`cursor-pointer rounded-full border px-3 py-1 text-[0.8rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              selected
                ? "border-accent bg-accent text-surface"
                : "border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function FieldLabel({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  const cls =
    "text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-muted";
  return htmlFor ? (
    <label htmlFor={htmlFor} className={cls}>
      {children}
    </label>
  ) : (
    <span className={cls}>{children}</span>
  );
}

export function LockChip({
  name,
  onUnlock,
}: {
  name: string;
  onUnlock: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-mark py-0.5 pr-0.5 pl-2 text-[0.78rem] font-medium text-mark-ink">
      <Lock size={12} aria-hidden="true" />
      {name}
      <button
        type="button"
        onClick={onUnlock}
        aria-label={`Unlock ${name}`}
        className="cursor-pointer rounded-full px-1.5 text-base leading-none hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <X size={13} aria-hidden="true" />
      </button>
    </span>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display font-semibold tracking-[-0.01em] text-ink ${className}`}
      aria-label="Ranndy"
      role="img"
    >
      <span aria-hidden="true">
        Ran<span className="wordmark-odd">n</span>dy
      </span>
    </span>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[0.9rem] text-ink placeholder:text-muted/70 focus:outline-2 focus:outline-accent disabled:cursor-not-allowed disabled:bg-sunk disabled:text-muted";
