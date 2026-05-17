import React, { useEffect, useState } from "react";
import MarketCard from "../molecules/MarketCard";
import useGetData from "../../hooks/useGetData";
import SkeletonLoader from "../../reusable_components/SkeletonLoader";
import { useNavigate } from "react-router-dom";

function MarketSection() {
  const navigate = useNavigate();

  const { data, loading } = useGetData("market/get-markets.php?limit=10");
  const markets = Array.isArray(data?.data) ? data.data : [];

  const [limit, setLimit] = useState(4);

  useEffect(() => {
    const updateLimit = () => {
      if (window.innerWidth >= 1280) {
        setLimit(6);
      } else if (window.innerWidth >= 1024) {
        setLimit(5);
      } else if (window.innerWidth >= 768) {
        setLimit(4);
      } else {
        setLimit(2);
      }
    };

    updateLimit();
    window.addEventListener("resize", updateLimit);

    return () => window.removeEventListener("resize", updateLimit);
  }, []);

  const visibleMarkets = markets.slice(0, limit);
  const hasMore = markets.length > limit;

  if (loading) {
    return (
      <section className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        <SkeletonLoader />
      </section>
    );
  }

  if (!markets.length) {
    return null;
  }

  return (
    <section className="mb-2 w-full rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Markets</h2>
          <p className="mt-0.5 hidden text-xs text-gray-500 sm:block">
            Discover local shops near your area
          </p>
        </div>

        {hasMore && (
          <button
            onClick={() => navigate("/all-markets")}
            className="text-xs font-semibold text-orange-500 cursor-pointer transition hover:opacity-80"
          >
            See all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {visibleMarkets.map((market) => (
          <MarketCard key={market.user_id} market={market} />
        ))}
      </div>
    </section>
  );
}

export default MarketSection;
