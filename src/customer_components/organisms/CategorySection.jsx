import React from "react";
import CategoryCard from "../molecules/CategoryCard";

function CategorySection() {
  return (
    <div className="w-full flex flex-col gap-3 px-1 lg:p-4 bg-primary mt-2">
      <h2 className="mt-2 lg:mt-0 text-[10px] lg:text-sm font-bold text-secondary">
        CATEGORIES
      </h2>

      {/* Cards */}
      <div>
        <div className="flex justify-around lg:justify-start flex-wrap gap-2 lg:gap-4 border-t border-gray-200">
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
        </div>

        <div className="w-full flex justify-end my-2 lg:my-0 ">
          <button className=" text-[10px] lg:text-xs text-primary px-4 rounded  hover:text-secondary transition duration-300">
            View All Categories
          </button>
        </div>
      </div>
    </div>
  );
}

export default CategorySection;
