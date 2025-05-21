import React from "react";
import DropdownList from "react-widgets/DropdownList";
import { X } from "lucide-react";

// Define types for the component props
interface FiltersProps {
  query: {
    rank: "any" | "high" | "low";
    frequency: "any" | "high" | "medium" | "low";
    gender: "any" | "male" | "female";
    year: number;
    race: string;
    racePercent: number;
    fstartswith: string;
    sstartswith: string;
  };
  onQueryChange: (newQuery: Partial<FiltersProps["query"]>) => void;
  onClose: () => void;
}

type YearOption = {
  year: number;
  display: string;
};

const Filters: React.FC<FiltersProps> = ({ query, onQueryChange, onClose }) => {
  // Helper functions
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { id, value } = e.target;
    onQueryChange({
      [id]: id === "year" ? parseInt(value) : value,
    });
  };

  const handleYearChange = (newYear: YearOption) => {
    onQueryChange({ year: newYear.year });
  };

  const handleRacePercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange({ racePercent: parseInt(e.target.value) });
  };

  // Create years list
  const yearsList: YearOption[] = [
    ...Array.from({ length: 144 }, (_, i) => ({
      year: 1880 + i,
      display: (1880 + i).toString(),
    })),
    { year: 0, display: "Any" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 sm:sticky sm:top-4 p-4 pt-0 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold dark:text-white">Filters</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 sm:hidden"
          aria-label="Close filters"
        >
          <X size={24} className="text-gray-700 dark:text-white" />
        </button>
      </div>

      <form>
        <fieldset className="mb-4">
          <legend className="font-medium dark:text-white">First Name:</legend>

          {/* Gender Select */}
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

          {/* Rank Select */}
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

          {/* Year Dropdown */}
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
              defaultValue={query.year}
              onChange={handleYearChange}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              containerClassName="dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* First Name Starts With */}
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

        {/* Last Name Fieldset */}
        <fieldset>
          <legend className="font-medium dark:text-white">Last Name:</legend>

          {/* Race Selection */}
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
                    Minimum Race Percentile
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
  );
};

export default Filters;
