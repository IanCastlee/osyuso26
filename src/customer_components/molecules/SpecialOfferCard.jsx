import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiClock,
  FiExternalLink,
  FiGrid,
  FiShoppingBag,
  FiX,
} from "react-icons/fi";

import useGetData from "../../hooks/useGetData";
import offer1 from "../../assets/hero_images/offer1.png";

const ASSET_BASE_URL = "http://localhost/OSYUSO26/backend/";

function SpecialOfferCard() {
  const navigate = useNavigate();

  const { data, loading } = useGetData("promotion/get-featured-promotions.php");

  const [index, setIndex] = useState(0);
  const [modal, setModal] = useState({
    type: "",
    offer: null,
  });

  const offers = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }, [data]);

  const current = offers[index] || {};

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

  const openDetails = (offer) => {
    setModal({
      type: "details",
      offer,
    });
  };

  const openAll = () => {
    setModal({
      type: "all",
      offer: null,
    });
  };

  const closeModal = () => {
    setModal({
      type: "",
      offer: null,
    });
  };

  const handleShopNow = (offer = current) => {
    if (!offer?.product_id) return;
    navigate(`/reserve/${offer.product_id}`);
  };

  useEffect(() => {
    if (!offers.length) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % offers.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [offers.length]);

  useEffect(() => {
    if (index >= offers.length) {
      setIndex(0);
    }
  }, [offers.length, index]);

  if (loading) {
    return (
      <div className="h-[180px] w-full animate-pulse overflow-hidden rounded-xl bg-white shadow-sm sm:h-[220px] lg:h-[300px]">
        <div className="flex h-full">
          <div className="h-full w-[38%] bg-gray-200" />

          <div className="flex flex-1 flex-col justify-center gap-3 p-4 sm:p-6">
            <div className="h-5 w-28 rounded-full bg-gray-200" />
            <div className="space-y-2">
              <div className="h-6 w-[85%] rounded bg-gray-200 lg:h-8" />
              <div className="h-6 w-[55%] rounded bg-gray-200 lg:h-8" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="h-3 w-[80%] rounded bg-gray-100" />
            </div>
            <div className="h-9 w-28 rounded-lg bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!offers.length) {
    return null;
  }

  return (
    <>
      <section
        role="button"
        tabIndex={0}
        onClick={() => openDetails(current)}
        onKeyDown={(e) => {
          if (e.key === "Enter") openDetails(current);
        }}
        className="relative h-[150px] w-full cursor-pointer overflow-hidden rounded-xl bg-secondary text-white shadow-sm transition hover:shadow-md sm:h-[220px] lg:h-[331px]"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate("/featured-promotions");
          }}
          className="absolute right-2 top-2 z-20 inline-flex h-5 items-center gap-0.5 rounded-full bg-white/90 px-1.5 text-[8px] font-bold leading-none text-secondary shadow-sm backdrop-blur transition hover:bg-white sm:right-3 sm:top-3 sm:h-7 sm:gap-1.5 sm:px-3 sm:text-xs"
        >
          <FiGrid className="text-[9px] sm:text-sm" />
          <span>See All</span>
        </button>

        <div className="flex h-full">
          <div className="relative h-full w-[36%] shrink-0 overflow-hidden bg-orange-600 sm:w-[38%]">
            <img
              src={getImageUrl(current?.image_path)}
              alt={current?.title || "Special offer"}
              onError={(e) => {
                e.currentTarget.src = offer1;
              }}
              className="h-full w-full scale-x-[-1] object-cover transition duration-500 sm:object-contain"
            />

            <div className="absolute inset-0 bg-black/10" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-3 pr-4 sm:p-6 lg:p-8">
            <span className="mb-1.5 w-fit max-w-[120px] truncate rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm sm:mb-2 sm:max-w-none sm:px-2.5 sm:py-1 sm:text-xs">
              {current?.tag || "Limited Offer"}
            </span>

            <h2 className="line-clamp-2 pr-12 text-sm font-bold leading-tight sm:pr-0 sm:text-2xl lg:text-4xl">
              {current?.title || "Special Vendor Offer!"}
            </h2>

            <p className="mt-1 line-clamp-2 pr-2 text-[10px] leading-4 text-white/85 sm:mt-2 sm:text-sm sm:leading-5 lg:mt-3 lg:max-w-xl lg:text-base">
              {current?.description || "Don't miss out on this amazing offer!"}
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleShopNow(current);
              }}
              disabled={!current?.product_id}
              className="mt-2 inline-flex h-5 w-fit cursor-pointer items-center justify-center rounded-md bg-white px-2.5 text-[10px] font-semibold leading-none text-secondary shadow-sm transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-4 sm:h-auto sm:rounded-lg sm:px-4 sm:py-2 sm:text-sm"
            >
              Shop Now
            </button>
          </div>
        </div>

        {offers.length > 1 && (
          <div className="absolute bottom-2 right-3 z-20 flex items-center gap-1 sm:bottom-3 sm:right-4 sm:gap-1.5">
            {offers.map((offer, i) => (
              <button
                key={offer?.id || i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(i);
                }}
                aria-label={`Go to offer ${i + 1}`}
                className={`h-1.5 rounded-full transition-all sm:h-2 ${
                  index === i
                    ? "w-4 bg-white sm:w-5"
                    : "w-1.5 bg-white/45 sm:w-2"
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {modal.type === "details" && modal.offer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="relative h-56 bg-slate-100 sm:h-72">
              <img
                src={getImageUrl(modal.offer.image_path)}
                alt={modal.offer.title}
                onError={(e) => {
                  e.currentTarget.src = offer1;
                }}
                className="h-full w-full object-cover"
              />

              <button
                type="button"
                onClick={closeModal}
                className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white"
              >
                <FiX />
              </button>

              <span className="absolute bottom-4 left-4 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
                {modal.offer.tag || "Featured"}
              </span>
            </div>

            <div className="p-5 sm:p-6">
              <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
                {modal.offer.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {modal.offer.description}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    <FiShoppingBag />
                    Product
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {modal.offer.product_name || "Featured product"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {modal.offer.shop_name || "OSYUSO vendor"}
                  </p>
                </div>

                <div className="rounded-xl bg-orange-50 p-4">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-orange-500">
                    <FiClock />
                    Active Until
                  </p>
                  <p className="mt-2 text-sm font-semibold text-orange-800">
                    {formatDate(modal.offer.expires_at)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => handleShopNow(modal.offer)}
                  disabled={!modal.offer.product_id}
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

      {modal.type === "all" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Featured Promotions
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Browse all active featured offers.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
              >
                <FiX />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {offers.map((offer) => (
                  <button
                    key={offer.id}
                    type="button"
                    onClick={() => openDetails(offer)}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-orange-200 hover:shadow-md"
                  >
                    <div className="h-36 bg-slate-100">
                      <img
                        src={getImageUrl(offer.image_path)}
                        alt={offer.title}
                        onError={(e) => {
                          e.currentTarget.src = offer1;
                        }}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="p-4">
                      <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-secondary">
                        {offer.tag || "Featured"}
                      </span>

                      <h3 className="mt-3 line-clamp-2 text-sm font-bold text-slate-950">
                        {offer.title}
                      </h3>

                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {offer.description}
                      </p>

                      <p className="mt-3 text-xs font-semibold text-slate-400">
                        Until {formatDate(offer.expires_at)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SpecialOfferCard;
