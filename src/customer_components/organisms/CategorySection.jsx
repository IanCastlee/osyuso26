import React from "react";
import CategoryCard from "../molecules/CategoryCard";

function CategorySection() {
  return (
    <div className="w-full flex flex-col gap-3 p-4 bg-primary mt-2">
      <h2 className="text-sm font-bold text-secondary">CATEGORIES</h2>

      {/* Cards */}
      <div>
        <div className="flex flex-wrap gap-4 border-t border-gray-200">
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
          <CategoryCard />
        </div>

        <div className="w-full flex justify-end">
          <button className="mt-4 text-xs text-primary py-2 px-4 rounded  hover:text-secondary transition duration-300">
            View All Categories
          </button>
        </div>
      </div>
    </div>
  );
}

export default CategorySection;
