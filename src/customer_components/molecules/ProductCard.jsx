import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { FiShoppingCart } from "react-icons/fi";

import fetchInstance from "../../utils/fetchInstance";
import ButtonLoader from "../../reusable_components/ButtonLoader";

function ProductCard({ id, name, price, image, seller, stock }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleProtectedNav = async (e) => {
    e.stopPropagation();

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
      onClick={() => navigate(`/product/${id}`)}
      className="
        w-full
        bg-white
        overflow-hidden
        border border-gray-100
        shadow-sm
        hover:shadow-lg
        transition-all duration-300
        cursor-pointer
        group
      "
    >
      {/* IMAGE */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100">
        {/* STOCK BADGE */}
        <div className="absolute top-2 left-2 z-10">
          {stock > 0 ? (
            <span
              className="
                bg-emerald-500
                text-white
                text-[8px] sm:text-[10px]
                font-semibold
                px-2 py-[3px]
                shadow-sm
              "
            >
              {stock} STOCK
            </span>
          ) : (
            <span
              className="
                bg-red-500
                text-white
                text-[8px] sm:text-[10px]
                font-semibold
                px-2 py-[3px]
                shadow-sm
              "
            >
              SOLD OUT
            </span>
          )}
        </div>

        {/* IMAGE */}
        <LazyLoadImage
          src={image || "/placeholder.png"}
          alt={name}
          effect="opacity"
          wrapperClassName="w-full h-full"
          className="
            w-full
            h-full
            min-w-full
            min-h-full
            object-cover
            group-hover:scale-105
            transition-transform duration-500
          "
        />

        {/* OVERLAY */}
        <div
          className="
            absolute inset-0
            bg-black/10
            opacity-0
            group-hover:opacity-100
            transition duration-300
          "
        />
      </div>

      {/* CONTENT */}
      <div className="p-2 sm:p-3 flex flex-col gap-1">
        {/* PRODUCT NAME */}
        <h3
          className="
            text-[11px] sm:text-sm
            font-semibold
            text-primary
            line-clamp-1
            group-hover:text-primary/80
            transition
          "
        >
          {name}
        </h3>

        {/* PRICE */}
        <p className="text-secondary font-bold text-[11px] sm:text-sm">
          ₱{price}
        </p>

        {/* SELLER */}
        <p className="text-[9px] sm:text-xs text-gray-500 line-clamp-1">
          Seller: {seller || "Unknown Seller"}
        </p>

        {/* ACTIONS */}
        <div className="flex items-center justify-end mt-2">
          <button
            disabled={loading || stock <= 0}
            onClick={handleProtectedNav}
            className="
              h-[28px] sm:h-[34px]
              flex items-center justify-center gap-1
              text-[10px] sm:text-xs
              bg-secondary
              text-white
              px-3 sm:px-4
              hover:opacity-90
              transition
              disabled:opacity-50
              disabled:cursor-not-allowed
              shadow-sm
            "
          >
            {loading ? (
              <ButtonLoader />
            ) : (
              <>
                <FiShoppingCart className="text-[11px] sm:text-sm" />
                Buy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
