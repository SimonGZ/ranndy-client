import React, { useState, useEffect, useRef } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import DropdownList from "react-widgets/DropdownList";
import { useTheme } from "./ThemeContext";
import { Moon, Sun } from "lucide-react";
import "./App.css";
import "react-widgets/styles.css";

// Define types for your data
interface Name {
  first: string;
  last: string;
  gender: string;
}

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
  // ... (keep your existing state and functions)

  return (
    <div className="min-h-screen font-sans dark:bg-gray-900">
      <div className="container mx-auto p-4 max-w-5xl">
        <header className="bg-sky-700 dark:bg-sky-900 text-white p-4 rounded-t-lg flex justify-between items-center">
          <h1 className="text-2xl font-bold">Name Generator</h1>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-sky-600 dark:hover:bg-sky-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 sm:gap-4">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="bg-white dark:bg-gray-800 sm:sticky sm:top-4 p-4 pt-0 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">
                Filters
              </h2>
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
                    className={
                      index % 2 === 0
                        ? "p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 last:border-none text-xl dark:text-white"
                        : "p-3 border-b border-gray-200 dark:border-gray-600 last:border-none text-xl dark:text-white"
                    }
                  >
                    <a
                      href={`https://www.google.com/search?q=name+meaning+${name.first}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {name.first}
                    </a>{" "}
                    <a
                      href={`https://www.google.com/search?q=surname+${name.last}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {name.last}
                    </a>
                  </div>
                ))}
              </div>
            </InfiniteScroll>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
