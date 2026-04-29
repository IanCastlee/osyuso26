import React from "react";
import { useNavigate } from "react-router-dom";
import meatImage from "../../../../assets_osyuso/meatProduct.jpeg";
import { LazyLoadImage } from "react-lazy-load-image-component";

function ProductCard() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/reserve");
  };

  return (
    <div
      onClick={handleClick}
      className="w-full bg-white rounded-sm overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
    >
      {/* IMAGE */}
      <div className="w-full aspect-[4/3] overflow-hidden">
        <LazyLoadImage
          src={meatImage}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>

      {/* CONTENT */}
      <div className="p-2 sm:p-3 flex flex-col gap-1">
        <h3 className="text-xs sm:text-sm font-semibold text-primary line-clamp-1">
          Premium Pork Belly
        </h3>

        <p className="text-secondary font-bold text-xs sm:text-sm">₱280 / kg</p>

        <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-1">
          Seller: Juan Meat Shop
        </p>

        {/* BUTTON */}
        <div className="flex items-center justify-end mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate("/reserve");
            }}
            className="text-[10px] sm:text-xs bg-secondary text-white px-3 sm:px-4 py-1 rounded-xs hover:opacity-90 transition"
          >
            Buy
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
