import React from "react";
import SpecialOfferCard from "../molecules/SpecialOfferCard";
import adobo from "../../assets/hero_images/adobo.jpg";
import milkTea from "../../assets/hero_images/milktea2.webp";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useNavigate } from "react-router-dom";

function CustomerHero() {
  const navigate = useNavigate();

  const promos = [
    {
      id: 1,
      image: adobo,
      title: "Fresh Meals",
      subtitle: "Local favorites",
    },
    {
      id: 2,
      image: milkTea,
      title: "New Shops",
      subtitle: "Explore arrivals",
    },
  ];

  return (
    <section className="mt-3 w-full">
      <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
        <div className="min-w-0">
          <SpecialOfferCard />
        </div>

        <aside className="lg:h-[331px] rounded-t-xl lg:rounded-xl bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">New Arrival</h2>
            </div>

            <button
              onClick={() => navigate("/all-markets")}
              className="text-xs font-semibold text-orange-500 hover:opacity-80"
            >
              See all
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            {promos.map((promo) => (
              <button
                key={promo.id}
                type="button"
                onClick={() => navigate("/all-markets")}
                className="group relative h-28 overflow-hidden rounded-lg text-left shadow-sm lg:h-[121px]"
              >
                <LazyLoadImage
                  src={promo.image}
                  alt={promo.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="text-sm font-bold text-white">{promo.title}</p>
                  <p className="mt-0.5 text-xs text-white/80">
                    {promo.subtitle}
                  </p>
                </div>

                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-secondary opacity-0 shadow-sm transition group-hover:opacity-100">
                  Visit
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default CustomerHero;
