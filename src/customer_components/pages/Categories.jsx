import React, { useState } from "react";
import ProductCard from "../molecules/ProductCard";

const subCategories = [
  "Chicken",
  "Beef",
  "Pork",
  "Seafood",
  "Processed",
  "Frozen",
];

function Categories() {
  const [active, setActive] = useState("Chicken");

  return (
    <div className="w-full bg-gray-100 min-h-[calc(100vh-4rem)]">
      {/* MAIN CONTAINER */}
      <div className="w-full h-full flex flex-col bg-primary px-3 sm:px-6 lg:px-28 py-3">
        {/* TITLE */}
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
          Meat
        </h1>

        {/* SUB CATEGORIES (mobile optimized horizontal scroll) */}
        <div className="mt-3 border-b border-white/10">
          <div className="flex gap-12 overflow-x-auto no-scrollbar py-2">
            {subCategories.map((item) => (
              <button
                key={item}
                onClick={() => setActive(item)}
                className={`pb-2 text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0
                  ${
                    active === item
                      ? "text-secondary font-semibold border-b-2 border-secondary"
                      : "text-gray-500 hover:text-secondary"
                  }
                `}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* PRODUCTS */}
        <div className="mt-4 flex-1 overflow-y-auto no-scrollbar">
          {/* ACTIVE LABEL */}
          <p className="text-xs sm:text-sm text-gray-500 mb-3">
            Showing:{" "}
            <span className="font-semibold text-secondary">{active}</span>
          </p>

          {/* GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5 pb-10 mt-1">
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
            <ProductCard />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Categories;
