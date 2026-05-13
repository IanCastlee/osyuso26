import React, { useEffect, useState } from "react";
import MarketCard from "../molecules/MarketCard";
import SkeletonLoader from "../../reusable_components/SkeletonLoader";
import { URL } from "../../utils/URL";

function AllMarkets() {
  const [markets, setMarkets] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // ================= INITIAL LOAD =================
  const fetchMarkets = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${URL.URL}market/get-markets.php?limit=12`);
      const json = await res.json();

      if (!json.success) return;

      // 🔥 IMPORTANT FIX (flatten safe)
      const data = Array.isArray(json.data) ? json.data : json.data?.data || [];

      setMarkets(data);
      setNextCursor(json.data?.next_cursor || null);
      setHasMore(json.data?.has_more ?? false);
    } catch (err) {
      console.error("FETCH ERROR:", err);
      setMarkets([]); // safety fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, []);

  // ================= LOAD MORE =================
  const fetchMore = async () => {
    if (!hasMore || loadingMore || !nextCursor) return;

    try {
      setLoadingMore(true);

      const res = await fetch(
        `${URL.URL}market/get-markets.php?limit=12&cursor=${nextCursor}`,
      );

      const json = await res.json();

      if (!json.success) return;

      const newData = Array.isArray(json.data)
        ? json.data
        : json.data?.data || [];

      setMarkets((prev) => [...prev, ...newData]);

      setNextCursor(json.data?.next_cursor || null);
      setHasMore(json.data?.has_more ?? false);
    } catch (err) {
      console.error("LOAD MORE ERROR:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // ================= LOADING =================
  if (loading && markets.length === 0) {
    return (
      <div className="w-full px-1 lg:px-[150px]">
        <SkeletonLoader />
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-100 px-1 lg:px-28">
      <div className="w-full  min-h-screen flex flex-col bg-primary py-6 px-2 lg:px-4">
        {/* TITLE */}
        <h2 className="text-xs lg:text-sm font-bold text-secondary mb-2">
          MARKETS
        </h2>

        {/* GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-4 border-t border-gray-200 pt-3">
          {Array.isArray(markets) &&
            markets.map((market, index) => (
              <MarketCard key={market.user_id || index} market={market} />
            ))}
        </div>

        {/* LOAD MORE */}
        {hasMore && (
          <button
            onClick={fetchMore}
            disabled={loadingMore}
            className="mt-4 text-xs text-orange-500 font-semibold disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}

export default AllMarkets;
