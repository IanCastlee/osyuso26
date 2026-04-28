import React, { useState } from "react";
import bgImage from "../../../../assets_osyuso/bg.webp";
import profileImage from "../../../../assets_osyuso/shop.png";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { CiLocationOn, CiShoppingBasket } from "react-icons/ci";
import ProductCard from "../molecules/ProductCard";

const categories = ["Meat", "Fruits", "Vegetables"];

function Market() {
  const [activeCategory, setActiveCategory] = useState("Meat");

  return (
    <div className="w-full bg-gray-100 px-28">
      <div className="w-full h-full overflow-y-auto no-scrollbar flex flex-col bg-primary">
        {/* Banner */}
        <div className="w-full h-[200px] relative">
          <LazyLoadImage
            src={bgImage}
            className="w-full h-full object-cover transition-transform duration-300"
          />

          {/* Profile */}
          <div className="w-[120px] h-[120px] rounded-full absolute left-6 -bottom-12 overflow-hidden border-4 border-white">
            <LazyLoadImage
              src={profileImage}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Shop Info */}
        <div className="w-full flex justify-between items-center pl-36 pr-2 mt-2">
          <div className="flex flex-col">
            <h2 className="text-2xl font-semibold">Linda Rim</h2>
            <span className="flex items-center gap-1 text-xs text-secondary">
              <CiLocationOn /> San Bernardo, Bulusan Sorsogon
            </span>
          </div>

          <span className="flex items-center gap-1 text-sm text-secondary">
            <CiShoppingBasket className="text-2xl" />

            {categories.map((item, index) => (
              <span key={item} className="flex items-center">
                {item}
                {index !== categories.length - 1 && (
                  <span className="mx-1">/</span>
                )}
              </span>
            ))}
          </span>
        </div>

        {/* CATEGORY TABS */}
        <div className="flex gap-8 mt-6 border-b border-gray-200 mt-10 px-4">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setActiveCategory(item)}
              className={`pb-3 text-sm font-medium transition-all
                ${
                  activeCategory === item
                    ? "text-secondary border-b-2 border-secondary"
                    : "text-gray-500 hover:text-secondary"
                }
              `}
            >
              {item}
            </button>
          ))}
        </div>

        {/* CONTENT AREA */}
        <div className="mt-6 px-4">
          <p className="text-xs text-gray-600">
            Showing: <span className="font-semibold">{activeCategory}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pb-6 px-4">
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
          <ProductCard />
        </div>
      </div>
    </div>
  );
}

export default Market;
