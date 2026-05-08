import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { FiShoppingCart, FiArrowRight } from "react-icons/fi";
import { FaStore } from "react-icons/fa";
import fetchInstance from "../../utils/fetchInstance";
import ButtonLoader from "../../reusable_components/ButtonLoader";

function ProductCard({ id, name, price, image, seller, stock }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleProtectedNav = async () => {
    try {
      setLoading(true);

      await fetchInstance("auth/user.php");

      navigate(`/reserve/${id}`);
    } catch (err) {
      navigate("/signin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={handleProtectedNav}
      className="
        relative overflow-hidden
        bg-white rounded-2xl
        border border-gray-100
        shadow-sm hover:shadow-2xl
        transition-all duration-300
        hover:-translate-y-1
        cursor-pointer group
      "
    >
      {/* Hover Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition duration-300 z-0" />

      {/* IMAGE */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100">
        {/* Stock Badge */}
        <div
          className={`
            absolute top-3 left-3 z-20
            px-2 py-1 rounded-full text-[10px] font-semibold
            backdrop-blur-md
            ${
              stock > 0
                ? "bg-green-100/90 text-green-700"
                : "bg-red-100/90 text-red-700"
            }
          `}
        >
          {stock > 0 ? `${stock} In Stock` : "Out of Stock"}
        </div>

        <LazyLoadImage
          src={image || "/placeholder.png"}
          alt={name}
          className="
            w-full h-full object-cover
            group-hover:scale-110
            transition-transform duration-500
          "
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition duration-300" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 p-4 flex flex-col gap-2">
        {/* Product Name */}
        <h3 className="text-sm sm:text-base font-bold text-gray-800 line-clamp-1">
          {name}
        </h3>

        {/* Seller */}
        <div className="flex items-center gap-1 text-gray-500 text-xs">
          <FaStore className="text-[11px]" />
          <span className="line-clamp-1">{seller || "Unknown Seller"}</span>
        </div>

        {/* Price + Button */}
        <div className="flex items-center justify-between mt-2">
          {/* Price */}
          <div>
            <p className="text-lg font-extrabold text-secondary">₱{price}</p>
          </div>

          {/* Buy Button */}
          <button
            disabled={loading || stock <= 0}
            onClick={(e) => {
              e.stopPropagation();
              handleProtectedNav();
            }}
            className="
              flex items-center gap-1
              bg-primary text-white
              px-4 py-2 rounded-xl
              text-xs font-semibold
              hover:scale-105 hover:shadow-lg
              active:scale-95
              transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {loading ? (
              <ButtonLoader />
            ) : (
              <>
                <FiShoppingCart className="text-sm" />
                Buy
                <FiArrowRight className="text-sm" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
