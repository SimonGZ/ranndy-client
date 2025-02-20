import React, { useState, useEffect, useRef } from "react";
import { Name } from "./types";
import InfiniteScroll from "react-infinite-scroll-component";
import NameDrawer from "./components/NameDrawer";
import Filters from "./components/Filters";
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

function App() {
  const [names, setNames] = useState<Name[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [query, setQuery] = useState<Query>({
    rank: "high",
    frequency: "high",
    gender: "female",
    year: 0,
    race: "any",
    racePercent: 50,
    fstartswith: "",
    sstartswith: "",
  });
  const scrollTimeoutRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<Name | null>(null);
  const [favorites, setFavorites] = useLocalStorage<Name[]>("favorites", []);
  const [lockedFirstName, setLockedFirstName] = useState<Name | null>(null);
  const [lockedLastName, setLockedLastName] = useState<Name | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [showFavorites, setShowFavorites] = useState(false);

  // Handler functions
  const handleNameClick = (name: Name) => {
    setSelectedName(name);
  };

  const handleDrawerClose = () => {
    setSelectedName(null);
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

  const handleLockFirst = (name: Name) => {
    if (lockedFirstName?.first === name.first) {
      setLockedFirstName(null);
      setQuery((prev) => ({
        ...prev,
        fstartswith: "",
      }));
    } else {
      setLockedFirstName(name);
      setQuery((prev) => ({
        ...prev,
        fstartswith: name.first + "^",
      }));
    }
  };

  const handleLockLast = (name: Name) => {
    if (lockedLastName?.last === name.last) {
      setLockedLastName(null);
      setQuery((prev) => ({
        ...prev,
        sstartswith: "",
      }));
    } else {
      setLockedLastName(name);
      setQuery((prev) => ({
        ...prev,
        sstartswith: name.last + "^",
      }));
    }
  };

  // Helper functions to check status
  const isNameFavorite = (name: Name) => {
    return favorites.some(
      (f) => f.first === name.first && f.last === name.last,
    );
  };

  const isFirstNameLocked = (name: Name) => {
    return lockedFirstName?.first === name.first;
  };

  const isLastNameLocked = (name: Name) => {
    return lockedLastName?.last === name.last;
  };

  const handleFavoriteClick = (name: Name, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the drawer
    handleFavorite(name);
  };

  const getNames = async (isInitial: boolean = false) => {
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
      const newNames = data.names.map((item: any[]) => ({
        first: item[0] ? item[0].name : "NoneMatching",
        last: item[1] ? item[1].name : "NoneMatching",
        gender: item[0] ? item[0].gender : "NoneMatching",
      }));

      // If this is an initial load (from filter change), replace the names
      // Otherwise, append the new names to the existing list
      setNames(isInitial ? newNames : [...names, ...newNames]);

      // Set hasMore based on whether we got a full page of results
      setHasMore(newNames.length === 50);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching names:", err);
    }
  };

  // Initial load when filters change
  useEffect(() => {
    getNames(true);
  }, [query]);

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
    <div className="min-h-screen font-sans dark:bg-gray-900">
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
              ${showFilters || showFavorites ? "block" : "hidden"}
              sm:sticky sm:top-2
              bg-white dark:bg-gray-800
              p-4 rounded-lg shadow
              transition-all duration-300
              sm:flex sm:flex-col
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
                ${showFavorites ? "block" : "invisible"}
                mt-4
                border-t dark:border-gray-700
                pt-4 px-4
                ${showFilters ? "sm:h-[30vh]" : "sm:h-[calc(100vh-2rem)]"}
                sm:flex sm:flex-col
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
                  <X size={24} />
                </button>
              </div>

              {favorites.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No favorites yet
                </p>
              ) : (
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
                </div>
              )}
            </div>
          </div>

          {/* End Sidebar */}

          {/* Names List */}
          <div
            className={`
            bg-white dark:bg-gray-800
            p-4 rounded-lg shadow
            ${!showFilters && !showFavorites ? "col-span-full px-8" : "col-span-2"}
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
            </InfiniteScroll>
          </div>
        </div>
        {/* Drawer component with all necessary props */}
        <NameDrawer
          name={selectedName}
          isOpen={!!selectedName}
          onClose={handleDrawerClose}
          onFavorite={handleFavorite}
          onLockFirst={handleLockFirst}
          onLockLast={handleLockLast}
          isFavorite={selectedName ? isNameFavorite(selectedName) : false}
          isFirstNameLocked={
            selectedName ? isFirstNameLocked(selectedName) : false
          }
          isLastNameLocked={
            selectedName ? isLastNameLocked(selectedName) : false
          }
        />
      </div>
    </div>
  );
}

export default App;
