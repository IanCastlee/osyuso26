import React from "react";
import MarketCard from "../molecules/MarketCard";

function MarketSection() {
  const markets = Array(20).fill(null); // simulate data

  return (
    <div className="w-full flex flex-col gap-4 p-1 lg:p-4 bg-primary mt-4 mb-6">
      {/* Title */}
      <h2 className="mt-2 lg:mt-0 text-[10px] lg:text-sm font-bold text-secondary">
        MARKETS
      </h2>

      {/* Cards */}
      <div className="flex justify-around lg:justify-start flex-wrap gap-2 lg:gap-4 border-t border-gray-200 pt-2">
        {markets.map((_, index) => (
          <MarketCard key={index} />
        ))}
      </div>

      <div className="w-full flex justify-end">
        <button className=" text-[10px] lg:text-xs text-primary px-4 rounded  hover:text-secondary transition duration-300">
          View All Markets
        </button>
      </div>
    </div>
  );
}

export default MarketSection;
