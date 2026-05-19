import React, { useEffect, useState } from "react";
import CategoryCard from "../molecules/CategoryCard";
import { useNavigate } from "react-router-dom";
import useGetData from "../../hooks/useGetData";
import SkeletonLoader from "../../reusable_components/SkeletonLoader";

function CategorySection() {
  const navigate = useNavigate();

  const { data, loading } = useGetData("product/get-categories.php?limit=15");
  const categories = data?.categories || [];

  const [limit, setLimit] = useState(8);

  useEffect(() => {
    const updateLimit = () => {
      if (window.innerWidth >= 1280) {
        setLimit(12);
      } else if (window.innerWidth >= 1024) {
        setLimit(10);
      } else if (window.innerWidth >= 768) {
        setLimit(6);
      } else {
        setLimit(6);
      }
    };

    updateLimit();

    window.addEventListener("resize", updateLimit);

    return () => {
      window.removeEventListener("resize", updateLimit);
    };
  }, []);

  const visibleCategories = categories.slice(0, limit);
  const hasMore = categories.length > limit;

  if (loading) {
    return (
      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        <SkeletonLoader />
      </div>
    );
  }

  if (!categories.length) {
    return null;
  }

  return (
    <section className="mt-4 w-full rounded-xl bg-white shadow-sm mb-4">
      <div className="flex items-center  justify-between border-b border-gray-100 px-4 py-3">
        <div className="mb-1">
          <h2 className="text-sm font-bold text-gray-900">Categories</h2>
          <p className="mt-0.5 hidden text-xs text-gray-500 sm:block">
            Browse fresh products by category
          </p>
        </div>

        {hasMore && (
          <button
            onClick={() => navigate("/all-categories")}
            className="text-xs font-semibold text-secondary transition hover:opacity-80"
          >
            See all
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-px bg-gray-100 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
        {visibleCategories.map((category) => (
          <CategoryCard
            key={category.id}
            id={category.id}
            name={category.name}
            image={category.image}
          />
        ))}
      </div>
    </section>
  );
}

export default CategorySection;
