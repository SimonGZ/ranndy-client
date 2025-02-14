import React, { useState, useEffect, useRef } from "react";
import { Name } from "./types";
import InfiniteScroll from "react-infinite-scroll-component";
import DropdownList from "react-widgets/DropdownList";
import NameDrawer from "./components/NameDrawer";
import { useTheme } from "./ThemeContext";
import { Moon, Sun, Filter, X } from "lucide-react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import "./App.css";
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

  // Handler functions
  const handleNameClick = (name: Name) => {
    setSelectedName(name);
  };

  const handleDrawerClose = () => {
    setSelectedName(null);
  };

  const handleFavorite = (name: Name) => {
    console.log(`handleFavorite called with ${name}`);
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { id, value } = e.target;
    setQuery((prevQuery) => ({
      ...prevQuery,
      [id]: id === "year" ? parseInt(value) : value,
    }));
  };

  const handleYearChange = (newYear: YearOption) => {
    setQuery((prevQuery) => ({
      ...prevQuery,
      year: newYear.year,
    }));
  };

  const handleRacePercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery((prevQuery) => ({
      ...prevQuery,
      racePercent: parseInt(e.target.value),
    }));
  };

  type YearOption = {
    year: number;
    display: string;
  };

  const yearsList: YearOption[] = [
    ...Array.from({ length: 144 }, (_, i) => {
      const year = 1880 + i;
      return {
        year,
        display: year.toString(),
      };
    }),
    { year: 0, display: "Any" },
  ];
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className="min-h-screen font-sans dark:bg-gray-900">
      <div className="container mx-auto p-4 max-w-5xl">
        <header className="bg-sky-700 dark:bg-sky-900 text-white p-4 rounded-t-lg flex justify-between items-center">
          <h1 className="text-2xl font-bold">Name Generator</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden p-2 rounded-lg hover:bg-sky-600 dark:hover:bg-sky-800 transition-colors"
              aria-label="Toggle filters"
            >
              <Filter size={24} />
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
          {/* Filters */}
          <div
            className={`
  ${showFilters ? "block" : "hidden"}
  sm:block /* Always show on desktop */
  bg-white dark:bg-gray-800
  p-4 rounded-lg shadow
  sm:sticky /* Fixed position on mobile, static on desktop */
  transition-all duration-300
`}
          >
            <div className="bg-white dark:bg-gray-800 sm:sticky sm:top-4 p-4 pt-0 rounded-lg shadow">
              {/* Add a close button for mobile */}
              <div className="flex justify-between items-center sm:hidden mb-4">
                <h2 className="text-xl font-semibold dark:text-white">
                  Filters
                </h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Close filters"
                >
                  <X size={24} />
                </button>
              </div>
              <form>
                <fieldset className="mb-4">
                  <legend className="font-medium dark:text-white">
                    First Name:
                  </legend>
                  <div className="mb-2">
                    <label
                      htmlFor="gender"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Gender
                    </label>
                    <select
                      id="gender"
                      value={query.gender}
                      onChange={handleChange}
                      className="bg-white dark:bg-gray-700 dark:text-white mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="any">Any</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <label
                      htmlFor="rank"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Popularity
                    </label>
                    <select
                      id="rank"
                      value={query.rank}
                      onChange={handleChange}
                      className="bg-white dark:bg-gray-700 dark:text-white mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="any">Any</option>
                      <option value="high">High</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <label
                      htmlFor="year"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Year
                    </label>
                    <DropdownList
                      data={yearsList}
                      dataKey="year"
                      textField="display"
                      defaultValue={0}
                      onChange={handleYearChange}
                    />
                  </div>

                  <div className="mb-2">
                    <label
                      htmlFor="fstartswith"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Starts With:
                    </label>
                    <input
                      type="search"
                      id="fstartswith"
                      value={query.fstartswith}
                      onChange={handleChange}
                      placeholder="Jo..."
                      autoComplete="off"
                      className="bg-white dark:bg-gray-700 dark:text-white mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="font-medium dark:text-white">
                    Last Name:
                  </legend>
                  <div className="mb-2">
                    <label
                      htmlFor="race"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Race
                    </label>
                    <div className="space-y-2">
                      <select
                        id="race"
                        value={query.race}
                        onChange={handleChange}
                        className="bg-white dark:bg-gray-700 dark:text-white mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="any">Any</option>
                        <option value="pctwhite">White</option>
                        <option value="pcthispanic">Hispanic</option>
                        <option value="pctasian">Asian</option>
                        <option value="pctblack">Black</option>
                        <option value="pctnative">Native</option>
                      </select>

                      {query.race !== "any" && (
                        <div>
                          <label
                            htmlFor="racePercent"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Race Percentile
                          </label>
                          <input
                            type="number"
                            id="racePercent"
                            value={query.racePercent}
                            onChange={handleRacePercentChange}
                            min="0"
                            max="99"
                            className="bg-white dark:bg-gray-700 dark:text-white mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label
                      htmlFor="frequency"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Popularity
                    </label>
                    <select
                      id="frequency"
                      value={query.frequency}
                      onChange={handleChange}
                      className="bg-white dark:bg-gray-700 dark:text-white mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="any">Any</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <label
                      htmlFor="sstartswith"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Starts With:
                    </label>
                    <input
                      type="search"
                      id="sstartswith"
                      value={query.sstartswith}
                      onChange={handleChange}
                      placeholder="Smi..."
                      autoComplete="off"
                      className="bg-white dark:bg-gray-700 dark:text-white mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </fieldset>
              </form>
            </div>
          </div>

          {/* Names List */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow col-span-2">
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
              <div className="text-center font-semibold">
                {names.map((name, index) => (
                  <div
                    key={index}
                    onClick={() => handleNameClick(name)}
                    className={
                      index % 2 === 0
                        ? "cursor-pointer p-3 bg-gray-50 hover:bg-blue-500 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 last:border-none text-xl dark:text-white"
                        : "cursor-pointer p-3 border-b border-gray-200 hover:bg-blue-500 dark:border-gray-600 last:border-none text-xl dark:text-white"
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
