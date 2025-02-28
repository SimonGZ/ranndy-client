import React from "react";

interface NameSkeletonProps {
  count?: number;
}

const NameSkeleton: React.FC<NameSkeletonProps> = ({ count = 10 }) => {
  return (
    <div className="text-center font-semibold text-2xl animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={
            index % 2 === 0
              ? "p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 last:border-none"
              : "p-3 border-b border-gray-200 dark:border-gray-600 last:border-none"
          }
        >
          <div className="h-7 rounded-md w-3/4 mx-auto"></div>
        </div>
      ))}
    </div>
  );
};

export default NameSkeleton;
