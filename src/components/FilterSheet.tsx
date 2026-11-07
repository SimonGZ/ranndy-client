import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Query } from "../lib/query";
import Filters from "./Filters";

/** Phones: the filters as a bottom sheet over the list. */
export default function FilterSheet({
  open,
  onClose,
  query,
  onQueryChange,
}: {
  open: boolean;
  onClose: () => void;
  query: Query;
  onQueryChange: (changes: Partial<Query>) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="sheet-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {open && (
        <div className="grid min-h-full gap-4 px-5 pt-2.5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto h-1 w-9 rounded-full bg-line" aria-hidden="true" />
          <div className="flex items-center justify-between">
            <h2 id="sheet-title" className="font-display text-lg font-semibold">
              Filters
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="-mr-2 cursor-pointer rounded-full p-2 text-muted hover:bg-sunk hover:text-ink"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <Filters query={query} onQueryChange={onQueryChange} idPrefix="sheet" />
          <button
            type="button"
            onClick={onClose}
            className="sticky bottom-0 cursor-pointer rounded-xl bg-accent py-2.5 text-[0.9rem] font-semibold text-surface shadow-[0_-12px_16px_var(--color-surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Show names
          </button>
        </div>
      )}
    </dialog>
  );
}
