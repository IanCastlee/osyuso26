import React from "react";

function SkeletonLoader({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-md shadow-sm overflow-hidden animate-pulse"
        >
          {/* IMAGE SKELETON */}
          <div className="w-full h-[140px] bg-gray-200" />

          {/* CONTENT SKELETON */}
          <div className="p-3 flex flex-col gap-2">
            <div className="h-3 w-3/4 bg-gray-200 rounded" />
            <div className="h-3 w-1/2 bg-gray-200 rounded" />
            <div className="h-3 w-2/3 bg-gray-200 rounded" />

            {/* BUTTON SKELETON */}
            <div className="flex justify-end mt-2">
              <div className="h-6 w-16 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SkeletonLoader;
