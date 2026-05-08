import React, { useState } from "react";

import offer1 from "../../assets/hero_images/offer3.png";
import offer2 from "../../assets/hero_images/offer2.png";
import offer3 from "../../assets/hero_images/offer1.png";

const offers = [
  {
    id: 1,
    title: "Special Vendor Offer!",
    description:
      "Get fresh meat products at discounted prices from local sellers near you. Enjoy premium quality products and exclusive deals available for a limited time only.",
    tag: "🔥 LIMITED OFFER",
    image: offer1,
  },
  {
    id: 2,
    title: "Fresh Chicken Deals",
    description:
      "Enjoy fresh and affordable chicken cuts straight from local farms. Carefully selected daily to ensure freshness and quality for every customer.",
    tag: "🥩 HOT DEAL",
    image: offer2,
  },
  {
    id: 3,
    title: "Weekend Veggie Sale",
    description:
      "Fresh vegetables at low prices only this weekend. Don’t miss out on healthy and affordable produce for your family meals.",
    tag: "🥬 SALE",
    image: offer3,
  },
];

function AllSpecialOffer() {
  const [selectedOffer, setSelectedOffer] = useState(null);

  // LIMIT DESCRIPTION
  const truncateText = (text, limit) => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + "...";
  };

  return (
    <div className="w-full bg-gray-100 px-2 lg:px-28 py-4">
      <div className="w-full flex flex-col gap-4">
        {/* TITLE */}
        <h2 className="text-sm lg:text-lg font-bold text-primary">
          SPECIAL OFFERS
        </h2>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              onClick={() => setSelectedOffer(offer)}
              className="cursor-pointer flex flex-row h-[160px] lg:h-[220px] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 text-white group"
            >
              {/* IMAGE */}
              <div className="w-[38%] h-full overflow-hidden relative">
                <img
                  src={offer.image}
                  alt={offer.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-black/10"></div>
              </div>

              {/* CONTENT */}
              <div className="w-[62%] p-2 lg:p-4 flex flex-col justify-center gap-1 lg:gap-2">
                {/* TAG */}
                <span className="text-[9px] lg:text-xs font-semibold bg-white/20 w-fit px-2 py-[2px] lg:px-3 lg:py-1 rounded-full backdrop-blur-md">
                  {offer.tag}
                </span>

                {/* TITLE */}
                <h2 className="text-[13px] lg:text-xl font-bold leading-tight">
                  {offer.title}
                </h2>

                {/* DESCRIPTION */}
                <p className="text-[10px] lg:text-sm text-white/90 leading-snug">
                  {truncateText(offer.description, 55)}
                </p>

                {/* BUTTON */}
                <button className="mt-1 w-fit px-2 py-[3px] lg:px-4 lg:py-2 text-[10px] lg:text-sm bg-white text-orange-500 font-semibold rounded-md hover:bg-gray-100 transition">
                  Shop Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OVERLAY MODAL */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl animate-fadeIn">
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setSelectedOffer(null)}
              className="absolute top-3 right-3 z-10 bg-white text-black rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-gray-200"
            >
              ✕
            </button>

            {/* IMAGE */}
            <div className="w-full h-[220px] lg:h-[320px]">
              <img
                src={selectedOffer.image}
                alt={selectedOffer.title}
                className="w-full h-full object-contain"
              />
            </div>

            {/* CONTENT */}
            <div className="p-4 lg:p-6 flex flex-col gap-3 lg:gap-4">
              <span className="text-xs font-semibold bg-orange-100 text-orange-500 w-fit px-3 py-1 rounded-full">
                {selectedOffer.tag}
              </span>

              <h2 className="text-xl lg:text-2xl font-bold text-gray-800">
                {selectedOffer.title}
              </h2>

              <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                {selectedOffer.description}
              </p>

              <button className="w-fit px-5 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition">
                Shop Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllSpecialOffer;
