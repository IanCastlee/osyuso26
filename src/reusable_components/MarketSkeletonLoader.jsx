import React from "react";

function MarketSkeletonLoader() {
  return (
    <div className="w-full bg-gray-100 lg:px-3 sm:px-6 lg:px-28 animate-pulse">
      <div className="w-full flex flex-col bg-primary">
        {/* ================= BANNER ================= */}
        <div className="w-full h-[160px] sm:h-[200px] md:h-[220px] relative bg-gray-200">
          {/* PROFILE SKELETON */}
          <div
            className="
              w-[100px] h-[100px]
              lg:w-[120px] lg:h-[120px]
              absolute left-3 sm:left-6
              bottom-0 lg:-bottom-10
              rounded-full border-4 border-white
              bg-gray-300
            "
          />
        </div>

        {/* ================= SHOP INFO ================= */}
        <div className="pl-3 sm:pl-28 md:pl-36 mt-4 flex flex-col gap-2">
          <div className="h-5 w-[180px] bg-gray-300 rounded" />
          <div className="h-3 w-[140px] bg-gray-300 rounded" />
        </div>

        {/* ================= CATEGORY TABS ================= */}
        <div className="flex gap-4 border-b border-gray-200 px-3 mt-6 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-[70px] bg-gray-300 rounded" />
          ))}
        </div>

        {/* ================= SUBCATEGORY ================= */}
        <div className="flex justify-end px-3 mt-3">
          <div className="h-4 w-[120px] bg-gray-300 rounded" />
        </div>

        {/* ================= PRODUCTS GRID ================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 px-3 mt-4 pb-6">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="w-full h-[180px] sm:h-[220px] bg-gray-200 rounded"
            />
          ))}
        </div>

        {/* ================= LOAD MORE ================= */}
        <div className="w-full flex justify-center pb-6">
          <div className="h-4 w-[100px] bg-gray-300 rounded" />
        </div>
      </div>
    </div>
  );
}

export default MarketSkeletonLoader;
