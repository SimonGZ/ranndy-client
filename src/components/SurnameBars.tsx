import { LastNameDetails } from "../types";

const GROUPS: { key: keyof LastNameDetails; label: string }[] = [
  { key: "pctwhite", label: "White" },
  { key: "pcthispanic", label: "Hispanic" },
  { key: "pctblack", label: "Black" },
  { key: "pctasian", label: "Asian" },
  { key: "pct2prace", label: "Two or more" },
  { key: "pctnative", label: "Native" },
];

/** Share of people with this surname in each Census group, largest first. */
export default function SurnameBars({ details }: { details: LastNameDetails }) {
  const rows = GROUPS.map((g) => ({
    label: g.label,
    value: parseFloat(String(details[g.key])),
  }))
    .filter((r) => !isNaN(r.value))
    .sort((a, b) => b.value - a.value);

  if (rows.length === 0) {
    return <p className="text-[0.85rem] text-muted">No breakdown is available for this surname.</p>;
  }

  return (
    <div className="grid gap-[7px]">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[92px_1fr_48px] items-center gap-2 text-[0.82rem]">
          <span>{r.label}</span>
          <span className="h-2 overflow-hidden rounded bg-sunk">
            <span
              className="block h-full rounded bg-accent"
              style={{ width: `${Math.min(100, r.value)}%` }}
            />
          </span>
          <span className="text-right text-muted tabular-nums">{r.value.toFixed(1)}%</span>
        </div>
      ))}
      <p className="pt-1 text-[0.75rem] text-muted">Source: U.S. Census surname data.</p>
    </div>
  );
}
