import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [names, setNames] = useState([]);
  const [query, setQuery] = useState({
    rank: "high",
    frequency: "high",
    gender: "female",
    year: 0,
    race: ["any", 50],
    fstartswith: "",
    sstartswith: "",
  });

  const getNames = async (resetFlag = false) => {
    if (resetFlag) {
      setNames([]);
    }

    const response = await fetch(
      `https://ranndy.com/api/names?limit=100&rank=${query.rank}&frequency=${query.frequency}&gender=${query.gender}&year=${query.year}&race=${query.race}&fstartswith=${query.fstartswith}&sstartswith=${query.sstartswith}`
    );
    const data = await response.json();
    setNames(
      data.names.map((name) => ({ first: name[0].name, last: name[1].name }))
    );
  };

  useEffect(() => {
    getNames();
  }, [query]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setQuery((prevQuery) => ({
      ...prevQuery,
      [id]: value,
    }));
  };

  const handleRaceChange = (e) => {
    const newQuery = { ...query, race: [e.target.value, 50] };
    if (e.target.value === "pctnative") {
      newQuery.frequency = "any";
    }
    setQuery(newQuery);
  };

  return (
    <div className="App">
      <div className="topBar">
        <div className="controlDrawer">
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
                  <option value="0">Any</option>
                  {/* Add other year options here */}
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
                <select
                  id="race"
                  value={query.race[0]}
                  onChange={handleRaceChange}
                >
                  <option value="any">Any</option>
                  <option value="pctwhite">White</option>
                  <option value="pcthispanic">Hispanic</option>
                  <option value="pctasian">Asian</option>
                  <option value="pctblack">Black</option>
                  <option value="pctnative">Native</option>
                </select>
              </div>
              <div className="selector">
                <label htmlFor="frequency">Popularity</label>
                <select
                  id="frequency"
                  value={query.frequency}
                  onChange={handleChange}
                  disabled={query.race[0] === "pctnative"}
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
        <div id="nameTable">
          {names.map((name, index) => (
            <div key={index} className="nameRow">
              <div className="fullName">
                <a
                  className="searchLink"
                  href={`http://google.com/search?q=name+meaning+${name.first}`}
                >
                  {name.first}
                </a>
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
