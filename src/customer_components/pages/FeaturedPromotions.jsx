import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiClock,
  FiExternalLink,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { FaBullhorn } from "react-icons/fa";

import useGetData from "../../hooks/useGetData";
import offer1 from "../../assets/hero_images/offer1.png";

const ASSET_BASE_URL = "http://localhost/OSYUSO26/backend/";

function FeaturedPromotions() {
  const navigate = useNavigate();
  const { data, loading } = useGetData("promotion/get-featured-promotions.php");

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const getImageUrl = (path) => {
    if (!path) return offer1;
    if (path.startsWith("http")) return path;
    return ASSET_BASE_URL + path.replace(/^(\.\.\/|\/)+/, "");
  };

  const formatDate = (value) => {
    if (!value) return "Not set";

    const date = new Date(String(value).replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const offers = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }, [data]);

  const filteredOffers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return offers;

    return offers.filter((item) => {
      return [
        item.title,
        item.description,
        item.tag,
        item.product_name,
        item.shop_name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [offers, search]);

  const handleShopNow = (offer) => {
    if (!offer?.product_id) return;
    navigate(`/reserve/${offer.product_id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-secondary"
          >
            <FiArrowLeft />
            Back
          </button>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-secondary">
                <FaBullhorn className="text-xl" />
              </span>

              <div>
                <h1 className="text-2xl font-bold text-slate-950">
                  Featured Promotions
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Browse active vendor promos and featured products.
                </p>
              </div>
            </div>

            <div className="relative w-full lg:w-80">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search promotions..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-secondary focus:bg-white"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-2xl bg-white shadow-sm"
              />
            ))}
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <FaBullhorn className="text-2xl" />
            </div>

            <h2 className="mt-4 text-base font-bold text-slate-900">
              No featured promotions found
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Active paid promotions will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOffers.map((offer) => (
              <button
                key={offer.id}
                type="button"
                onClick={() => setSelected(offer)}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-orange-200 hover:shadow-md"
              >
                <div className="relative h-48 bg-slate-100">
                  <img
                    src={getImageUrl(offer.image_path)}
                    alt={offer.title}
                    onError={(e) => {
                      e.currentTarget.src = offer1;
                    }}
                    className="h-full w-full object-cover"
                  />

                  <span className="absolute left-3 top-3 rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    {offer.tag || "Featured"}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="line-clamp-2 text-base font-bold text-slate-950">
                    {offer.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                    {offer.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-900">
                        {offer.product_name || "Featured product"}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {offer.shop_name || "OSYUSO vendor"}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs font-semibold text-secondary">
                      View
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="relative h-56 bg-slate-100 sm:h-72">
              <img
                src={getImageUrl(selected.image_path)}
                alt={selected.title}
                onError={(e) => {
                  e.currentTarget.src = offer1;
                }}
                className="h-full w-full object-cover"
              />

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white"
              >
                <FiX />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-secondary">
                {selected.tag || "Featured"}
              </span>

              <h2 className="mt-3 text-xl font-bold text-slate-950 sm:text-2xl">
                {selected.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selected.description}
              </p>

              <div className="mt-5 rounded-xl bg-orange-50 p-4">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-orange-500">
                  <FiClock />
                  Active Until
                </p>
                <p className="mt-2 text-sm font-semibold text-orange-800">
                  {formatDate(selected.expires_at)}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => handleShopNow(selected)}
                  disabled={!selected.product_id}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Shop Now
                  <FiExternalLink />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeaturedPromotions;
