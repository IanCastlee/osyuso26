import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import useGetData from "../../hooks/useGetData";
import offer1 from "../../assets/hero_images/offer1.png";

function SpecialOfferCard() {
  const navigate = useNavigate();

  const { data, loading } = useGetData("promotion/get-featured-promotions.php");

  const [index, setIndex] = useState(0);

  console.log(data);

  const offers = data || [];
  const current = offers[index] || {};

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
    <section className="relative h-[180px] w-full overflow-hidden rounded-xl bg-secondary text-white shadow-sm transition hover:shadow-md sm:h-[220px] lg:h-[331px]">
      <div className="flex h-full">
        <div className="relative h-full w-[40%] shrink-0 overflow-hidden bg-orange-600 sm:w-[38%]">
          <img
            src={current?.image_path || offer1}
            alt={current?.title || "Special offer"}
            className="h-full w-full scale-x-[-1] object-cover transition duration-500 sm:object-contain"
          />

          <div className="absolute inset-0 bg-black/10" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center p-4 pr-5 sm:p-6 lg:p-8">
          <span className="mb-2 w-fit rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm sm:text-xs">
            {current?.tag || "Limited Offer"}
          </span>

          <h2 className="line-clamp-2 text-lg font-bold leading-tight sm:text-2xl lg:text-4xl">
            {current?.title || "Special Vendor Offer!"}
          </h2>

          <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/85 sm:text-sm lg:mt-3 lg:max-w-xl lg:text-base">
            {current?.description || "Don't miss out on this amazing offer!"}
          </p>

          <button
            onClick={() => navigate(`/markets/${current.shop_id}`)}
            className="mt-3 w-fit rounded-lg bg-white px-4 py-2 text-xs font-semibold text-secondary shadow-sm transition hover:bg-orange-50 sm:mt-4 sm:text-sm"
          >
            Shop Now
          </button>
        </div>
      </div>

      {offers.length > 1 && (
        <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
          {offers.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to offer ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                index === i ? "w-5 bg-white" : "w-2 bg-white/45"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default SpecialOfferCard;
