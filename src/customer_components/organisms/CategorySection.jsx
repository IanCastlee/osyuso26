import React, { useEffect, useState } from "react";
import CategoryCard from "../molecules/CategoryCard";
import { useNavigate } from "react-router-dom";
import useGetData from "../../hooks/useGetData";
import SkeletonLoader from "../../reusable_components/SkeletonLoader";

function CategorySection() {
  const navigate = useNavigate();

  // ================= FETCH =================
  const { data, loading } = useGetData("product/get-categories.php?limit=15");

  // ================= SAFE DATA =================
  const categories = data?.categories || [];

  // ================= RESPONSIVE LIMIT =================
  const [limit, setLimit] = useState(9);

  useEffect(() => {
    const updateLimit = () => {
      if (window.innerWidth >= 1024) {
        setLimit(15);
      } else {
        setLimit(7);
      }
    };

    updateLimit();

    window.addEventListener("resize", updateLimit);

    return () => {
      window.removeEventListener("resize", updateLimit);
    };
  }, []);

  // ================= DISPLAY =================
  const visibleCategories = categories.slice(0, limit);

  const hasMore = categories.length > limit;

  // ================= LOADING =================
  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="w-full flex flex-col p-0 lg:p-4 bg-primary mt-4  mb-2 lg:mb-4">
      <div className="flex items-center justify-between p-2">
        <h2 className="text-xs font-bold text-secondary">CATEGORIES</h2>
      </div>

      {/* CATEGORY GRID */}
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
        {visibleCategories.map((category) => (
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

      {/* SEE ALL */}
      {hasMore && (
        <div className="flex justify-end p-3">
          <button
            onClick={() => navigate("/all-categories")}
            className="
              text-xs
              font-semibold
              text-orange-500
              hover:text-orange-600
              transition
            "
          >
            See all →
          </button>
        </div>
      )}
    </div>
  );
}

export default CategorySection;
