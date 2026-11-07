import { useEffect, useRef, useState } from "react";
import {
  Frequency,
  Gender,
  Query,
  RACES,
  Rank,
  isLock,
  lockedName,
  raceLabel,
} from "../lib/query";
import BirthYearField from "./BirthYearField";
import { FieldLabel, Pills, Segmented, inputClass } from "./ui";

interface FiltersProps {
  query: Query;
  onQueryChange: (changes: Partial<Query>) => void;
  /** Prefix for element ids, so the sidebar and the sheet can coexist. */
  idPrefix: string;
}

/** “Starts with” letters, debounced so typing doesn't fire a request per key. */
function StartsWith({
  id,
  value,
  onCommit,
  placeholder,
  kind,
}: {
  id: string;
  value: string;
  onCommit: (v: string) => void;
  placeholder: string;
  kind: "first names" | "surnames";
}) {
  const locked = lockedName(value);
  const [text, setText] = useState(locked ? "" : value);
  const timer = useRef<number | undefined>(undefined);

  // Follow changes made elsewhere (Clear letters, URL, the other panel).
  useEffect(() => {
    if (!isLock(value)) setText((t) => (t === value ? t : value));
  }, [value]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onInput = (v: string) => {
    setText(v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onCommit(v.trim()), 250);
  };

  return (
    <>
      <input
        id={id}
        type="search"
        className={inputClass}
        placeholder={locked ? "" : placeholder}
        autoComplete="off"
        disabled={!!locked}
        value={locked ? "" : text}
        onChange={(e) => onInput(e.target.value)}
      />
      {locked && (
        <p className="text-[0.76rem] leading-snug text-muted">
          Unlock <b className="font-semibold text-ink">{locked}</b> to filter{" "}
          {kind} by letters.
        </p>
      )}
    </>
  );
}

const Section = ({ title }: { title: string }) => (
  <h3 className="-mb-1 font-display text-[1rem] font-semibold text-ink">
    {title}
  </h3>
);

const Group = ({ children }: { children: React.ReactNode }) => (
  <div className="grid gap-1.5">{children}</div>
);

export default function Filters({ query, onQueryChange, idPrefix }: FiltersProps) {
  const id = (s: string) => `${idPrefix}-${s}`;
  const raceOptions = [
    { value: "any", label: "Any" },
    ...RACES.map((r) => ({ value: r.value as string, label: r.label })),
  ];

  return (
    <div className="grid gap-4">
      <Section title="First name" />
      <Group>
        <FieldLabel>Gender</FieldLabel>
        <Segmented<Gender>
          label="Gender"
          value={query.gender}
          onChange={(gender) => onQueryChange({ gender })}
          options={[
            { value: "any", label: "Any" },
            { value: "female", label: "Female" },
            { value: "male", label: "Male" },
          ]}
        />
      </Group>
      <Group>
        <FieldLabel>Popularity</FieldLabel>
        <Segmented<Rank>
          label="First name popularity"
          value={query.rank}
          onChange={(rank) => onQueryChange({ rank })}
          options={[
            { value: "any", label: "Any" },
            { value: "high", label: "Common" },
            { value: "low", label: "Rare" },
          ]}
        />
      </Group>
      <Group>
        <FieldLabel htmlFor={id("year")}>Born in</FieldLabel>
        <BirthYearField
          id={id("year")}
          year={query.year}
          onChange={(year) => onQueryChange({ year })}
        />
      </Group>
      <Group>
        <FieldLabel htmlFor={id("fs")}>Starts with</FieldLabel>
        <StartsWith
          id={id("fs")}
          value={query.fstartswith}
          onCommit={(fstartswith) => onQueryChange({ fstartswith })}
          placeholder="e.g. Jo"
          kind="first names"
        />
      </Group>

      <hr className="border-line" />

      <Section title="Surname" />
      <Group>
        <FieldLabel>Frequency</FieldLabel>
        <Segmented<Frequency>
          label="Surname frequency"
          value={query.frequency}
          onChange={(frequency) => onQueryChange({ frequency })}
          options={[
            { value: "any", label: "Any" },
            { value: "high", label: "Common" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Rare" },
          ]}
        />
      </Group>
      <Group>
        <FieldLabel>Race / ethnicity</FieldLabel>
        <Pills<string>
          label="Surname race or ethnicity"
          value={query.race}
          onChange={(race) => onQueryChange({ race })}
          options={raceOptions}
        />
        {query.race !== "any" && (
          <div className="grid gap-1 pt-1">
            <div className="flex justify-between gap-2 text-[0.82rem] text-muted">
              <label htmlFor={id("pct")}>At least</label>
              <output htmlFor={id("pct")} className="font-semibold text-ink tabular-nums">
                {query.racePercent}% {raceLabel(query.race)}
              </output>
            </div>
            <input
              id={id("pct")}
              type="range"
              min={0}
              max={99}
              value={query.racePercent}
              onChange={(e) =>
                onQueryChange({ racePercent: parseInt(e.target.value, 10) })
              }
              className="w-full"
            />
            <p className="text-[0.76rem] leading-snug text-muted">
              Surnames where at least this share of people identify as{" "}
              {raceLabel(query.race)}, from Census data.
            </p>
          </div>
        )}
      </Group>
      <Group>
        <FieldLabel htmlFor={id("ss")}>Starts with</FieldLabel>
        <StartsWith
          id={id("ss")}
          value={query.sstartswith}
          onCommit={(sstartswith) => onQueryChange({ sstartswith })}
          placeholder="e.g. Mac"
          kind="surnames"
        />
      </Group>
    </div>
  );
}
