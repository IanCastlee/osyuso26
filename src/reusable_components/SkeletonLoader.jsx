import React from "react";

function SkeletonLoader({ count = 10 }) {
  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="w-full min-h-[230px] sm:min-h-[260px] bg-white rounded-xl shadow-sm overflow-hidden animate-pulse border border-gray-100"
        >
          {/* IMAGE */}
          <div className="w-full h-[120px] sm:h-[150px] md:h-[170px] bg-gray-200" />

          {/* CONTENT */}
          <div className="p-2 sm:p-3 flex flex-col gap-2">
            {/* TITLE */}
            <div className="h-3 sm:h-4 w-3/4 bg-gray-200 rounded" />

            {/* PRICE */}
            <div className="h-3 sm:h-4 w-1/2 bg-gray-200 rounded" />

            {/* SELLER */}
            <div className="h-2 sm:h-3 w-2/3 bg-gray-200 rounded" />

            {/* BUTTON */}
            <div className="flex justify-end mt-2 sm:mt-4">
              <div className="h-6 sm:h-8 w-16 sm:w-20 bg-gray-200 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SkeletonLoader;
