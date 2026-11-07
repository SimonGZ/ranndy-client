import { useCallback, useEffect, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { Moon, SlidersHorizontal, Sun } from "lucide-react";
import { Name, NamePair } from "./types";
import {
  DEFAULT_QUERY,
  PAGE_SIZE,
  Query,
  isLock,
  lockValue,
  lockedName,
  namesUrl,
  parseQuery,
  summarize,
  toSearch,
} from "./lib/query";
import { useTheme } from "./useTheme";
import { API_URL, getJson } from "./lib/api";
import { useMediaQuery } from "./hooks/useMediaQuery";
import Filters from "./components/Filters";
import FilterSheet from "./components/FilterSheet";
import NameDrawer from "./components/NameDrawer";
import NameRow from "./components/NameRow";
import NameSkeleton from "./components/NameSkeleton";
import { EmptyState, EndOfList, ErrorState } from "./components/States";
import { LockChip, Wordmark } from "./components/ui";

type Status = "loading" | "ready" | "error";
interface NoMatch {
  first: boolean;
  last: boolean;
}

const toName = (p: NamePair): Name => ({
  first: p[0]?.name ?? "",
  last: p[1]?.name ?? "",
  gender: p[0]?.gender ?? "",
});

function App() {
  const [query, setQuery] = useState<Query>(() => parseQuery(window.location.search));
  const [pairs, setPairs] = useState<NamePair[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [noMatch, setNoMatch] = useState<NoMatch | null>(null);

  const [selected, setSelected] = useState<NamePair | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);

  const isDesktop = useMediaQuery("(min-width: 640px)");
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  const { isDarkMode, toggleDarkMode } = useTheme();

  const abortRef = useRef<AbortController | null>(null);

  const updateQuery = useCallback((changes: Partial<Query>) => {
    setQuery((prev) => ({ ...prev, ...changes }));
  }, []);

  const showToast = useCallback((text: string) => {
    setToast({ text, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(t);
  }, [toast]);

  // ---------- fetching ----------
  const fetchPage = useCallback(async (q: Query, initial: boolean) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (initial) {
      // Drop the old results now, so a failed request for new filters can
      // never leave names from the previous filters on screen.
      setPairs([]);
      setNoMatch(null);
      setStatus("loading");
    }
    setError(null);

    try {
      const body = await getJson<{ names?: NamePair[] }>(namesUrl(API_URL, q), controller.signal);
      const page = body.names ?? [];
      // With no match, the API echoes the typed prefix back without an id.
      const valid = page.filter((p) => p[0]?.id && p[1]?.id);

      if (initial) {
        setPairs(valid);
        setNoMatch(
          valid.length === 0
            ? {
                first: page.length > 0 && page.every((p) => !p[0]?.id),
                last: page.length > 0 && page.every((p) => !p[1]?.id),
              }
            : null,
        );
      } else {
        setPairs((prev) => [...prev, ...valid]);
      }
      setHasMore(page.length === PAGE_SIZE && valid.length > 0);
      setStatus("ready");
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error("Error fetching names:", err);
      setError((err as Error).message);
      setStatus("error");
      setHasMore(false);
    }
  }, []);

  useEffect(() => {
    void fetchPage(query, true);
    setExpandedIndex(null);
    return () => abortRef.current?.abort();
  }, [query, fetchPage]);

  // ---------- URL sync ----------
  useEffect(() => {
    const search = toSearch(query);
    if (window.location.search !== search) {
      history.replaceState(null, "", `${window.location.pathname}${search}${window.location.hash}`);
    }
  }, [query]);

  useEffect(() => {
    const onPop = () => setQuery(parseQuery(window.location.search));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // New filters start at the top of the list.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
  }, [query]);

  // ---------- actions ----------
  const lockedFirst = lockedName(query.fstartswith);
  const lockedLast = lockedName(query.sstartswith);

  const copyName = async (name: Name) => {
    const text = `${name.first} ${name.last}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Copied “${text}”`);
    } catch {
      showToast("Couldn’t copy. Select the name and copy it instead.");
    }
  };

  const toggleLockFirst = (name: Name) => {
    const locked = query.fstartswith === lockValue(name.first);
    updateQuery({ fstartswith: locked ? "" : lockValue(name.first) });
    showToast(locked ? `Unlocked “${name.first}”` : `Locked first name “${name.first}”`);
  };

  const toggleLockLast = (name: Name) => {
    const locked = query.sstartswith === lockValue(name.last);
    updateQuery({ sstartswith: locked ? "" : lockValue(name.last) });
    showToast(locked ? `Unlocked “${name.last}”` : `Locked surname “${name.last}”`);
  };

  const lockChips = (lockedFirst || lockedLast) && (
    <>
      {lockedFirst && (
        <LockChip name={lockedFirst} onUnlock={() => updateQuery({ fstartswith: "" })} />
      )}
      {lockedLast && (
        <LockChip name={lockedLast} onUnlock={() => updateQuery({ sstartswith: "" })} />
      )}
    </>
  );

  // ---------- list body ----------
  const renderEmpty = () => {
    const firstLetters = !isLock(query.fstartswith) && query.fstartswith;
    const lastLetters = !isLock(query.sstartswith) && query.sstartswith;
    if (noMatch?.first && lockedFirst) {
      return (
        <EmptyState
          title={`No names with “${lockedFirst}” match these filters`}
          body="The locked first name isn’t in the data for this gender or birth year."
          action={`Unlock ${lockedFirst}`}
          onAction={() => updateQuery({ fstartswith: "" })}
        />
      );
    }
    if (noMatch?.first && firstLetters) {
      return (
        <EmptyState
          mark={`“${firstLetters}…”`}
          title={`No first names start with “${firstLetters}”`}
          body="Try fewer letters, or set Popularity to Any to include rarer names."
          action="Clear letters"
          onAction={() => updateQuery({ fstartswith: "" })}
        />
      );
    }
    if (noMatch?.last && lastLetters) {
      return (
        <EmptyState
          mark={`“${lastLetters}…”`}
          title={`No surnames start with “${lastLetters}”`}
          body="Try fewer letters, or set Frequency to Any to include rarer surnames."
          action="Clear letters"
          onAction={() => updateQuery({ sstartswith: "" })}
        />
      );
    }
    return (
      <EmptyState
        title="No names match these filters"
        body="Try setting one of the filters back to Any."
        action="Reset filters"
        onAction={() => setQuery(DEFAULT_QUERY)}
      />
    );
  };

  const renderList = () => {
    if (status === "loading") return <NameSkeleton count={14} />;
    if (status === "error" && pairs.length === 0)
      return <ErrorState detail={error ?? undefined} onRetry={() => void fetchPage(query, true)} />;
    if (pairs.length === 0) return renderEmpty();

    return (
      <InfiniteScroll
        dataLength={pairs.length}
        next={() => void fetchPage(query, false)}
        hasMore={hasMore}
        loader={<p className="py-4 text-center text-[0.85rem] text-muted">Loading more names…</p>}
        endMessage={status === "error" ? null : <EndOfList />}
        style={{ overflow: "visible" }}
      >
        <ul className={canHover ? "grid grid-cols-[minmax(0,1fr)] gap-px p-2" : ""}>
          {pairs.map((pair, i) => {
            const name = toName(pair);
            return (
              <NameRow
                key={`${i}-${name.first}-${name.last}`}
                name={name}
                lockedFirst={!!lockedFirst}
                lockedLast={!!lockedLast}
                expanded={expandedIndex === i}
                canHover={canHover}
                onToggle={() => setExpandedIndex(expandedIndex === i ? null : i)}
                onOpen={() => setSelected(pair)}
                onCopy={() => void copyName(name)}
                onLockFirst={() => toggleLockFirst(name)}
                onLockLast={() => toggleLockLast(name)}
              />
            );
          })}
        </ul>
        {status === "error" && (
          <ErrorState compact detail={error ?? undefined} onRetry={() => void fetchPage(query, false)} />
        )}
      </InfiniteScroll>
    );
  };

  const selectedName = selected ? toName(selected) : null;
  const iconButton =
    "grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-muted hover:bg-sunk hover:text-ink focus-visible:outline-2 focus-visible:outline-accent";

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-1 pr-2.5 pl-[max(1rem,env(safe-area-inset-left))] sm:px-6">
          <h1 className="text-[1.45rem] leading-none">
            <Wordmark />
          </h1>
          <span className="flex-1" />
          <button
            type="button"
            className={iconButton}
            onClick={() => (isDesktop ? setShowSidebar(!showSidebar) : setSheetOpen(true))}
            aria-label={isDesktop ? (showSidebar ? "Hide filters" : "Show filters") : "Edit filters"}
            aria-pressed={isDesktop ? showSidebar : undefined}
          >
            <SlidersHorizontal size={19} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={iconButton}
            onClick={toggleDarkMode}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
          </button>
        </div>

        {/* Phones: one summary line instead of an open sidebar */}
        <div className="grid gap-1.5 px-4 pb-2.5 sm:hidden">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex min-w-0 cursor-pointer items-center gap-1.5 py-1 text-left text-[0.86rem] font-medium text-ink"
            aria-label={`Filters: ${summarize(query)}. Edit filters`}
          >
            <SlidersHorizontal size={15} className="shrink-0 text-muted" aria-hidden="true" />
            <span className="truncate">{summarize(query)}</span>
          </button>
          {lockChips && <div className="flex flex-wrap gap-1.5">{lockChips}</div>}
        </div>
      </header>

      <div className="mx-auto max-w-5xl sm:flex sm:gap-6 sm:px-6 sm:py-6">
        {isDesktop && showSidebar && (
          <aside
            aria-label="Filters"
            className="sticky top-20 max-h-[calc(100dvh-6.5rem)] w-72 shrink-0 self-start overflow-y-auto rounded-xl border border-line bg-surface p-5"
          >
            <Filters query={query} onQueryChange={updateQuery} idPrefix="side" />
          </aside>
        )}

        <main className="min-w-0 flex-1">
          {isDesktop && lockChips && <div className="mb-3 flex flex-wrap gap-1.5">{lockChips}</div>}
          <div className="sm:rounded-xl sm:border sm:border-line sm:bg-surface" aria-busy={status === "loading"}>
            {renderList()}
          </div>
        </main>
      </div>

      {!isDesktop && (
        <FilterSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          query={query}
          onQueryChange={updateQuery}
        />
      )}

      <NameDrawer
        namePair={selected}
        onClose={() => setSelected(null)}
        onCopy={() => selectedName && void copyName(selectedName)}
        onLockFirst={() => selectedName && toggleLockFirst(selectedName)}
        onLockLast={() => selectedName && toggleLockLast(selectedName)}
        isFirstNameLocked={!!selectedName && query.fstartswith === lockValue(selectedName.first)}
        isLastNameLocked={!!selectedName && query.sstartswith === lockValue(selectedName.last)}
        birthYear={query.year}
      />

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-4"
      >
        {toast && (
          <span
            key={toast.id}
            className="max-w-full truncate rounded-lg bg-ink px-3.5 py-2 text-[0.85rem] text-paper shadow-lg"
          >
            {toast.text}
          </span>
        )}
      </div>
    </div>
  );
}

export default App;
