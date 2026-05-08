import React from "react";
import { useNavigate } from "react-router-dom";
import { FaStore } from "react-icons/fa";
import { FiChevronRight } from "react-icons/fi";
import defaultLogo from "../../assets/assets_osyuso/shop.png";

function MarketCard({ market }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/market/${market.user_id}`);
  };

  // Limit shop name
  const shopName =
    market.shop_name && market.shop_name.length > 16
      ? market.shop_name.slice(0, 16) + "..."
      : market.shop_name || "No Shop Name";

  return (
    <div
      onClick={handleClick}
      className="
        relative overflow-hidden
        w-[48%] sm:w-[180px] h-[210px]
        bg-white/80 backdrop-blur-md
        border border-gray-200/70
        rounded-2xl
        shadow-sm hover:shadow-2xl
        hover:-translate-y-1
        transition-all duration-300
        cursor-pointer group
      "
    >
      {/* Hover Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition duration-300" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        {/* Logo */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-lg scale-110 group-hover:scale-125 transition duration-300" />

          <img
            src={market.profile_picture || defaultLogo}
            alt={market.shop_name}
            className="
              relative
              h-[78px] w-[78px]
              object-cover rounded-full
              border-4 border-white
              shadow-lg
              group-hover:scale-105
              transition-transform duration-300
            "
          />
        </div>

        {/* Shop Info */}
        <div className="mt-4 text-center">
          <h3 className="text-sm font-bold text-gray-800 tracking-wide">
            {shopName}
          </h3>

          <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <FaStore className="text-[12px]" />
            Marketplace
          </p>
        </div>

        {/* CTA */}
        <div
          className="
            mt-4 flex items-center gap-1
            text-primary text-xs font-semibold
            opacity-0 group-hover:opacity-100
            translate-y-2 group-hover:translate-y-0
            transition-all duration-300
          "
        >
          Visit Shop
          <FiChevronRight className="text-[14px]" />
        </div>
      </div>
    </div>
  );
}

export default MarketCard;
