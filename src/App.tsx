import React, { useState, useEffect, useRef } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import "./App.css";

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
      if (query.year !== 0) params.push(`year=${query.year}`);
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
        first: item[0] ? item[0].name : "N/A",
        last: item[1] ? item[1].name : "N/A",
        gender: item[0] ? item[0].gender : "N/A",
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

  const handleRacePercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery((prevQuery) => ({
      ...prevQuery,
      racePercent: parseInt(e.target.value),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="container mx-auto p-4 max-w-5xl">
        <header className="bg-sky-700 text-white p-4 rounded-t-lg">
          <h1 className="text-2xl font-bold">Name Generator</h1>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 sm:gap-4">
          {/* Filters - Same as before */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="bg-white sm:sticky sm:top-4 p-4 pt-0 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>
              <form>
                <fieldset className="mb-4">
                  <legend className="font-medium">First Name:</legend>
                  <div className="mb-2">
                    <label
                      htmlFor="gender"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Gender
                    </label>
                    <select
                      id="gender"
                      value={query.gender}
                      onChange={handleChange}
                      className="bg-white mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="any">Any</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <label
                      htmlFor="rank"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Popularity
                    </label>
                    <select
                      id="rank"
                      value={query.rank}
                      onChange={handleChange}
                      className="bg-white mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="any">Any</option>
                      <option value="high">High</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <label
                      htmlFor="year"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Year
                    </label>
                    <select
                      id="year"
                      value={query.year}
                      onChange={handleChange}
                      className="bg-white mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={0}>Any</option>
                      {Array.from({ length: 145 }, (_, i) => 1880 + i).map(
                        (year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div className="mb-2">
                    <label
                      htmlFor="fstartswith"
                      className="block text-sm font-medium text-gray-700"
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
                      className="bg-white mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="font-medium">Last Name:</legend>
                  <div className="mb-2">
                    <label
                      htmlFor="race"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Race
                    </label>
                    <div className="flex items-center space-x-2">
                      <select
                        id="race"
                        value={query.race}
                        onChange={handleChange}
                        className="bg-white mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="any">Any</option>
                        <option value="pctwhite">White</option>
                        <option value="pcthispanic">Hispanic</option>
                        <option value="pctasian">Asian</option>
                        <option value="pctblack">Black</option>
                        <option value="pctnative">Native</option>
                      </select>

                      <input
                        type="number"
                        id="racePercent"
                        value={query.racePercent}
                        onChange={handleRacePercentChange}
                        min="0"
                        max="99"
                        className="bg-white mt-1 block w-20 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label
                      htmlFor="frequency"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Popularity
                    </label>
                    <select
                      id="frequency"
                      value={query.frequency}
                      onChange={handleChange}
                      className="bg-white mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                      className="block text-sm font-medium text-gray-700"
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
                      className="bg-white mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </fieldset>
              </form>
            </div>
          </div>

          {/* Names List with Infinite Scroll */}
          <div className="bg-white p-4 rounded-lg shadow col-span-2">
            <h2 className="text-lg font-semibold mb-4">Generated Names</h2>
            {error && <div className="text-red-500 mb-4">{error}</div>}

            <InfiniteScroll
              dataLength={names.length}
              next={() => getNames(false)}
              hasMore={hasMore}
              loader={
                <div className="text-center p-4">Loading more names...</div>
              }
              endMessage={
                <div className="text-center p-4 text-gray-500">
                  No more names to load.
                </div>
              }
            >
              <div className="space-y-2">
                {names.map((name, index) => (
                  <div
                    key={index}
                    className={
                      index % 2 === 0
                        ? "p-2 bg-gray-50 border-b border-gray-200 last:border-none text-lg"
                        : "p-2 border-b border-gray-200 last:border-none text-lg"
                    }
                  >
                    <a
                      href={`https://www.google.com/search?q=name+meaning+${name.first}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {name.first}
                    </a>{" "}
                    <a
                      href={`https://www.google.com/search?q=surname+${name.last}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
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
