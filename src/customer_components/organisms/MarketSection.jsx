import React, { useEffect, useState } from "react";
import MarketCard from "../molecules/MarketCard";
import useGetData from "../../hooks/useGetData";
import SkeletonLoader from "../../reusable_components/SkeletonLoader";
import { useNavigate } from "react-router-dom";

function MarketSection() {
  const navigate = useNavigate();

  const { data, loading } = useGetData("market/get-markets.php?limit=10");

  // ✅ FIX HERE
  const markets = Array.isArray(data?.data) ? data.data : [];

  const [limit, setLimit] = useState(2);

  useEffect(() => {
    const updateLimit = () => {
      setLimit(window.innerWidth >= 1024 ? 6 : 2);
    };

    updateLimit();
    window.addEventListener("resize", updateLimit);

    return () => window.removeEventListener("resize", updateLimit);
  }, []);

  const visibleMarkets = markets.slice(0, limit);
  const hasMore = markets.length > limit;

  if (loading) return <SkeletonLoader />;

  console.log("DATA:", data);

  return (
    <div className="w-full flex flex-col p-2 lg:p-4 bg-primary mt-4 mb-6">
      <div className="flex items-center justify-between p-2">
        <h2 className="text-xs font-bold text-secondary">MARKETS</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 lg:gap-4 border-t border-gray-200 pt-3">
        {visibleMarkets.map((market) => (
          <MarketCard key={market.user_id} market={market} />
        ))}
      </div>

      {hasMore && (
        <div className="w-full flex justify-end mt-3">
          <button
            onClick={() => navigate("/all-markets")}
            className="text-xs text-orange-500 font-semibold hover:text-secondary"
          >
            See all →
          </button>
        </div>
      )}
    </div>
  );
}

export default MarketSection;
