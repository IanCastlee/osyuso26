import React from "react";
import meat from "../../../../assets_osyuso/shop.png";

function MarketCard() {
  return (
    <>
      <div
        className="w-[100px] h-[120px] flex flex-col items-center justify-center 
  border border-gray-200 rounded-md
  hover:shadow-xl transition-all duration-300 
  cursor-pointer group bg-white"
      >
        {/* Image */}
        <div className="flex items-center justify-center">
          <img
            src={meat}
            alt="Meat"
            className="h-[50px] w-[50px] object-contain group-hover:scale-110 transition-transform duration-300"
          />
        </div>

        {/* Text */}
        <div className="mt-2 flex items-center justify-center">
          <span className="text-sm font-semibold text-primary">Shop Name</span>
        </div>
      </div>
    </>
  );
}

export default MarketCard;
