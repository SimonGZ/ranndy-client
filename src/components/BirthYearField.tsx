import { ReactNode, useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { MAX_YEAR, MIN_YEAR } from "../lib/query";
import { inputClass } from "./ui";

const THIS_YEAR = new Date().getFullYear();
const RANGE_MSG = `Ranndy has names from ${MIN_YEAR} to ${MAX_YEAR}.`;
const inRange = (y: number) => y >= MIN_YEAR && y <= MAX_YEAR;
const digits = (s: string) => s.replace(/\D/g, "");

/**
 * Birth year, typed directly or worked out from an age and the year the
 * story is set. The query only stores `year` (0 = any year).
 */
export default function BirthYearField({
  id,
  year,
  onChange,
}: {
  id: string;
  year: number;
  onChange: (year: number) => void;
}) {
  const [yearText, setYearText] = useState(year ? String(year) : "");
  const [storyText, setStoryText] = useState(String(THIS_YEAR));
  const [ageText, setAgeText] = useState(year ? String(THIS_YEAR - year) : "");
  const [message, setMessage] = useState<{ text: ReactNode; error?: boolean } | null>(null);

  const storyYear = parseInt(storyText, 10) || THIS_YEAR;

  // Follow changes made elsewhere (URL, back/forward, the other filter panel).
  useEffect(() => {
    const shown = parseInt(yearText, 10) || 0;
    if (shown !== year) {
      setYearText(year ? String(year) : "");
      setAgeText(year ? String(storyYear - year) : "");
      setMessage(null);
    }
    // Only react to the year prop; local edits are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const commit = (y: number) => {
    onChange(y);
    setYearText(y ? String(y) : "");
  };

  const onYearInput = (raw: string) => {
    const v = digits(raw).slice(0, 4);
    setYearText(v);
    setMessage(null);
    if (v === "") {
      setAgeText("");
      return onChange(0);
    }
    if (v.length < 4) return;
    const y = parseInt(v, 10);
    if (!inRange(y)) return setMessage({ text: RANGE_MSG, error: true });
    setAgeText(String(storyYear - y));
    onChange(y);
  };

  const fromAge = (ageRaw: string, inYear: number) => {
    if (ageRaw === "") {
      setMessage(null);
      setYearText("");
      return onChange(0);
    }
    const age = parseInt(ageRaw, 10);
    const born = inYear - age;
    if (!inRange(born)) {
      return setMessage({
        text: `Age ${age} in ${inYear} means born ${born}. ${RANGE_MSG}`,
        error: true,
      });
    }
    setMessage({
      text: (
        <>
          Age <b className="font-semibold text-ink">{age}</b> in {inYear} → born{" "}
          <b className="font-semibold text-ink">{born}</b>.
        </>
      ),
    });
    commit(born);
  };

  const onAgeInput = (raw: string) => {
    const v = digits(raw).slice(0, 3);
    setAgeText(v);
    fromAge(v, storyYear);
  };

  const onStoryInput = (raw: string) => {
    const v = digits(raw).slice(0, 4);
    setStoryText(v);
    if (v.length < 4) return;
    const inYear = parseInt(v, 10);
    if (ageText !== "") fromAge(ageText, inYear);
  };

  const step = (delta: number) => {
    const next = (year || 1990) + delta;
    if (!inRange(next)) return;
    setMessage(null);
    setAgeText(String(storyYear - next));
    commit(next);
  };

  const stepClass =
    "grid cursor-pointer place-items-center rounded-lg border border-line bg-surface text-ink hover:bg-sunk focus-visible:outline-2 focus-visible:outline-accent";
  const smallInput = `${inputClass} w-0 flex-1 px-1 text-center tabular-nums`;

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-[34px_1fr_34px] gap-1">
        <button type="button" className={stepClass} onClick={() => step(-1)} aria-label="One year earlier">
          <Minus size={15} aria-hidden="true" />
        </button>
        <input
          id={id}
          className={`${inputClass} text-center text-[1.05rem] font-semibold tabular-nums tracking-[0.04em]`}
          inputMode="numeric"
          placeholder="Any year"
          autoComplete="off"
          value={yearText}
          onChange={(e) => onYearInput(e.target.value)}
        />
        <button type="button" className={stepClass} onClick={() => step(1)} aria-label="One year later">
          <Plus size={15} aria-hidden="true" />
        </button>
      </div>
      <div className="flex items-center gap-1.5 text-[0.82rem] text-muted">
        <span>or age</span>
        <input
          className={`${smallInput} max-w-16`}
          inputMode="numeric"
          aria-label="Age"
          autoComplete="off"
          value={ageText}
          onChange={(e) => onAgeInput(e.target.value)}
        />
        <span>in</span>
        <input
          className={smallInput}
          inputMode="numeric"
          aria-label="Year the story is set"
          autoComplete="off"
          value={storyText}
          onChange={(e) => onStoryInput(e.target.value)}
        />
      </div>
      <p
        className={`text-[0.76rem] leading-snug ${message?.error ? "text-danger" : "text-muted"}`}
        aria-live="polite"
      >
        {message
          ? message.text
          : year
            ? <>Names given to babies born in <b className="font-semibold text-ink">{year}</b>.</>
            : "Leave blank for any year."}
      </p>
    </div>
  );
}
