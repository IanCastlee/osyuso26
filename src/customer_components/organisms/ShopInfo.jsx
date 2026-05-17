import React from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { CiLocationOn, CiShop } from "react-icons/ci";
import { FiPhone, FiMapPin } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import noShopLogo from "../../assets/icons/noShopLogo.png";

function ShopInfo({ product }) {
  const navigate = useNavigate();

  const shopRouteId =
    product?.vendor_id || product?.owner_id || product?.user_id;

  const handleViewShop = () => {
    if (shopRouteId) {
      navigate(`/market/${shopRouteId}`);
    }
  };

  return (
    <section className="mt-4 w-full rounded-xl bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <LazyLoadImage
            src={product?.profile_picture || noShopLogo}
            alt={product?.shop_name || "Shop"}
            effect="opacity"
            className="h-20 w-20 shrink-0 rounded-xl border border-gray-100 object-cover sm:h-24 sm:w-24"
          />

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
              Seller Information
            </p>

            <h2 className="mt-1 line-clamp-1 text-base font-bold text-gray-900 sm:text-lg">
              {product?.shop_name || "Unknown Shop"}
            </h2>

            <div className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-gray-500">
              <CiLocationOn className="mt-0.5 shrink-0 text-secondary" />
              <span>{product?.address || "No address available"}</span>
            </div>

            <button
              onClick={handleViewShop}
              disabled={!shopRouteId}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-secondary transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CiShop className="text-base" />
              View Shop
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:w-[360px]">
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <FiMapPin className="text-secondary" />
              Nearby
            </div>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {product?.nearby_landmark || "N/A"}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <FiPhone className="text-secondary" />
              Phone
            </div>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {product?.phone || "N/A"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Shop Description
        </h3>

        <p className="mt-2 text-sm leading-7 text-gray-600">
          {product?.shop_description || "No description available."}
        </p>
      </div>
    </section>
  );
}

export default ShopInfo;
