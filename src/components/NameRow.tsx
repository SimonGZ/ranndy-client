import { ChevronDown, Copy, Lock, LockOpen } from "lucide-react";
import { Name } from "../types";

interface NameRowProps {
  name: Name;
  lockedFirst: boolean;
  lockedLast: boolean;
  /** Compact layouts and touch screens: this row shows its actions underneath. */
  expanded: boolean;
  /** Wide mouse/trackpad layouts: actions appear inline on hover. */
  inlineActions: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onCopy: () => void;
  onLockFirst: () => void;
  onLockLast: () => void;
}

const Part = ({ text, locked }: { text: string; locked: boolean }) => (
  <span className={locked ? "locked-part" : undefined}>{text}</span>
);

export default function NameRow({
  name,
  lockedFirst,
  lockedLast,
  expanded,
  inlineActions,
  onToggle,
  onOpen,
  onCopy,
  onLockFirst,
  onLockLast,
}: NameRowProps) {
  const full = `${name.first} ${name.last}`;
  const LockIcon = (on: boolean) => (on ? LockOpen : Lock);
  const iconBtn =
    "inline-flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-[0.78rem] font-medium text-muted hover:bg-sunk hover:text-ink focus-visible:outline-2 focus-visible:outline-accent";
  const detailsButton = (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Details for ${full}`}
      aria-haspopup="dialog"
      className={
        inlineActions
          ? iconBtn
          : "inline-flex min-h-8 shrink-0 cursor-pointer items-center rounded-lg border border-line bg-surface px-2.5 text-[0.82rem] font-medium text-accent hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent"
      }
    >
      Details
    </button>
  );

  if (inlineActions) {
    const FirstIcon = LockIcon(lockedFirst);
    const LastIcon = LockIcon(lockedLast);
    return (
      <li className="group flex min-w-0 items-center gap-2 rounded-lg px-3 hover:bg-paper focus-within:bg-paper">
        <button
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          className="min-w-0 flex-1 cursor-pointer break-words py-2 text-left font-display text-2xl leading-snug focus-visible:outline-none"
        >
          <Part text={name.first} locked={lockedFirst} />{" "}
          <Part text={name.last} locked={lockedLast} />
        </button>
        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button type="button" className={iconBtn} onClick={onCopy} aria-label={`Copy ${full}`}>
            <Copy size={16} aria-hidden="true" />
            <span className="hidden lg:inline">Copy</span>
          </button>
          <button
            type="button"
            className={`${iconBtn} ${lockedFirst ? "bg-mark text-mark-ink" : ""}`}
            onClick={onLockFirst}
            aria-pressed={lockedFirst}
            aria-label={`${lockedFirst ? "Unlock" : "Lock"} first name ${name.first}`}
          >
            <FirstIcon size={16} aria-hidden="true" />
            <span className="hidden lg:inline">First</span>
          </button>
          <button
            type="button"
            className={`${iconBtn} ${lockedLast ? "bg-mark text-mark-ink" : ""}`}
            onClick={onLockLast}
            aria-pressed={lockedLast}
            aria-label={`${lockedLast ? "Unlock" : "Lock"} surname ${name.last}`}
          >
            <LastIcon size={16} aria-hidden="true" />
            <span className="hidden lg:inline">Last</span>
          </button>
          {detailsButton}
        </div>
      </li>
    );
  }

  const actionBtn =
    "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[0.82rem] font-medium focus-visible:outline-2 focus-visible:outline-accent";
  const off = "border-line bg-surface text-ink";
  const on = "border-transparent bg-mark text-mark-ink";

  return (
    <li className={`border-b border-line last:border-b-0 ${expanded ? "bg-surface" : ""}`}>
      <div className="flex items-center pr-3">
        <button
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          className="min-w-0 flex-1 cursor-pointer break-words py-2.5 pl-4 text-left font-display text-[1.35rem] leading-snug focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
        >
          <Part text={name.first} locked={lockedFirst} />{" "}
          <Part text={name.last} locked={lockedLast} />
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-label={`Actions for ${full}`}
          aria-expanded={expanded}
          className="grid h-11 w-10 shrink-0 cursor-pointer place-items-center text-muted hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
        >
          <ChevronDown size={16} className={`shrink-0 text-muted ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {detailsButton}
      </div>
      {expanded && (
        <div className="flex flex-wrap gap-1.5 px-3.5 pb-3">
          <button type="button" className={`${actionBtn} ${off}`} onClick={onCopy}>
            <Copy size={14} aria-hidden="true" />
            Copy
          </button>
          <button
            type="button"
            className={`${actionBtn} ${lockedFirst ? on : off}`}
            onClick={onLockFirst}
            aria-pressed={lockedFirst}
          >
            <Lock size={14} aria-hidden="true" />
            {lockedFirst ? "Unlock first" : "Lock first"}
          </button>
          <button
            type="button"
            className={`${actionBtn} ${lockedLast ? on : off}`}
            onClick={onLockLast}
            aria-pressed={lockedLast}
          >
            <Lock size={14} aria-hidden="true" />
            {lockedLast ? "Unlock last" : "Lock last"}
          </button>
        </div>
      )}
    </li>
  );
}
