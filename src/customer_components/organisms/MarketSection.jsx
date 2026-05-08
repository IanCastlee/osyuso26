import React from "react";
import MarketCard from "../molecules/MarketCard";
import { useNavigate } from "react-router-dom";
import useGetData from "../../hooks/useGetData";

function MarketSection() {
  const navigate = useNavigate();

  const { data, loading } = useGetData("market/get-markets.php");

  // ✅ FIXED (remove .data)
  const markets = data?.markets || [];
  const hasMore = data?.hasMore;

  const handleViewAll = () => {
    navigate("/all-markets");
  };

  if (loading) return <div>Loading...</div>;

  console.log("DATA:", data);

  return (
    <div className="w-full flex flex-col gap-4 p-1 lg:p-4 bg-primary mt-4 mb-6">
      <h2 className="text-sm font-bold text-secondary mt-2">MARKETS</h2>

      <div className="flex justify-around lg:justify-start flex-wrap gap-2 lg:gap-4 border-t border-gray-200 px-0 pt-2">
        {markets.map((market) => (
          <MarketCard key={market.user_id} market={market} />
        ))}
      </div>

      {/* SHOW ONLY IF TRUE */}
      {hasMore && (
        <div className="w-full flex justify-end">
          <button
            onClick={handleViewAll}
            className="text-xs text-primary hover:text-secondary"
          >
            View All Markets
          </button>
        </div>
      )}
    </div>
  );
}

export default MarketSection;
