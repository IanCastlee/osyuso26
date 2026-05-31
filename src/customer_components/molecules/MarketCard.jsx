import React from "react";
import { useNavigate } from "react-router-dom";
import { FaStore } from "react-icons/fa";
import { FiClock } from "react-icons/fi";
import defaultLogo from "../../assets/assets_osyuso/shop.png";
import defaultCover from "../../assets/assets_osyuso/defaultCover.webp";

function MarketCard({ market }) {
  const navigate = useNavigate();

  const isClosed = Number(market?.is_shop_open) !== 1;

  const handleClick = () => {
    if (isClosed) return;
    navigate(`/market/${market.user_id}`);
  };

  const shopName =
    market.shop_name && market.shop_name.length > 16
      ? market.shop_name.slice(0, 16) + "..."
      : market.shop_name || "No Shop Name";

  return (
    <div
      onClick={handleClick}
      aria-disabled={isClosed}
      className={`
        relative overflow-hidden
        w-full
        h-[210px]
        bg-white/60 backdrop-blur-md
        border border-gray-200/70
        rounded-2xl
        shadow-xs hover:shadow-sm
        transition-all duration-300
        group
        ${
          isClosed
            ? "cursor-not-allowed opacity-90"
            : "cursor-pointer hover:-translate-y-1"
        }
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 transition duration-300 group-hover:opacity-100" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-0">
        <div
          className="relative flex h-[110px] w-full items-end justify-center overflow-hidden bg-gray-200 p-2"
          style={{
            backgroundImage: `url(${market.shop_cover_photo || defaultCover})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/20" />

          <div className="absolute inset-0 rounded-full bg-primary/20 blur-lg scale-110 transition duration-300 group-hover:scale-125" />

          <img
            src={market.shop_logo || defaultLogo}
            alt={market.shop_name || "Shop"}
            className="
              relative z-10
              h-[78px] w-[78px]
              rounded-full object-cover
              border-4 border-white
              shadow-lg
              transition-transform duration-300
              group-hover:scale-105
            "
          />
        </div>

        <div className="mt-4 text-center">
          <h3 className="text-sm font-bold tracking-wide text-gray-800">
            {shopName}
          </h3>

          <p className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
            <FaStore className="text-[12px]" />
            Marketplace
          </p>
        </div>

        <div
          className={`
            mt-4 flex items-center gap-1
            text-[10px] font-semibold
            transition-all duration-300
            ${
              isClosed
                ? "text-red-500 opacity-100"
                : "text-secondary opacity-0 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100"
            }
          `}
        >
          {isClosed && <FiClock />}
          {isClosed ? "Closed Now" : "Visit Shop"}
        </div>
      </div>

      {isClosed && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/60 px-4 text-center backdrop-blur-[1px]">
          <div>
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white">
              <FiClock />
            </div>

            <p className="mt-2 text-sm font-black text-white">Shop is closed</p>

            <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/80">
              {market.shop_closed_message ||
                "This shop is not accepting orders right now."}
            </p>

            {market.shop_opens_at && market.shop_closes_at && (
              <p className="mt-2 text-[10px] font-semibold text-white/70">
                Hours: {market.shop_opens_at.slice(0, 5)} -{" "}
                {market.shop_closes_at.slice(0, 5)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketCard;
