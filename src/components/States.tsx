import { ReactNode } from "react";
import { RotateCcw } from "lucide-react";

const buttonClass =
  "inline-flex cursor-pointer items-center gap-1.5 justify-self-start rounded-lg border border-line bg-surface px-3 py-1.5 text-[0.85rem] font-medium text-ink hover:bg-sunk focus-visible:outline-2 focus-visible:outline-accent";

export function EmptyState({
  mark,
  title,
  body,
  action,
  onAction,
}: {
  mark?: string;
  title: string;
  body: ReactNode;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="grid gap-2 px-5 py-10 sm:px-6">
      {mark && <span className="font-display text-3xl text-muted">{mark}</span>}
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="max-w-prose text-[0.92rem] text-muted">{body}</p>
      <button type="button" className={`${buttonClass} mt-1`} onClick={onAction}>
        {action}
      </button>
    </div>
  );
}

export function ErrorState({
  detail,
  onRetry,
  compact = false,
}: {
  detail?: string;
  onRetry: () => void;
  compact?: boolean;
}) {
  return (
    <div className={`grid gap-2 ${compact ? "px-4 py-5" : "px-5 py-10 sm:px-6"}`} role="alert">
      <h2 className={`font-display font-semibold ${compact ? "text-base" : "text-xl"}`}>
        Couldn’t load {compact ? "more " : ""}names
      </h2>
      <p className="max-w-prose text-[0.92rem] text-muted">
        Ranndy didn’t respond. Check your connection and try again; your filters
        are kept.
        {detail && <span className="mt-1 block text-[0.8rem]">Details: {detail}</span>}
      </p>
      <button type="button" className={`${buttonClass} mt-1`} onClick={onRetry}>
        <RotateCcw size={14} aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}

export function EndOfList() {
  return (
    <p className="border-t border-line px-4 py-5 text-center text-[0.85rem] text-muted">
      That’s every name that matches these filters.
    </p>
  );
}
