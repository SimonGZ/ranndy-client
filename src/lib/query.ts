// Query state, URL syncing, API URLs and the one-line filter summary.

export type Rank = "any" | "high" | "low";
export type Frequency = "any" | "high" | "medium" | "low";
export type Gender = "any" | "male" | "female";

export interface Query {
  rank: Rank;
  frequency: Frequency;
  gender: Gender;
  year: number; // 0 means any year
  race: string; // "any" or one of RACES[].value
  racePercent: number;
  fstartswith: string; // letters, or "Name^" when the first name is locked
  sstartswith: string;
}

export const DEFAULT_QUERY: Query = {
  rank: "high",
  frequency: "high",
  gender: "female",
  year: 0,
  race: "any",
  racePercent: 50,
  fstartswith: "",
  sstartswith: "",
};

export const MIN_YEAR = 1880;
export const MAX_YEAR = 2025;
export const MIN_RACE_PERCENT = 1;
export const MAX_RACE_PERCENT = 99;

export const RACES = [
  { value: "pctwhite", label: "White" },
  { value: "pcthispanic", label: "Hispanic" },
  { value: "pctblack", label: "Black" },
  { value: "pctasian", label: "Asian" },
  { value: "pctnative", label: "Native" },
] as const;

export const raceLabel = (value: string) =>
  RACES.find((r) => r.value === value)?.label ?? value;

// A lock is stored as "Josephine^" in the same field as "Starts with".
export const isLock = (s: string) => s.endsWith("^");
export const lockedName = (s: string) => (isLock(s) ? s.slice(0, -1) : null);
export const lockValue = (name: string) => `${name}^`;

const oneOf = <T extends string>(v: string | null, options: readonly T[]) =>
  v !== null && (options as readonly string[]).includes(v) ? (v as T) : undefined;

/** Read a Query from a location.search string, falling back to defaults. */
export function parseQuery(search: string): Query {
  const p = new URLSearchParams(search);
  const q: Query = { ...DEFAULT_QUERY };

  q.rank = oneOf(p.get("r"), ["any", "high", "low"] as const) ?? q.rank;
  q.frequency =
    oneOf(p.get("f"), ["any", "high", "medium", "low"] as const) ?? q.frequency;
  q.gender = oneOf(p.get("g"), ["any", "male", "female"] as const) ?? q.gender;

  const year = parseInt(p.get("y") ?? "", 10);
  if (!isNaN(year) && (year === 0 || (year >= MIN_YEAR && year <= MAX_YEAR)))
    q.year = year;

  const race = p.get("rc");
  if (race && RACES.some((r) => r.value === race)) q.race = race;

  const pct = parseInt(p.get("rp") ?? "", 10);
  if (pct === 0) q.racePercent = MIN_RACE_PERCENT; // Links made with the old slider.
  if (pct >= MIN_RACE_PERCENT && pct <= MAX_RACE_PERCENT) q.racePercent = pct;

  q.fstartswith = p.get("fs") ?? "";
  q.sstartswith = p.get("ss") ?? "";
  return q;
}

/** Write a Query to a search string, leaving out default values. */
export function toSearch(q: Query): string {
  const p = new URLSearchParams();
  const d = DEFAULT_QUERY;
  if (q.rank !== d.rank) p.set("r", q.rank);
  if (q.frequency !== d.frequency) p.set("f", q.frequency);
  if (q.gender !== d.gender) p.set("g", q.gender);
  if (q.year !== d.year) p.set("y", String(q.year));
  if (q.race !== d.race) {
    p.set("rc", q.race);
    if (q.racePercent !== d.racePercent) p.set("rp", String(q.racePercent));
  }
  if (q.fstartswith) p.set("fs", q.fstartswith);
  if (q.sstartswith) p.set("ss", q.sstartswith);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const PAGE_SIZE = 50;

export function namesUrl(apiUrl: string, q: Query): string {
  const params: string[] = [];
  if (q.rank !== "any") params.push(`rank=${q.rank}`);
  if (q.frequency !== "any") params.push(`frequency=${q.frequency}`);
  if (q.gender !== "any") params.push(`gender=${q.gender}`);
  params.push(`year=${q.year}`);
  if (q.race !== "any") {
    // The API reads race as [column, minimum percent].
    params.push(`race=${q.race}`);
    params.push(`race=${q.racePercent}`);
  }
  if (q.fstartswith)
    params.push(`fstartswith=${encodeURIComponent(q.fstartswith)}`);
  if (q.sstartswith)
    params.push(`sstartswith=${encodeURIComponent(q.sstartswith)}`);
  params.push(`limit=${PAGE_SIZE}`);
  return `${apiUrl}/api/names?${params.join("&")}`;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** “Jo… C…”, “Jo…” or “C…”. Locks are shown as chips instead. */
function prefixes(q: Query): string | null {
  const p = [q.fstartswith, q.sstartswith]
    .filter((s) => s && !isLock(s))
    .map((s) => `${s}…`)
    .join(" ");
  return p ? `“${p}”` : null;
}

/** e.g. Female · Common · 1996 · “Jo… C…” */
export function summarize(q: Query): string {
  return [
    q.gender === "any" ? "Any gender" : cap(q.gender),
    q.rank === "high" ? "Common" : q.rank === "low" ? "Rare" : null,
    q.year ? String(q.year) : null,
    prefixes(q),
    // Surname frequency defaults to Common, so it only appears when changed.
    q.frequency === "medium"
      ? "Medium surnames"
      : q.frequency === "low"
        ? "Rare surnames"
        : q.frequency === "any"
          ? "Any surname"
          : null,
    q.race !== "any" ? `>${q.racePercent}% ${raceLabel(q.race)} surnames` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
