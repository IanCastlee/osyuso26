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
    <div className="w-full bg-gray-100 lg:px-3 sm:px-6 lg:px-28">
      <div className="w-full flex flex-col bg-primary">
        {/* BANNER */}
        <div className="w-full h-[160px] sm:h-[200px] md:h-[220px] relative">
          <LazyLoadImage src={bgImage} className="w-full h-full object-cover" />

          {/* PROFILE */}
          <div
            className="
            w-[80px] h-[80px]
            sm:w-[100px] sm:h-[100px]
            md:w-[120px] md:h-[120px]
            rounded-full absolute left-3 sm:left-6 -bottom-0 lg:-bottom-10 sm:-bottom-12
            overflow-hidden border-4 border-white
          "
          >
            <LazyLoadImage
              src={profileImage}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* SHOP INFO */}
        <div
          className="
          w-full flex flex-col sm:flex-row sm:justify-between
          items-start sm:items-center
          pl-3 sm:pl-28 md:pl-36
          pr-3  mt-2 gap-2
        "
        >
          <div className="flex flex-col">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">
              Linda Rim
            </h2>

            <span className="flex items-center gap-1 text-[11px] sm:text-xs text-secondary">
              <CiLocationOn /> San Bernardo, Bulusan Sorsogon
            </span>
          </div>

          {/* CATEGORIES DISPLAY */}
          <span className="flex flex-wrap items-center gap-1 text-xs sm:text-sm text-secondary">
            <CiShoppingBasket className="text-lg sm:text-2xl" />

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
        <div
          className="
          flex gap-4 sm:gap-6 md:gap-8
          mt-6 border-b border-gray-200
          px-3 sm:px-4 overflow-x-auto
          whitespace-nowrap mt-4
        "
        >
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setActiveCategory(item)}
              className={`pb-3 text-xs sm:text-sm font-medium transition-all
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

        {/* CONTENT LABEL */}
        <div className="mt-4 px-3 sm:px-4">
          <p className="text-[11px] sm:text-xs text-gray-600">
            Showing: <span className="font-semibold">{activeCategory}</span>
          </p>
        </div>

        {/* PRODUCTS */}
        <div
          className="
          grid grid-cols-2
          sm:grid-cols-3
          md:grid-cols-4
          lg:grid-cols-5
          gap-3 sm:gap-6
          pb-6 px-3 sm:px-4
        "
        >
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
