import { type ReactNode, useEffect, useMemo, useState } from "react";
import { NameHistory } from "../types";

import { API_URL, getJson } from "../lib/api";

// History rarely changes, so keep it for the session.
const cache = new Map<string, NameHistory[]>();

function useNameHistory(name: string, gender: "male" | "female") {
  const key = `${name}|${gender}`;
  const [state, setState] = useState<{
    key: string;
    data: NameHistory[] | null;
    error: string | null;
  }>({ key, data: cache.get(key) ?? null, error: null });

  useEffect(() => {
    if (cache.has(key)) {
      setState({ key, data: cache.get(key)!, error: null });
      return;
    }
    setState({ key, data: null, error: null });
    const controller = new AbortController();
    getJson<{ history?: NameHistory[] }>(
      `${API_URL}/api/firstnames/history?name=${encodeURIComponent(name)}&gender=${gender}`,
      controller.signal,
    )
      .then((body) => {
        const history = [...(body.history ?? [])].sort((a, b) => a.year - b.year);
        cache.set(key, history);
        setState({ key, data: history, error: null });
      })
      .catch((err: Error) => {
        if (!controller.signal.aborted) setState({ key, data: null, error: err.message });
      });
    return () => controller.abort();
  }, [key, name, gender]);

  return state.key === key ? state : { key, data: null, error: null };
}

const W = 320;
const PAD_L = 48;
const PAD_R = 10;
const PAD_B = 20;

export default function PopularityChart({
  firstName,
  gender,
  birthYear,
}: {
  firstName: string;
  gender: "male" | "female";
  birthYear: number;
}) {
  const { data, error } = useNameHistory(firstName, gender);
  const [expanded, setExpanded] = useState(false);
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const H = expanded ? 200 : 118;

  const geometry = useMemo(() => {
    if (!data || data.length === 0) return null;
    const first = data[0].year;
    const last = data[data.length - 1].year;
    const decades = data.filter((d) => d.year % 10 === 0);
    const points = expanded || decades.length < 3 ? data : decades;
    const padT = 28;
    const ranks = data.map((d) => d.rank);
    const lo = Math.log(Math.max(1, Math.min(...ranks) * 0.8));
    const hi = Math.log(Math.max(...ranks) * 1.25);
    const x = (year: number) =>
      PAD_L + ((year - first) / Math.max(1, last - first)) * (W - PAD_L - PAD_R);
    const y = (rank: number) =>
      padT + ((Math.log(rank) - lo) / Math.max(0.0001, hi - lo)) * (H - padT - PAD_B);
    const inside = (r: number) => Math.log(r) >= lo && Math.log(r) <= hi;
    let gridRanks = [1, 10, 100, 1000, 10000].filter(inside);
    if (gridRanks.length < 2) {
      // Narrow range: add 2× and 5× steps so there are at least two lines.
      gridRanks = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]
        .filter(inside)
        .slice(0, 4);
    }
    const yearTicks = expanded
      ? [first, ...[1920, 1960, 2000].filter((t) => t > first + 12 && t < last - 12), last]
      : [first, last];
    return { first, last, points, padT, x, y, gridRanks, yearTicks };
  }, [data, expanded, H]);

  const loading = !data && !error;
  const unavailable = !geometry && !loading;

  const renderFrame = (plot: ReactNode) => (
    <div className="grid min-w-0 gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[0.72rem] font-semibold uppercase tracking-[0.07em] text-muted">
          {firstName} · rank {expanded ? "every year" : "by decade"}
        </h3>
        <button
          type="button"
          aria-expanded={expanded}
          disabled={!geometry}
          onClick={() => {
            setExpanded(!expanded);
            setHoverYear(null);
          }}
          className={`cursor-pointer text-[0.82rem] font-medium text-accent enabled:hover:underline disabled:cursor-default disabled:text-muted ${unavailable ? "invisible" : ""}`}
        >
          {expanded ? "Show by decade" : "Show every year"}
        </button>
      </div>
      {plot}
      <p className={`text-[0.75rem] text-muted ${unavailable ? "invisible" : ""}`}>
        Lower is more popular. Log scale. Source: U.S. Social Security baby name data.
      </p>
    </div>
  );

  if (!data || !geometry) {
    const message = error
      ? `Couldn’t load the popularity history. ${error}`
      : `No popularity history for ${firstName}.`;
    return renderFrame(
      <div
        className={`w-full min-w-0 ${loading ? "rounded-md bg-sunk" : "break-words text-[0.85rem] text-muted"}`}
        style={{ aspectRatio: `${W} / ${H}` }}
      >
        {loading ? (
          <span className="sr-only" role="status">Loading popularity…</span>
        ) : message}
      </div>,
    );
  }

  const { first, last, points, padT, x, y, gridRanks, yearTicks } = geometry;
  const byYear = new Map(data.map((d) => [d.year, d]));
  const peak = data.reduce((a, b) => (b.rank < a.rank ? b : a));
  const latest = data[data.length - 1];
  const markYear = birthYear >= first && birthYear <= last ? birthYear : null;
  const readoutYear = hoverYear ?? markYear ?? latest.year;
  const readout = byYear.get(readoutYear);

  const line = points.map((d) => `${x(d.year).toFixed(1)},${y(d.rank).toFixed(1)}`).join(" ");
  const area = `${x(points[0].year)},${H - PAD_B} ${line} ${x(points[points.length - 1].year)},${H - PAD_B}`;

  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const year = first + ((px - PAD_L) / (W - PAD_L - PAD_R)) * (last - first);
    if (expanded) {
      setHoverYear(Math.max(first, Math.min(last, Math.round(year))));
    } else {
      const nearest = points.reduce((closest, point) =>
        Math.abs(point.year - year) < Math.abs(closest.year - year) ? point : closest,
      );
      setHoverYear(nearest.year);
    }
  };

  return renderFrame(
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full touch-pan-y cursor-crosshair"
        role="img"
        aria-label={`${firstName} peaked at #${peak.rank} in ${peak.year}; #${latest.rank} in ${latest.year}.`}
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        onPointerLeave={(e) => {
          if (e.pointerType !== "touch") setHoverYear(null);
        }}
        onPointerCancel={() => setHoverYear(null)}
      >
        {gridRanks.map((r) => (
          <g key={r}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(r)} y2={y(r)} stroke="var(--color-line)" />
            <text x={PAD_L - 6} y={y(r) + 4} textAnchor="end" fontSize="10" fill="var(--color-muted)">
              #{r.toLocaleString()}
            </text>
          </g>
        ))}
        <polygon points={area} fill="var(--color-accent)" fillOpacity="0.12" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={expanded ? 1.6 : 2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {yearTicks.map((t, i) => (
          <text
            key={t}
            x={x(t)}
            y={H - 5}
            textAnchor={i === 0 ? "start" : i === yearTicks.length - 1 ? "end" : "middle"}
            fontSize="10"
            fill="var(--color-muted)"
          >
            {t}
          </text>
        ))}
        {markYear && (
          <>
            <line
              x1={x(markYear)}
              x2={x(markYear)}
              y1={padT}
              y2={H - PAD_B}
              stroke="var(--color-ink)"
              strokeOpacity="0.35"
              strokeDasharray="3 3"
            />
            {!expanded && (
              <text
                x={Math.min(x(markYear) + 4, W - PAD_R - 26)}
                y={padT + 9}
                fontSize="10"
                fill="var(--color-muted)"
              >
                {markYear}
              </text>
            )}
          </>
        )}
        {expanded || hoverYear !== null ? (
          <>
            <line
              x1={x(readoutYear)}
              x2={x(readoutYear)}
              y1={padT}
              y2={H - PAD_B}
              stroke="var(--color-accent)"
              strokeOpacity="0.5"
            />
            {readout && (
              <circle
                cx={x(readoutYear)}
                cy={y(readout.rank)}
                r="4"
                fill="var(--color-surface)"
                stroke="var(--color-accent)"
                strokeWidth="2"
              />
            )}
            <text x={PAD_L} y="14" fontSize="12" fontWeight="600" fill="var(--color-ink)">
              {readoutYear} · {readout ? `#${readout.rank.toLocaleString()}` : "not ranked"}
              {hoverYear === null && markYear === readoutYear ? "  (your filter year)" : ""}
            </text>
          </>
        ) : (
          <circle cx={x(latest.year)} cy={y(latest.rank)} r="3.5" fill="var(--color-accent)" />
        )}
      </svg>,
  );
}
