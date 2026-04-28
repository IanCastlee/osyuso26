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
      className="w-[200px] bg-white rounded-sm overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
    >
      {/* Image */}
      <div className="w-full h-[140px] overflow-hidden">
        <LazyLoadImage
          src={meatImage}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-primary">
          Premium Pork Belly
        </h3>

        <p className="text-secondary font-bold text-sm">₱280 / kg</p>

        <p className="text-xs text-gray-500">Seller: Juan Meat Shop</p>

        <div className="flex items-center justify-end mt-2">
          {/* Prevent button from triggering card click */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate("/reserve");
            }}
            className="text-xs bg-secondary text-white px-4 py-1 rounded-xs hover:opacity-90 transition"
          >
            Buy
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
