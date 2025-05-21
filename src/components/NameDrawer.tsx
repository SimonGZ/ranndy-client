import React, { useRef, useEffect } from "react"; // Removed useState
import { Heart, Lock, X, Search, TrendingUp, PieChart } from "lucide-react"; // Added PieChart icon
import {
  DrawerProps, // Now includes namePair, activeChartType, setActiveChartType
  LastNameDetails,
  NameHistory,
  NamePair,
  SurnameRaceData,
  Name,
} from "../types"; // Import new types
import { useClickOutside } from "../hooks/useClickOutside";
import NamePopularityChart from "./NamePopularityChart";
import SurnameRaceChart from "./SurnameRaceChart"; // Import the new component

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const createGoogleSearchUrl = (name: string, last: boolean) => {
  if (last) {
    return `http://google.com/search?q=surname+meaning+${encodeURIComponent(name)}`;
  } else {
    return `http://google.com/search?q=first+name+meaning+${encodeURIComponent(name)}`;
  }
};

// Helper to convert string percentages to numbers
const parseRaceData = (
  lastNameDetails: NamePair[1],
): SurnameRaceData | null => {
  if (!lastNameDetails) return null;

  // Check if all required race percentage properties exist and are strings
  const requiredKeys: (keyof LastNameDetails)[] = [
    "pctwhite",
    "pctblack",
    "pctasian",
    "pctnative",
    "pct2prace",
    "pcthispanic",
  ];

  const allKeysExist = requiredKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(lastNameDetails, key) &&
      typeof lastNameDetails[key] === "string",
  );

  if (!allKeysExist) {
    console.warn(
      "Missing or incorrect type for race data in lastNameDetails:",
      lastNameDetails,
    );
    return null;
  }

  // Attempt to parse strings to numbers
  const parsedData = {
    pctWhite: parseFloat(lastNameDetails.pctwhite),
    pctBlack: parseFloat(lastNameDetails.pctblack),
    pctAsian: parseFloat(lastNameDetails.pctasian),
    pctNative: parseFloat(lastNameDetails.pctnative),
    pctTwoOrMoreRaces: parseFloat(lastNameDetails.pct2prace),
    pctHispanic: parseFloat(lastNameDetails.pcthispanic),
  };

  // Check if parsing resulted in valid numbers
  const allParsedAreNumbers = Object.values(parsedData).every(
    (val) => !isNaN(val),
  );

  if (!allParsedAreNumbers) {
    console.warn("Failed to parse race data percentages:", lastNameDetails);
    return null;
  }

  return parsedData;
};

const NameDrawer: React.FC<DrawerProps> = ({
  // Use DrawerProps directly
  namePair, // Use namePair instead of name
  isOpen,
  onClose,
  onFavorite,
  onLockFirst,
  onLockLast,
  isFavorite,
  isFirstNameLocked,
  isLastNameLocked,
  activeChartType, // Use prop instead of local state
  setActiveChartType, // Use prop instead of local state setter
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  // Keep local state for fetched data and loading/error status
  const [nameHistory, setNameHistory] = React.useState<NameHistory[] | null>(
    null,
  );
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);
  const [historyError, setHistoryError] = React.useState<string | null>(null);

  const [surnameRaceData, setSurnameRaceData] =
    React.useState<SurnameRaceData | null>(null);
  // No local state for showRaceChart or showHistoryChart

  useClickOutside(drawerRef, onClose);

  // Extract first and last name details from the pair
  const firstNameDetails = namePair ? namePair[0] : null;
  const lastNameDetails = namePair ? namePair[1] : null;

  // Create a simplified Name object for handlers that expect it
  const simpleName: Name | null = namePair
    ? {
        first: firstNameDetails?.name || "NoneMatching",
        last: lastNameDetails?.name || "NoneMatching",
        gender: firstNameDetails?.gender || "NoneMatching",
      }
    : null;

  // Fetch name history when a name is selected and history chart is active
  useEffect(() => {
    if (isOpen && firstNameDetails && activeChartType === "history") {
      fetchNameHistory(
        firstNameDetails.name,
        firstNameDetails.gender === "M" ? "male" : "female",
      );
    } else if (!isOpen || activeChartType !== "history") {
      // Clear history data if drawer closes or history chart is not active
      setNameHistory(null);
      setHistoryError(null);
    }
  }, [isOpen, firstNameDetails, activeChartType]); // Depend on activeChartType

  // Parse surname race data when a name is selected and race chart is active
  useEffect(() => {
    if (isOpen && lastNameDetails && activeChartType === "race") {
      setSurnameRaceData(parseRaceData(lastNameDetails));
    } else if (!isOpen || activeChartType !== "race") {
      // Clear race data if drawer closes or race chart is not active
      setSurnameRaceData(null);
    }
  }, [isOpen, lastNameDetails, activeChartType]); // Depend on activeChartType

  // No need to reset state on close here, useEffects above handle clearing data
  // when isOpen becomes false or activeChartType changes away from the chart type.

  // Add keyboard event listener for Escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (isOpen && event.key === "Escape") {
        onClose();
      }
    };

    // Add event listener when drawer is open
    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    // Clean up event listener when component unmounts or drawer closes
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const fetchNameHistory = async (firstName: string, gender: string) => {
    setIsLoadingHistory(true);
    setHistoryError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/firstnames/history?name=${encodeURIComponent(firstName)}&gender=${gender}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.errors?.[0]?.message || "Failed to fetch name history",
        );
      }

      const data = await response.json();
      setNameHistory(data.history);
    } catch (error: any) {
      console.error("Error fetching name history:", error);
      setHistoryError(error.message);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Use simpleName for handlers that need the Name interface
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (simpleName) onFavorite(simpleName);
  };

  const handleLockFirstClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (simpleName) onLockFirst(simpleName);
  };

  const handleLockLastClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (simpleName) onLockLast(simpleName);
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  // Toggle handlers now update the activeChartType state via prop
  const toggleHistoryChart = () => {
    if (activeChartType === "history") {
      setActiveChartType("none"); // Hide history chart
    } else {
      setActiveChartType("history"); // Show history chart
    }
  };

  const toggleRaceChart = () => {
    if (activeChartType === "race") {
      setActiveChartType("none"); // Hide race chart
    } else {
      setActiveChartType("race"); // Show race chart
    }
  };

  if (!isOpen || !namePair) return null; // Check namePair instead of name

  // Use simpleName for display purposes
  const displayFirstName = simpleName?.first || "N/A";
  const displayLastName = simpleName?.last || "N/A";
  const displayGender = simpleName?.gender === "M" ? "Male" : "Female";

  return (
    <div
      ref={drawerRef}
      className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-lg overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold dark:text-white">Name Details</h2>
          <button
            onClick={handleCloseClick}
            className="cursor-pointer p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={24} className="dark:text-white" />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-bold text-sky-800 dark:text-sky-300">
            {displayFirstName} {displayLastName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gender: {displayGender}
          </p>
        </div>

        <div className="mt-4 space-y-4 dark:text-white">
          <button
            onClick={handleFavoriteClick}
            className="cursor-pointer flex items-center gap-2 p-2 w-full rounded-lg bg-pink-100 dark:bg-pink-900 hover:bg-pink-200 dark:hover:bg-pink-800"
          >
            <Heart className={isFavorite ? "fill-current" : ""} />
            {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          </button>

          <div className="space-y-2">
            <button
              onClick={handleLockFirstClick}
              className="cursor-pointer flex items-center gap-2 p-2 w-full rounded-lg bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800"
            >
              <Lock className={isFirstNameLocked ? "fill-current" : ""} />
              {isFirstNameLocked ? "Unlock First Name" : "Lock First Name"}
            </button>

            <button
              onClick={handleLockLastClick}
              className="cursor-pointer flex items-center gap-2 p-2 w-full rounded-lg bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800"
            >
              <Lock className={isLastNameLocked ? "fill-current" : ""} />
              {isLastNameLocked ? "Unlock Last Name" : "Lock Last Name"}
            </button>
          </div>

          {/* Chart Toggle Buttons */}
          <div className="space-y-2">
            {/* Name Popularity Chart Toggle */}
            <button
              onClick={toggleHistoryChart}
              className="cursor-pointer flex items-center gap-2 p-2 w-full rounded-lg bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800"
            >
              <TrendingUp />
              {activeChartType === "history" // Check activeChartType prop
                ? "Hide Popularity Chart"
                : "Show Popularity Chart"}
            </button>

            {/* Surname Race Chart Toggle */}
            {lastNameDetails && ( // Only show if last name data is available
              <button
                onClick={toggleRaceChart}
                className="cursor-pointer flex items-center gap-2 p-2 w-full rounded-lg bg-teal-100 dark:bg-teal-900 hover:bg-teal-200 dark:hover:bg-teal-800"
              >
                <PieChart />
                {activeChartType === "race" // Check activeChartType prop
                  ? "Hide Race Breakdown"
                  : "Show Race Breakdown"}
              </button>
            )}
          </div>

          {/* Chart Sections */}
          {activeChartType === "history" && ( // Conditional rendering based on activeChartType
            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {isLoadingHistory ? ( // Show loading state for history chart
                <div className="h-64 flex items-center justify-center">
                  Loading chart data...
                </div>
              ) : historyError ? (
                <div className="text-red-500 p-4 text-center">
                  {historyError}
                </div>
              ) : (
                <NamePopularityChart
                  nameHistory={nameHistory}
                  firstName={displayFirstName}
                  isLoading={isLoadingHistory} // Pass loading state
                />
              )}
            </div>
          )}

          {activeChartType === "race" &&
            lastNameDetails && ( // Conditional rendering based on activeChartType and data existence
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {/* SurnameRaceChart handles its own loading/no data states */}
                <SurnameRaceChart
                  data={surnameRaceData}
                  surname={displayLastName}
                  isLoading={false} // Race data is parsed locally, not fetched async here
                />
              </div>
            )}

          <div className="space-y-2">
            <a
              href={createGoogleSearchUrl(displayFirstName, false)}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer flex items-center gap-2 p-2 w-full rounded-lg bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-center"
            >
              <Search size={20} />
              Search First Name Meaning
            </a>

            <a
              href={createGoogleSearchUrl(displayLastName, true)}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer flex items-center gap-2 p-2 w-full rounded-lg bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-center"
            >
              <Search size={20} />
              Search Last Name Meaning
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NameDrawer;
