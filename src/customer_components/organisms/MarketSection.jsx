import React from "react";
import MarketCard from "../molecules/MarketCard";

function MarketSection() {
  const markets = Array(20).fill(null); // simulate data

  return (
    <div className="w-full flex flex-col gap-4 p-4 bg-primary mt-6">
      {/* Title */}
      <h2 className="text-lg font-bold text-primary">Markets</h2>

      {/* Cards */}
      <div className="flex flex-wrap gap-4">
        {markets.map((_, index) => (
          <MarketCard key={index} />
        ))}
      </div>
    </div>
  );
}

export default MarketSection;
