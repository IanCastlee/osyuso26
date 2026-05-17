import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { FiShoppingCart } from "react-icons/fi";

import fetchInstance from "../../utils/fetchInstance";
import ButtonLoader from "../../reusable_components/ButtonLoader";

function ProductCard({ id, name, price, image, seller, stock }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const isAvailable = Number(stock) > 0;
  const formattedPrice = Number(price || 0).toFixed(2);

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
    <article
      onClick={() => navigate(`/product/${id}`)}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        <div className="absolute left-2 top-2 z-10">
          <span
            className={`rounded-full px-2 py-1 text-[9px] font-semibold shadow-sm sm:text-[10px] ${
              isAvailable
                ? "bg-emerald-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {isAvailable ? `${stock} STOCK` : "SOLD OUT"}
          </span>
        </div>

        <LazyLoadImage
          src={image || "/placeholder.png"}
          alt={name}
          effect="opacity"
          wrapperClassName="h-full w-full block"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 min-h-[36px] text-xs font-semibold leading-5 text-gray-900 transition group-hover:text-secondary sm:text-sm">
          {name}
        </h3>

        <p className="mt-1 text-sm font-bold text-secondary sm:text-base">
          ₱{formattedPrice}
        </p>

        <p className="mt-1 line-clamp-1 text-[11px] text-gray-500 sm:text-xs">
          {seller || "Unknown Seller"}
        </p>

        <button
          disabled={loading || !isAvailable}
          onClick={handleProtectedNav}
          className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-secondary px-3 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <ButtonLoader />
          ) : (
            <>
              <FiShoppingCart className="text-sm" />
              {isAvailable ? "Buy Now" : "Unavailable"}
            </>
          )}
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
