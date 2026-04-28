import React from "react";
import MarketCard from "../molecules/MarketCard";

function MarketSection() {
  const markets = Array(20).fill(null); // simulate data

  return (
    <div className="w-full flex flex-col gap-4 p-4 bg-primary mt-4 mb-6">
      {/* Title */}
      <h2 className="text-lg font-bold text-secondary">MARKET</h2>

      {/* Cards */}
      <div className="flex flex-wrap gap-4 border-t border-gray-200 pt-2">
        {markets.map((_, index) => (
          <MarketCard key={index} />
        ))}
      </div>

      <div className="w-full flex justify-end">
        <button className="mt-4 text-xs text-primary py-2 px-4 rounded  hover:text-secondary transition duration-300">
          View All Markets
        </button>
      </div>
    </div>
  );
}

export default MarketSection;
