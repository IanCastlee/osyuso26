import React, { useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import meatImage from "../../../../assets_osyuso/meatProduct.jpeg";
import profileImage from "../../../../assets_osyuso/shop.png";

//ICONS
import { CiLocationOn } from "react-icons/ci";
import { CiShop } from "react-icons/ci";
import { BsCartPlus } from "react-icons/bs";

function ReserveDetails() {
  const [weight, setWeight] = useState(0.5); // start at 1/2 kg
  const pricePerKg = 280;

  const total = weight * pricePerKg;

  return (
    <div className="w-full bg-gray-100 px-28">
      <div className="w-full bg-primary p-4 flex flex-col md:flex-row gap-8">
        {/* IMAGE */}
        <div className="w-full md:w-[40%] h-[300px] overflow-hidden">
          <LazyLoadImage
            src={meatImage}
            className="w-full h-full object-cover"
          />
        </div>

        {/* DETAILS */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Name */}
          <h1 className="text-xl md:text-2xl font-semibold text-primary">
            Premium Pork Belly
          </h1>

          {/* Price */}
          <p className="text-3xl font-semibold text-orange-700 bg-yellow-50 p-4">
            ₱{pricePerKg} / kg
          </p>

          {/* Description */}
          <p className="text-sm text-gray-600">
            Fresh, locally sourced pork belly perfect for grilling, frying.
          </p>

          {/* WEIGHT SELECTOR */}
          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm font-medium">Weight:</span>

            <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
              <button
                onClick={() => setWeight(weight > 0.5 ? weight - 0.5 : 0.5)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
              >
                -
              </button>

              <span className="px-4 text-sm">{weight} kg</span>

              <button
                onClick={() => setWeight(weight + 0.5)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
              >
                +
              </button>
            </div>
          </div>

          {/* TOTAL PRICE */}
          <p className="text-lg font-semibold text-primary">Total: ₱{total}</p>

          {/* ACTIONS */}
          <div className="flex gap-4 mt-6">
            <button className="px-5 text-sm py-2 bg-secondary text-white hover:opacity-90 transition">
              Buy Now
            </button>

            <button className="flex text-sm items-center gap-1 px-5 py-2 border border-secondary text-secondary hover:bg-secondary hover:text-white transition">
              <BsCartPlus /> Add to Cart
            </button>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col bg-primary h-auto mt-3 p-4">
        <div className="w-full h-full flex flex-col md:flex-row ">
          <LazyLoadImage
            src={profileImage}
            className="w-[100px] h-[100px] object-cover"
          />

          <div className="flex w-full justify-between">
            <div className="flex flex-col">
              <h2>Juan Meat Shop</h2>
              <span className="flex items-center gap-1 text-xs text-secondary">
                <CiLocationOn /> San Bernardo, Bulusan Sorsogon
              </span>

              <button className="flex w-fit text-xs mt-2 items-center gap-1 px-5 py-2 border border-gray-200 text-secondary hover:bg-secondary hover:text-white transition">
                <CiShop className="text-sm" /> View Shop
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-5">
                <span className="flex items-center gap-1 text-xs text-secondary">
                  Category :
                </span>
                <span className="flex items-center gap-1 text-xs text-orange-800">
                  Meat/Fruits/Vegetables
                </span>
              </div>
              <div className="flex gap-5">
                <span className="flex items-center gap-1 text-xs text-secondary">
                  Joined :
                </span>
                <span className="flex items-center gap-1 text-xs text-orange-800">
                  2 years ago
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col w-full mt-5 pr-28">
          <h2 className="text-sm text-primary">Shop Description:</h2>
          <p className="text-sm text-secondary">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur
            cupiditate, nesciunt, officia blanditiis, eos provident ut est quos
            sapiente impedit voluptatem recusandae voluptates rerum laboriosam?
            Sunt reprehenderit laudantium itaque eveniet?
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReserveDetails;
