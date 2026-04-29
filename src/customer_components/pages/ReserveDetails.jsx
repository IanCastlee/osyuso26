import React, { useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import meatImage from "../../../../assets_osyuso/meatProduct.jpeg";
import profileImage from "../../../../assets_osyuso/shop.png";

import { CiLocationOn } from "react-icons/ci";
import { CiShop } from "react-icons/ci";
import { BsCartPlus } from "react-icons/bs";

function ReserveDetails() {
  const [weight, setWeight] = useState(0.5);
  const pricePerKg = 280;

  const total = weight * pricePerKg;

  return (
    <div className="w-full bg-gray-100 px-1 lg:px-4 sm:px-10 lg:px-28">
      {/* PRODUCT SECTION */}
      <div className="w-full bg-primary pb-4 p-0 lg:p-4 flex flex-col lg:flex-row gap-8">
        {/* IMAGE */}
        <div className="w-full lg:w-[40%] h-[220px] sm:h-[300px] overflow-hidden">
          <LazyLoadImage
            src={meatImage}
            className="w-full h-full object-cover"
          />
        </div>

        {/* DETAILS */}
        <div className="flex-1 flex flex-col px-2 lg:px-0 gap-2 lg:gap-4">
          {/* NAME */}
          <h1 className="text-base sm:text-xl md:text-2xl font-semibold text-primary leading-snug">
            Premium Pork Belly
          </h1>

          {/* PRICE */}
          <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-orange-700 bg-yellow-50 p-3 rounded-md w-fit">
            ₱{pricePerKg} / kg
          </p>

          {/* DESCRIPTION */}
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Fresh, locally sourced pork belly perfect for grilling, frying.
          </p>

          {/* WEIGHT */}
          <div className="flex items-center gap-3 mt-4">
            <span className="text-xs sm:text-sm font-medium">Weight:</span>

            <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
              <button
                onClick={() => setWeight(weight > 0.5 ? weight - 0.5 : 0.5)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-sm"
              >
                -
              </button>

              <span className="px-3 sm:px-4 text-xs sm:text-sm">
                {weight} kg
              </span>

              <button
                onClick={() => setWeight(weight + 0.5)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* TOTAL */}
          <p className="text-sm sm:text-base md:text-lg font-semibold text-primary">
            Total: <span className="text-secondary">₱{total}</span>
          </p>

          {/* ACTIONS */}
          <div className="flex gap-3 mt-6 flex-wrap sm:flex-nowrap">
            <button className="px-4 sm:px-5 py-2 text-xs sm:text-sm bg-secondary text-white hover:opacity-90 transition rounded-md">
              Buy Now
            </button>

            <button className="flex items-center gap-1 px-4 sm:px-5 py-2 text-xs sm:text-sm border border-secondary text-secondary hover:bg-secondary hover:text-white transition rounded-md">
              <BsCartPlus /> Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* SHOP SECTION */}
      <div className="w-full flex flex-col bg-primary h-auto mt-3 p-4">
        <div className="w-full flex flex-col md:flex-row gap-4">
          <LazyLoadImage
            src={profileImage}
            className="w-[70px] h-[70px] sm:w-[90px] sm:h-[90px] object-cover"
          />

          <div className="flex w-full justify-between flex-col md:flex-row gap-4">
            <div className="flex flex-col">
              <h2 className="text-sm sm:text-base font-semibold">
                Juan Meat Shop
              </h2>

              <span className="flex items-center gap-1 text-[10px] sm:text-xs text-secondary">
                <CiLocationOn /> San Bernardo, Bulusan Sorsogon
              </span>

              <button className="flex w-fit text-[10px] sm:text-xs mt-2 items-center gap-1 px-4 py-1 lg:py-2 border border-gray-200 text-secondary hover:bg-secondary hover:text-white transition rounded-md">
                <CiShop className="text-sm" /> View Shop
              </button>
            </div>

            <div className="flex flex-col gap-2 text-[10px] sm:text-xs md:text-sm">
              <div className="flex gap-2 md:gap-5">
                <span className="text-secondary">Category:</span>
                <span className="text-orange-800">Meat/Fruits/Vegetables</span>
              </div>

              <div className="flex gap-2 md:gap-5">
                <span className="text-secondary">Joined:</span>
                <span className="text-orange-800">2 years ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="flex flex-col w-full mt-5">
          <h2 className="text-xs sm:text-sm text-primary font-semibold">
            Shop Description:
          </h2>

          <p className="text-[11px] sm:text-sm text-secondary leading-relaxed">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur
            cupiditate, nesciunt, officia blanditiis...
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReserveDetails;
