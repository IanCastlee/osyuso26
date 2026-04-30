import React from "react";
import CategoryCard from "../molecules/CategoryCard";

function AllCategories() {
  return (
    <div className="w-full bg-gray-100 px-1 lg:px-28">
      <div className="w-full h-full  flex flex-col">
        <div className="w-full flex flex-col gap-4 p-1 lg:p-4 bg-primary mt-4 mb-6">
          <h2 className="mt-2 lg:mt-0 text-[10px] lg:text-sm font-bold text-secondary">
            ALL CATEGORIES
          </h2>

          {/* Cards */}
          <div>
            <div className="flex justify-around lg:justify-start flex-wrap gap-2 lg:gap-4 border-t border-gray-200 px-0 lg:pt-2">
              <CategoryCard />
              <CategoryCard />
              <CategoryCard />
              <CategoryCard />
              <CategoryCard />
              <CategoryCard />
              <CategoryCard />
              <CategoryCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AllCategories;
