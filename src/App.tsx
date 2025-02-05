import React, { useState, useEffect } from "react";
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
  const [query, setQuery] = useState<Query>({
    rank: "high",
    frequency: "high",
    gender: "female",
    year: 0, // Use 0 for "Any" year
    race: "any",
    racePercent: 50,
    fstartswith: "",
    sstartswith: "",
  });
  const [error, setError] = useState<string | null>(null); // Add error state

  const getNames = async () => {
    setError(null); // Clear previous errors
    try {
      let url = `${API_URL}/api/names?`; //removed limit
      const params = [];

      // Build the query string dynamically
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

      url += params.join("&"); // Join parameters with '&'

      const response = await fetch(url);

      if (!response.ok) {
        // Check for HTTP errors
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.message || "API Error");
      }

      const data = await response.json();
      // Correctly map the data
      setNames(
        data.names.map((item: any[]) => ({
          // Type item as an array
          first: item[0] ? item[0].name : "N/A", // Access first element, check for null
          last: item[1] ? item[1].name : "N/A", // Access second element, check for null
          gender: item[0] ? item[0].gender : "N/A",
        })),
      );
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching names:", err);
    }
  };

  useEffect(() => {
    getNames();
  }, [query]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { id, value } = e.target;
    setQuery((prevQuery) => ({
      ...prevQuery,
      [id]: id === "year" ? parseInt(value) : value, // Parse year to integer
    }));
  };

  const handleRacePercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery((prevQuery) => ({
      ...prevQuery,
      racePercent: parseInt(e.target.value),
    }));
  };

  return (
    <div className="App">
      <link
        rel="stylesheet"
        type="text/css"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.1.0/css/font-awesome.min.css"
      />
      <div className="ZtopBar">
        <div className="ZcontrolDrawer">
          <form>
            <fieldset>
              <legend>First Name:</legend>
              <div className="selector">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  value={query.gender}
                  onChange={handleChange}
                >
                  <option value="any">Any</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>
              <div className="selector">
                <label htmlFor="rank">Popularity</label>
                <select id="rank" value={query.rank} onChange={handleChange}>
                  <option value="any">Any</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="selector">
                <label htmlFor="year">Year</label>
                <select id="year" value={query.year} onChange={handleChange}>
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
              <div className="startsWith">
                <label htmlFor="fstartswith">Starts With:</label>
                <input
                  type="search"
                  id="fstartswith"
                  value={query.fstartswith}
                  onChange={handleChange}
                  placeholder="Jo..."
                  autoComplete="off"
                />
              </div>
            </fieldset>
            <fieldset>
              <legend>Last Name:</legend>
              <div className="selector">
                <label htmlFor="race">Race</label>
                <select id="race" value={query.race} onChange={handleChange}>
                  <option value="any">Any</option>
                  <option value="pctwhite">White</option>
                  <option value="pcthispanic">Hispanic</option>
                  <option value="pctasian">Asian</option>
                  <option value="pctblack">Black</option>
                  <option value="pctnative">Native</option>
                </select>
                <label htmlFor="racePercent">Race %:</label>
                <input
                  type="number"
                  id="racePercent"
                  value={query.racePercent}
                  onChange={handleRacePercentChange}
                  min="0"
                  max="99"
                />
              </div>
              <div className="selector">
                <label htmlFor="frequency">Popularity</label>
                <select
                  id="frequency"
                  value={query.frequency}
                  onChange={handleChange}
                  // Removed the client-side disable logic. The API should handle this.
                >
                  <option value="any">Any</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="startsWith">
                <label htmlFor="sstartswith">Starts With:</label>
                <input
                  type="search"
                  id="sstartswith"
                  value={query.sstartswith}
                  onChange={handleChange}
                  placeholder="Smi..."
                  autoComplete="off"
                />
              </div>
            </fieldset>
          </form>
        </div>
        <header>
          <div className="title">
            <a href="#" className="settingsBtn">
              R!
            </a>
          </div>
          <div className="settings">
            <a href="#" className="settingsBtn">
              <i className="fa fa-chevron-down"></i>
            </a>
          </div>
        </header>
      </div>
      <div id="ranndy">
        {error && <div className="error-message">{error}</div>}{" "}
        {/* Display error message */}
        <div id="nameTable">
          {names.map((name, index) => (
            <div key={index} className="nameRow">
              <div className="fullName">
                <a
                  className="searchLink"
                  href={`http://google.com/search?q=name+meaning+${name.first}`}
                >
                  {name.first}
                </a>{" "}
                <a
                  className="searchLink"
                  href={`http://google.com/search?q=surname+${name.last}`}
                >
                  {name.last}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
