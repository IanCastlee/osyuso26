import React from "react";
import { useNavigate } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { FiShoppingCart } from "react-icons/fi";

function ProductCard({
  id,
  name,
  price,
  originalPrice,
  finalPrice,
  isOnSale,
  saleLabel,
  image,
  seller,
  stock,
  unitType,
}) {
  const navigate = useNavigate();

  const stockCount = Number(stock || 0);
  const isAvailable = stockCount > 0;

  const computedOriginalPrice = Number(originalPrice ?? price ?? 0);
  const computedFinalPrice = Number(finalPrice ?? price ?? 0);

  const hasSale =
    Number(isOnSale) === 1 && computedFinalPrice < computedOriginalPrice;

  const formattedStock =
    unitType === "kg"
      ? `${stockCount.toLocaleString()} kg`
      : `${stockCount.toLocaleString()} pcs`;

  const handleBuyNow = (e) => {
    e.stopPropagation();
    if (!isAvailable) return;

    navigate(`/reserve/${id}`);
  };

  return (
    <article
      onClick={handleBuyNow}
      className="group flex h-full min-h-[330px] cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <LazyLoadImage
          src={image || "/placeholder.png"}
          alt={name}
          effect="opacity"
          wrapperClassName="block h-full w-full"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/0 to-black/0 opacity-0 transition group-hover:opacity-100" />

        {!isAvailable && (
          <div className="absolute left-0 top-0 z-10">
            <span className="inline-flex bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm ring-1 ring-white/50">
              SOLD OUT
            </span>
          </div>
        )}

        {hasSale && (
          <div className="absolute right-0 top-0 z-10">
            <span className="inline-flex  bg-orange-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm ring-1 ring-white/50">
              {saleLabel || "SALE"}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <div>
          <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-5 text-slate-950 transition group-hover:text-orange-600">
            {name}
          </h3>

          <div className="mt-1 space-y-0.5">
            <p className="line-clamp-1 text-xs text-slate-500">
              {seller || "Unknown Seller"}
            </p>

            <p
              className={`line-clamp-1 text-xs font-medium ${
                isAvailable ? "text-slate-500" : "text-red-500"
              }`}
            >
              Stock: {isAvailable ? formattedStock : "Unavailable"}
            </p>
          </div>

          <div className="mt-3 min-h-[48px]">
            {hasSale ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 line-through">
                    ₱{computedOriginalPrice.toFixed(2)}
                  </span>

                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                    Deal
                  </span>
                </div>

                <p className="mt-0.5 text-lg font-bold leading-tight text-orange-500">
                  ₱{computedFinalPrice.toFixed(2)}
                </p>
              </>
            ) : (
              <p className="text-lg font-bold leading-tight text-secondary">
                ₱{computedOriginalPrice.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-auto pt-3">
          <button
            type="button"
            disabled={!isAvailable}
            onClick={handleBuyNow}
            className="flex cursor-pointer h-10 w-full items-center justify-center gap-2 rounded-lg bg-secondary px-3 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            <FiShoppingCart className="text-sm" />
            {isAvailable ? "Buy Now" : "Unavailable"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
