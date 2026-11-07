import { useEffect, useRef, useState } from "react";
import { Check, Copy, ExternalLink, Lock, X } from "lucide-react";
import { NamePair } from "../types";
import PopularityChart from "./PopularityChart";
import SurnameBars from "./SurnameBars";

interface NameDrawerProps {
  namePair: NamePair | null;
  onClose: () => void;
  onCopy: () => void;
  onLockFirst: () => void;
  onLockLast: () => void;
  isFirstNameLocked: boolean;
  isLastNameLocked: boolean;
  birthYear: number;
}

const searchUrl = (kind: "first name" | "surname", name: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(`${kind} meaning ${name}`)}`;

export default function NameDrawer({
  namePair,
  onClose,
  onCopy,
  onLockFirst,
  onLockLast,
  isFirstNameLocked,
  isLastNameLocked,
  birthYear,
}: NameDrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = !!namePair;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(t);
  }, [copied]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const first = namePair?.[0];
  const last = namePair?.[1];

  const ghost =
    "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.85rem] font-medium focus-visible:outline-2 focus-visible:outline-accent";

  return (
    <dialog
      ref={ref}
      className="panel"
      aria-labelledby="drawer-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // click on the backdrop
      }}
    >
      {first && last && (
        <div className="grid min-h-full content-start gap-5 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="grid gap-1.5">
              <h2 id="drawer-title" className="font-display text-[1.8rem] leading-tight font-semibold">
                {first.name} {last.name}
              </h2>
              <p className="flex flex-wrap gap-x-3 text-[0.85rem] text-muted">
                <span>{first.gender === "M" ? "Male" : "Female"}</span>
                {first.rank > 0 && first.year > 0 && (
                  <span>
                    First name #{first.rank.toLocaleString()} in {first.year}
                  </span>
                )}
                {last.rank > 0 && <span>Surname #{last.rank.toLocaleString()}</span>}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="-mt-1 -mr-2 cursor-pointer rounded-full p-2 text-muted hover:bg-sunk hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X size={22} aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                onCopy();
                setCopied(true);
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-[0.85rem] font-semibold text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
              {copied ? "Copied" : "Copy name"}
            </button>
            <button
              type="button"
              onClick={onLockFirst}
              aria-pressed={isFirstNameLocked}
              className={`${ghost} ${isFirstNameLocked ? "border-transparent bg-mark text-mark-ink" : "border-line bg-surface text-ink"}`}
            >
              <Lock size={15} aria-hidden="true" />
              {isFirstNameLocked ? "Unlock first" : "Lock first"}
            </button>
            <button
              type="button"
              onClick={onLockLast}
              aria-pressed={isLastNameLocked}
              className={`${ghost} ${isLastNameLocked ? "border-transparent bg-mark text-mark-ink" : "border-line bg-surface text-ink"}`}
            >
              <Lock size={15} aria-hidden="true" />
              {isLastNameLocked ? "Unlock last" : "Lock last"}
            </button>
          </div>

          <PopularityChart
            firstName={first.name}
            gender={first.gender === "M" ? "male" : "female"}
            birthYear={birthYear}
          />

          <div className="grid gap-2">
            <h3 className="text-[0.72rem] font-semibold uppercase tracking-[0.07em] text-muted">
              {last.name} · who carries the surname
            </h3>
            <SurnameBars details={last} />
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[0.88rem]">
            <a
              className="inline-flex items-center gap-1.5 text-accent hover:underline"
              href={searchUrl("first name", first.name)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={15} aria-hidden="true" />
              Meaning of {first.name}
            </a>
            <a
              className="inline-flex items-center gap-1.5 text-accent hover:underline"
              href={searchUrl("surname", last.name)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={15} aria-hidden="true" />
              Origin of {last.name}
            </a>
          </div>
        </div>
      )}
    </dialog>
  );
}
