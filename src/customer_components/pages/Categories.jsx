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
    <div className="w-full bg-gray-100 px-28">
      <div className="w-full h-full flex flex-col bg-primary p-4">
        {/* TITLE (fixed top) */}
        <h1 className="text-2xl font-bold text-primary mt-4">Meat</h1>

        {/* SUB CATEGORIES (ALWAYS VISIBLE) */}
        <div className="flex gap-8 mt-6 border-b border-gray-200 overflow-x-auto">
          {subCategories.map((item) => (
            <button
              key={item}
              onClick={() => setActive(item)}
              className={`pb-3 text-sm font-medium whitespace-nowrap transition-all
              ${
                active === item
                  ? "text-secondary border-b-2 border-secondary"
                  : "text-gray-500 hover:text-secondary"
              }
            `}
            >
              {item}
            </button>
          ))}
        </div>

        {/* PRODUCT SECTION (ONLY THIS SCROLLS) */}
        <div className="mt-6 flex-1 overflow-y-auto no-scrollbar">
          <p className="text-gray-600 mb-4">
            Showing: <span className="font-semibold">{active}</span>
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pb-6">
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
