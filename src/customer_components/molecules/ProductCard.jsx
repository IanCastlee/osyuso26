import React from "react";
import { useNavigate } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { FiClock, FiShoppingCart } from "react-icons/fi";

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
  isShopOpen = 1,
  shopClosedMessage,
  shopOpensAt,
  shopClosesAt,
}) {
  const navigate = useNavigate();

  const stockCount = Number(stock || 0);
  const isAvailable = stockCount > 0;
  const isClosed = Number(isShopOpen) !== 1;
  const canBuy = isAvailable && !isClosed;

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
    if (!canBuy) return;

    navigate(`/reserve/${id}`);
  };

  const formatTime = (value) => {
    if (!value) return null;
    return String(value).slice(0, 5);
  };

  return (
    <article
      onClick={handleBuyNow}
      aria-disabled={!canBuy}
      className={`group relative flex h-full min-h-[330px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 ${
        canBuy
          ? "cursor-pointer hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
          : "cursor-not-allowed"
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <LazyLoadImage
          src={image || "/placeholder.png"}
          alt={name}
          effect="opacity"
          wrapperClassName="block h-full w-full"
          className={`h-full w-full object-cover transition duration-500 ${
            canBuy ? "group-hover:scale-105" : "grayscale-[0.25]"
          }`}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/0 to-black/0 opacity-0 transition group-hover:opacity-100" />

        {!isAvailable && (
          <div className="absolute left-0 top-0 z-10">
            <span className="inline-flex bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm ring-1 ring-white/50">
              SOLD OUT
            </span>
          </div>
        )}

        {isClosed && isAvailable && (
          <div className="absolute left-0 top-0 z-10">
            <span className="inline-flex bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm ring-1 ring-white/50">
              CLOSED
            </span>
          </div>
        )}

        {hasSale && !isClosed && (
          <div className="absolute right-0 top-0 z-10">
            <span className="inline-flex bg-orange-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm ring-1 ring-white/50">
              {saleLabel || "SALE"}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <div>
          <h3
            className={`line-clamp-2 min-h-[40px] text-sm font-semibold leading-5 transition ${
              canBuy
                ? "text-slate-950 group-hover:text-orange-600"
                : "text-slate-500"
            }`}
          >
            {name}
          </h3>

          <div className="mt-1 space-y-0.5">
            <p className="line-clamp-1 text-xs text-slate-500">
              {seller || "Unknown Seller"}
            </p>

            <p
              className={`line-clamp-1 text-xs font-medium ${
                isClosed
                  ? "text-red-500"
                  : isAvailable
                    ? "text-slate-500"
                    : "text-red-500"
              }`}
            >
              {isClosed
                ? "Shop is closed"
                : `Stock: ${isAvailable ? formattedStock : "Unavailable"}`}
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
            disabled={!canBuy}
            onClick={handleBuyNow}
            className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-secondary px-3 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            <FiShoppingCart className="text-sm" />
            {isClosed ? "Shop Closed" : isAvailable ? "Buy Now" : "Unavailable"}
          </button>
        </div>
      </div>

      {isClosed && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-700/60 px-4 text-center backdrop-blur-[1px]">
          <div>
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white">
              <FiClock />
            </div>

            <p className="mt-2 text-sm font-black text-white">Shop is closed</p>

            <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/80">
              {shopClosedMessage || "This product is not available right now."}
            </p>

            {shopOpensAt && shopClosesAt && (
              <p className="mt-2 text-[10px] font-semibold text-white/70">
                Hours: {formatTime(shopOpensAt)} - {formatTime(shopClosesAt)}
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export default ProductCard;
