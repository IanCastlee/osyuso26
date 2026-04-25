import React from "react";
import CategoryCard from "../molecules/CategoryCard";

function CategorySection() {
  return (
    <div className="w-full flex flex-col gap-3 p-4 bg-primary mt-2">
      <h2 className="text-lg font-bold text-primary">Categories</h2>

      {/* Cards */}
      <div className="flex flex-wrap gap-4">
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
    </div>
  );
}

export default CategorySection;
