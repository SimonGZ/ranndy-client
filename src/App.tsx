import React, { useState, useEffect, useRef, useCallback } from "react";
import { Name, NamePair } from "./types"; // Import new types
import InfiniteScroll from "react-infinite-scroll-component";
import NameDrawer from "./components/NameDrawer";
import Filters from "./components/Filters";
import NameSkeleton from "./components/NameSkeleton";
import { useTheme } from "./ThemeContext";
import { Moon, Sun, Filter, X, Heart } from "lucide-react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import "./App.css";
import "./dropdown-custom.css";
import "react-widgets/styles.css";

interface Query {
  rank: "any" | "high" | "low";
  frequency: "any" | "high" | "medium" | "low";
  gender: "any" | "male" | "female";
  year: number;
  race: string;
  racePercent: number;
  fstartswith: string;
  sstartswith: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const DEFAULT_QUERY: Query = {
  rank: "high",
  frequency: "high",
  gender: "female",
  year: 0, // 0 means 'any'
  race: "any",
  racePercent: 50,
  fstartswith: "",
  sstartswith: "",
};

function App() {
  const [names, setNames] = useState<Name[]>([]);
  const [rawData, setRawData] = useState<NamePair[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Initialize query state from URL parameters or use defaults
  const [query, setQuery] = useState<Query>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlQuery: Partial<Query> = {};

    // Parse parameters and override defaults
    // Add basic validation for known enum values and numbers
    const rank = params.get("r");
    if (rank && (rank === "any" || rank === "high" || rank === "low"))
      urlQuery.rank = rank;

    const frequency = params.get("f");
    if (
      frequency &&
      (frequency === "any" ||
        frequency === "high" ||
        frequency === "medium" ||
        frequency === "low")
    )
      urlQuery.frequency = frequency;

    const gender = params.get("g");
    if (
      gender &&
      (gender === "any" || gender === "male" || gender === "female")
    )
      urlQuery.gender = gender;

    const year = parseInt(params.get("y") || "", 10);
    if (!isNaN(year)) urlQuery.year = year;

    const race = params.get("rc");
    // Assuming valid race values are handled by the backend/Filters component
    if (race) urlQuery.race = race;

    const racePercent = parseInt(params.get("rp") || "", 10);
    if (!isNaN(racePercent)) urlQuery.racePercent = racePercent;

    const fstartswith = params.get("fs");
    if (fstartswith !== null) urlQuery.fstartswith = fstartswith;

    const sstartswith = params.get("ss");
    if (sstartswith !== null) urlQuery.sstartswith = sstartswith;

    // Merge URL parameters with defaults
    return { ...DEFAULT_QUERY, ...urlQuery };
  });

  const scrollTimeoutRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedNamePair, setSelectedNamePair] = useState<NamePair | null>(
    null,
  );

  const [activeChartType, setActiveChartType] = useState<
    "none" | "history" | "race"
  >("race"); // Default to race chart open

  const [favorites, setFavorites] = useLocalStorage<Name[]>("favorites", []);
  const [showFavorites, setShowFavorites] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(() => {
    // Check if we're on mobile or desktop at initial load
    return window.matchMedia("(min-width: 640px)").matches;
  });

  // Handler functions
  const handleNameClick = (name: Name) => {
    // Find the corresponding raw data pair
    const clickedPair = rawData.find(
      (pair) => pair[0]?.name === name.first && pair[1]?.name === name.last,
    );
    setSelectedNamePair(clickedPair || null);
    // When a new name is clicked, the drawer will open with the chart type
    // currently stored in activeChartType (defaulting to 'race' or last chosen)
  };

  const handleDrawerClose = () => {
    setSelectedNamePair(null);
  };

  const handleFavorite = (name: Name) => {
    const isFavorite = favorites.some(
      (f) => f.first === name.first && f.last === name.last,
    );

    if (isFavorite) {
      setFavorites(
        favorites.filter((f) => f.first !== name.first || f.last !== name.last),
      );
    } else {
      setFavorites([...favorites, name]);
    }
  };

  const handleClearFavorites = () => {
    if (favorites.length === 0) return; // No need to confirm if there's nothing to clear

    if (
      window.confirm(
        "Are you sure you want to clear all favorites? This cannot be undone.",
      )
    ) {
      setFavorites([]);
    }
  };

  const handleLockFirst = useCallback((name: Name) => {
    setQuery((prev) => {
      const isCurrentlyLocked = prev.fstartswith === name.first + "^";
      return {
        ...prev,
        fstartswith: isCurrentlyLocked ? "" : name.first + "^",
      };
    });
  }, []);

  const handleLockLast = useCallback((name: Name) => {
    setQuery((prev) => {
      const isCurrentlyLocked = prev.sstartswith === name.last + "^";
      return {
        ...prev,
        sstartswith: isCurrentlyLocked ? "" : name.last + "^",
      };
    });
  }, []);

  const isNameFavorite = (name: Name) => {
    return favorites.some(
      (f) => f.first === name.first && f.last === name.last,
    );
  };

  const isFirstNameLocked = (name: Name) => {
    return query.fstartswith === name.first + "^";
  };

  const isLastNameLocked = (name: Name) => {
    return query.sstartswith === name.last + "^";
  };

  const handleFavoriteClick = (name: Name, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the drawer
    handleFavorite(name);
  };

  const getNames = async (isInitial: boolean = false) => {
    if (isInitial) {
      setLoading(true);
    }

    setError(null);
    try {
      let url = `${API_URL}/api/names?`;
      const params = [];

      if (query.rank !== "any") params.push(`rank=${query.rank}`);
      if (query.frequency !== "any")
        params.push(`frequency=${query.frequency}`);
      if (query.gender !== "any") params.push(`gender=${query.gender}`);
      params.push(`year=${query.year}`);
      if (query.race !== "any") {
        params.push(`race=${query.race}`);
        params.push(`race=${query.racePercent}`);
      }
      if (query.fstartswith) params.push(`fstartswith=${query.fstartswith}`);
      if (query.sstartswith) params.push(`sstartswith=${query.sstartswith}`);
      params.push("limit=50");

      url += params.join("&");

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.message || "API Error");
      }

      const data = await response.json();
      const newRawData: NamePair[] = data.names; // Store the raw data

      const newNames: Name[] = newRawData.map((item) => ({
        first: item[0] ? item[0].name : "NoneMatching",
        last: item[1] ? item[1].name : "NoneMatching",
        gender: item[0] ? item[0].gender : "NoneMatching", // Gender is on the first name object
      }));

      // If this is an initial load (from filter change), replace the names and raw data
      // Otherwise, append the new names and raw data to the existing lists
      setNames((prevNames) =>
        isInitial ? newNames : [...prevNames, ...newNames],
      );
      setRawData((prevRawData) =>
        isInitial ? newRawData : [...prevRawData, ...newRawData],
      );
      setLoading(false);

      // Set hasMore based on whether we got a full page of results
      setHasMore(newNames.length === 50);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      console.error("Error fetching names:", err);
    }
  };

  // Initial load when filters change
  useEffect(() => {
    getNames(true);
  }, [query]);

  // Effect to synchronize query state with URL parameters
  useEffect(() => {
    const params = new URLSearchParams();

    // Add parameters if they differ from defaults or are non-empty strings
    if (query.rank !== DEFAULT_QUERY.rank) params.set("r", query.rank);
    if (query.frequency !== DEFAULT_QUERY.frequency)
      params.set("f", query.frequency);
    if (query.gender !== DEFAULT_QUERY.gender) params.set("g", query.gender);
    // Only include year if it's not the default 0
    if (query.year !== DEFAULT_QUERY.year)
      params.set("y", query.year.toString());
    if (query.race !== DEFAULT_QUERY.race) {
      params.set("rc", query.race);
      // Only include racePercent if race is not 'any' AND it's not the default 50
      if (query.racePercent !== DEFAULT_QUERY.racePercent)
        params.set("rp", query.racePercent.toString());
    }
    if (query.fstartswith) params.set("fs", query.fstartswith);
    if (query.sstartswith) params.set("ss", query.sstartswith);

    const newSearch = params.toString() ? `?${params.toString()}` : "";

    // Use replaceState to avoid cluttering history with every filter change
    // Only update if the search string has actually changed
    if (window.location.search !== newSearch) {
      history.replaceState(
        null,
        "",
        `${window.location.pathname}${newSearch}${window.location.hash}`,
      );
    }
  }, [query]);

  // Effect to listen for popstate event (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlQuery: Partial<Query> = {};

      // Parse parameters similar to initial state logic
      const rank = params.get("r");
      if (rank && (rank === "any" || rank === "high" || rank === "low"))
        urlQuery.rank = rank;

      const frequency = params.get("f");
      if (
        frequency &&
        (frequency === "any" ||
          frequency === "high" ||
          frequency === "medium" ||
          frequency === "low")
      )
        urlQuery.frequency = frequency;

      const gender = params.get("g");
      if (
        gender &&
        (gender === "any" || gender === "male" || gender === "female")
      )
        urlQuery.gender = gender;

      const year = parseInt(params.get("y") || "", 10);
      if (!isNaN(year)) urlQuery.year = year;

      const race = params.get("rc");
      if (race) urlQuery.race = race;

      const racePercent = parseInt(params.get("rp") || "", 10);
      if (!isNaN(racePercent)) urlQuery.racePercent = racePercent;

      const fstartswith = params.get("fs");
      if (fstartswith !== null) urlQuery.fstartswith = fstartswith;

      const sstartswith = params.get("ss");
      if (sstartswith !== null) urlQuery.sstartswith = sstartswith;

      // Update state - this will trigger the getNames effect
      setQuery((prev) => ({ ...prev, ...urlQuery }));
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []); // Empty dependency array means this runs once on mount/unmount

  // Handle scrolling separately
  useEffect(() => {
    // Clear any existing timeout
    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current);
    }

    // Set a new timeout to scroll after a brief delay
    scrollTimeoutRef.current = window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);

    // Cleanup
    return () => {
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [query]);

  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className="min-h-screen font-sans bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4 max-w-5xl">
        <header className="bg-sky-700 dark:bg-sky-900 text-white p-4 rounded-t-lg flex justify-between items-center">
          <h1 className="text-2xl font-bold">Name Generator</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg hover:bg-sky-600 dark:hover:bg-sky-800 transition-colors"
              aria-label="Toggle filters"
            >
              <Filter size={24} className={showFilters ? "fill-current" : ""} />
            </button>
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className="p-2 rounded-lg hover:bg-sky-600 dark:hover:bg-sky-800 transition-colors relative group"
              aria-label="Toggle favorites"
            >
              <Heart
                size={24}
                className={showFavorites ? "fill-current" : ""}
              />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-sky-600 dark:hover:bg-sky-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 sm:gap-4">
          {/* Sidebar Container */}
          <div
            className={`
              ${showFilters || showFavorites ? "block sm:flex sm:flex-col" : "hidden"}
              sm:sticky sm:top-2
              bg-white dark:bg-gray-800
              p-4 rounded-lg shadow
              transition-all duration-300
              sm:max-h-[calc(100vh-2rem)]
              `}
          >
            {/* Filters Content */}
            <div
              className={`
                ${showFilters ? "block" : "hidden"}
                sm:overflow-auto
                ${showFavorites ? "sm:max-h-[60vh]" : "sm:max-h-[calc(100vh-2rem)]"}
                `}
            >
              <Filters
                query={query}
                onQueryChange={(newQueryValues) => {
                  setQuery((prev) => ({
                    ...prev,
                    ...newQueryValues,
                  }));
                }}
                onClose={() => setShowFilters(false)}
              />
            </div>

            <div
              className={`
    ${showFavorites ? "block sm:flex sm:flex-col" : "hidden"}
    dark:border-gray-700
    px-4
    ${showFilters ? "sm:h-[30vh] border-t mt-4 pt-4" : "sm:h-[calc(100vh-2rem)]"}
    `}
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold dark:text-white mb-4">
                  Favorites ({favorites.length})
                </h2>
                <button
                  onClick={() => setShowFavorites(false)}
                  className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Close favorites"
                >
                  <X size={24} className="text-gray-700 dark:text-white" />
                </button>
              </div>

              {favorites.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No favorites yet
                </p>
              ) : (
                <>
                  <div className="space-y-2 overflow-y-auto flex-1">
                    {favorites.map((name, index) => (
                      <div
                        key={index}
                        onClick={() => handleNameClick(name)}
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <span className="dark:text-white">
                          {name.first} {name.last}
                        </span>
                        <button
                          onClick={(e) => handleFavoriteClick(name, e)}
                          className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300"
                          aria-label={`Remove ${name.first} ${name.last} from favorites`}
                        >
                          <Heart size={20} className="fill-current" />
                        </button>
                      </div>
                    ))}
                    {/* Clear Favorites Button */}
                    <div className="mt-2 pt-2">
                      <button
                        onClick={handleClearFavorites}
                        className="cursor-pointer w-full py-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 text-sm font-medium rounded-md transition-colors"
                        aria-label="Clear favorites"
                      >
                        Clear Favorites
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* End Sidebar */}

          {/* Names List */}
          <div
            className={`
            bg-white dark:bg-gray-800
            p-4 rounded-lg shadow
            ${!showFilters && !showFavorites ? "col-span-full px-4" : "col-span-2"}
          `}
          >
            <h2 className="text-lg font-semibold mb-4 dark:text-white">
              Generated Names
            </h2>
            {error && <div className="text-red-500 mb-4">{error}</div>}

            <InfiniteScroll
              dataLength={names.length}
              next={() => getNames(false)}
              hasMore={hasMore}
              loader={
                <div className="text-center p-4 dark:text-gray-300">
                  Loading more names...
                </div>
              }
              endMessage={
                <div className="text-center p-4 text-gray-500 dark:text-gray-400">
                  No more names to load.
                </div>
              }
            >
              {loading ? (
                <NameSkeleton count={50} />
              ) : (
                <div className="text-center font-semibold text-2xl">
                  {names.map((name, index) => (
                    <div
                      key={index}
                      onClick={() => handleNameClick(name)}
                      className={
                        index % 2 === 0
                          ? "cursor-pointer p-3 bg-gray-50 hover:bg-blue-500 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 last:border-none dark:text-white"
                          : "cursor-pointer p-3 border-b border-gray-200 hover:bg-blue-500 dark:border-gray-600 last:border-none dark:text-white"
                      }
                    >
                      {name.first} {name.last}
                    </div>
                  ))}
                </div>
              )}
            </InfiniteScroll>
          </div>
        </div>
        {/* Drawer component with all necessary props */}
        <NameDrawer
          namePair={selectedNamePair} // Pass the full name pair
          isOpen={!!selectedNamePair}
          onClose={handleDrawerClose}
          // Pass the simplified Name object to handlers that only need it
          onFavorite={
            selectedNamePair ? (name) => handleFavorite(name) : () => {} // Provide a no-op function if no name is selected
          }
          onLockFirst={
            selectedNamePair ? (name) => handleLockFirst(name) : () => {} // Provide a no-op function if no name is selected
          }
          onLockLast={
            selectedNamePair ? (name) => handleLockLast(name) : () => {} // Provide a no-op function if no name is selected
          }
          // Check favorite/locked status using the simplified Name object derived from the pair
          isFavorite={
            selectedNamePair
              ? isNameFavorite({
                  first: selectedNamePair[0]?.name || "NoneMatching",
                  last: selectedNamePair[1]?.name || "NoneMatching",
                  gender: selectedNamePair[0]?.gender || "NoneMatching",
                })
              : false
          }
          isFirstNameLocked={
            selectedNamePair
              ? isFirstNameLocked({
                  first: selectedNamePair[0]?.name || "NoneMatching",
                  last: selectedNamePair[1]?.name || "NoneMatching",
                  gender: selectedNamePair[0]?.gender || "NoneMatching",
                })
              : false
          }
          isLastNameLocked={
            selectedNamePair
              ? isLastNameLocked({
                  first: selectedNamePair[0]?.name || "NoneMatching",
                  last: selectedNamePair[1]?.name || "NoneMatching",
                  gender: selectedNamePair[0]?.gender || "NoneMatching",
                })
              : false
          }
          // Pass chart visibility state and setter
          activeChartType={activeChartType}
          setActiveChartType={setActiveChartType}
        />
      </div>
    </div>
  );
}

export default App;
