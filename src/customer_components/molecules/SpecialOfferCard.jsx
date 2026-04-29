import React, { useEffect, useState } from "react";
import offer1 from "../../assets/hero_images/offer3.png";
import offer2 from "../../assets/hero_images/offer2.png";
import offer3 from "../../assets/hero_images/offer1.png";

const offers = [
  {
    id: 1,
    title: "Special Vendor Offer!",
    description:
      "Get fresh meat products at discounted prices from local sellers near you.",
    tag: "🔥 LIMITED OFFER",
    image: offer1,
  },
  {
    id: 2,
    title: "Fresh Chicken Deals",
    description:
      "Enjoy fresh and affordable chicken cuts straight from local farms.",
    tag: "🥩 HOT DEAL",
    image: offer2,
  },
  {
    id: 3,
    title: "Weekend Veggie Sale",
    description:
      "Fresh vegetables at low prices only this weekend. Don’t miss out!",
    tag: "🥬 SALE",
    image: offer3,
  },
];

function SpecialOfferCard() {
  const [index, setIndex] = useState(0);

  // AUTO SLIDE
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % offers.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const current = offers[index];

  return (
    <div className="w-full h-[150px] lg:h-auto lg:max-h-[300px] flex flex-row rounded-lg lg:rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 text-white relative">
      {/* IMAGE */}
      <div className="w-[35%] h-full overflow-hidden relative">
        <img
          src={current.image}
          alt="offer"
          className="w-full h-full object-cover lg:object-contain  lg:object-center scale-x-[-1] transition-all duration-500"
        />
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* CONTENT */}
      <div className="w-[65%] p-4 flex flex-col justify-center gap-2 transition-all duration-500">
        {/* TAG */}
        <span className="text-[10px] lg:text-xs font-semibold bg-white/20 w-fit px-2 lg:px-3 py-0 lg:py-1 rounded-full backdrop-blur-md">
          {current.tag}
        </span>

        {/* TITLE */}
        <h2 className="text-sm md:text-xl lg:text-3xl font-bold leading-tight">
          {current.title}
        </h2>

        {/* DESCRIPTION */}
        <p className="text-[10px] lg:text-sm text-white/90 leading-snug">
          {current.description}
        </p>

        {/* BUTTON */}
        <button className="mt-0 lg:mt-2 w-fit px-2 lg:px-4 py-0 lg:py-1 text-[10px] lg:text-sm bg-white text-orange-500 font-semibold rounded-md hover:bg-gray-100 transition">
          Shop Now
        </button>
      </div>

      {/* DOTS */}
      <div className="absolute bottom-2 right-4 flex gap-1 lg:gap-2">
        {offers.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-1 lg:w-2 h-1 lg:h-2 rounded-full transition-all ${
              index === i ? "bg-white scale-110" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default SpecialOfferCard;
