// src/components/NameDrawer.tsx
import React, { useRef } from "react";
import { Heart, Lock, X } from "lucide-react";
import { DrawerProps } from "../types";
import { useClickOutside } from "../hooks/useClickOutside";

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
  useClickOutside(drawerRef, onClose);

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

  return (
    <div
      ref={drawerRef}
      className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 shadow-lg"
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
        </div>
      </div>
    </div>
  );
};

export default NameDrawer;
