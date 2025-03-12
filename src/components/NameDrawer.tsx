import React, { useRef, useState, useEffect } from "react";
import { Heart, Lock, X, Search, TrendingUp } from "lucide-react";
import { DrawerProps, NameHistory } from "../types";
import { useClickOutside } from "../hooks/useClickOutside";
import NameChart from "./NameChart";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const createGoogleSearchUrl = (name: string, last: boolean) => {
  if (last) {
    return `http://google.com/search?q=surname+meaning+${encodeURIComponent(name)}`;
  } else {
    return `http://google.com/search?q=first+name+meaning+${encodeURIComponent(name)}`;
  }
};

const NameDrawer: React.FC<DrawerProps> = ({
  name,
  isOpen,
  onClose,
  onFavorite,
  onLockFirst,
  onLockLast,
  isFavorite,
  isFirstNameLocked,
  isLastNameLocked,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [nameHistory, setNameHistory] = useState<NameHistory[] | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(false);

  useClickOutside(drawerRef, onClose);

  // Fetch name history when a name is selected
  useEffect(() => {
    if (isOpen && name && showChart) {
      fetchNameHistory(name.first, name.gender === "M" ? "male" : "female");
    }
  }, [isOpen, name, showChart]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setShowChart(false);
      setNameHistory(null);
      setHistoryError(null);
    }
  }, [isOpen]);

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

  if (!isOpen || !name) return null;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite(name);
  };

  const handleLockFirstClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLockFirst(name);
  };

  const handleLockLastClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLockLast(name);
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const toggleChart = () => {
    setShowChart(!showChart);
  };

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
            {name.first} {name.last}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gender: {name.gender === "M" ? "Male" : "Female"}
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

          {/* Name Popularity Chart Toggle */}
          <button
            onClick={toggleChart}
            className="cursor-pointer flex items-center gap-2 p-2 w-full rounded-lg bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800"
          >
            <TrendingUp />
            {showChart ? "Hide Popularity Chart" : "Show Popularity Chart"}
          </button>

          {/* Chart Section */}
          {showChart && (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {historyError ? (
                <div className="text-red-500 p-4 text-center">
                  {historyError}
                </div>
              ) : (
                <NameChart
                  nameHistory={nameHistory}
                  firstName={name.first}
                  isLoading={isLoadingHistory}
                />
              )}
            </div>
          )}

          <div className="space-y-2">
            <a
              href={createGoogleSearchUrl(name.first, false)}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer flex items-center gap-2 p-2 w-full rounded-lg bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-center"
            >
              <Search size={20} />
              Search First Name Meaning
            </a>

            <a
              href={createGoogleSearchUrl(name.last, true)}
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
