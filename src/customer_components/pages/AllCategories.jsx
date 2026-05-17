import React, { useEffect, useState } from "react";
import CategoryCard from "../molecules/CategoryCard";
import SkeletonLoader from "../../reusable_components/SkeletonLoader";
import { URL } from "../../utils/URL";

function AllCategories() {
  const [categories, setCategories] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // ================= INITIAL LOAD =================
  const fetchCategories = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${URL.URL}product/get-categories.php?limit=20`);

      const json = await res.json();

      if (!json.success) return;

      const data = json.data?.categories || [];

      setCategories(data);
      setNextCursor(json.data?.next_cursor || null);
      setHasMore(json.data?.has_more ?? false);
    } catch (err) {
      console.error("FETCH ERROR:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ================= LOAD MORE =================
  const fetchMore = async () => {
    if (!hasMore || loadingMore || !nextCursor) return;

    try {
      setLoadingMore(true);

      const res = await fetch(
        `${URL.URL}product/get-categories.php?limit=20&cursor=${nextCursor}`,
      );

      const json = await res.json();

      if (!json.success) return;

      const newData = json.data?.categories || [];

      setCategories((prev) => [...prev, ...newData]);

      setNextCursor(json.data?.next_cursor || null);
      setHasMore(json.data?.has_more ?? false);
    } catch (err) {
      console.error("LOAD MORE ERROR:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // ================= LOADING =================
  if (loading && categories.length === 0) {
    return (
      <div className="w-full px-1 lg:px-[150px]">
        <SkeletonLoader />
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-100 px-1 lg:px-28">
      <div className="w-full min-h-screen bg-white py-4 px-1 lg:px-4 ">
        {/* HEADER */}
        <div className="px-4 pb-3">
          <h2 className="text-sm font-bold text-gray-700">ALL CATEGORIES</h2>
        </div>

        {/* GRID */}
        <div
          className="
            grid
            grid-cols-3
            md:grid-cols-5
            lg:grid-cols-8
            border-t
            border-gray-200
          "
        >
          {categories.map((category) => (
            <div
              key={category.id}
              className="
                border-r
                border-b
                border-gray-200
              "
            >
              <CategoryCard
                id={category.id}
                name={category.name}
                image={category.image}
              />
            </div>
          ))}
        </div>

        {/* LOAD MORE */}
        {hasMore && (
          <div className="flex justify-center py-4">
            <button
              onClick={fetchMore}
              disabled={loadingMore}
              className="
                text-sm
                text-orange-500
                font-semibold
                hover:text-orange-600
                disabled:opacity-50
                transition
              "
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AllCategories;
