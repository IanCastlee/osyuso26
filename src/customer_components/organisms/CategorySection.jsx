import React from "react";
import CategoryCard from "../molecules/CategoryCard";
import { useNavigate } from "react-router-dom";
import useGetData from "../../hooks/useGetData";
import SkeletonLoader from "../../reusable_components/SkeletonLoader";

function CategorySection() {
  const navigate = useNavigate();

  const { data, loading } = useGetData(`product/get-categoris.php`);

  const handleViewAll = () => {
    navigate("/all-categories");
  };

  return (
    <div className="w-full flex flex-col lg:gap-4 p-1 lg:p-4 bg-primary mt-4 mb-6">
      <div className="flex items-center justify-between p-2">
        <h2 className="text-xs font-bold text-secondary">CATEGORIES</h2>
      </div>

      <div>
        <div className="flex justify-around lg:justify-start flex-wrap gap-2 lg:gap-4 border-t border-gray-200 px-0 lg:pt-2">
          {loading ? (
            <SkeletonLoader />
          ) : (
            data?.map((category) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                name={category.name}
                image={category.image}
              />
            ))
          )}
        </div>

        {/* {hasMore && ( */}
        <div className="w-full flex justify-end mt-3">
          <button
            onClick={() => navigate("/all-markets")}
            className="text-xs text-orange-500 font-semibold"
          >
            See all →
          </button>
        </div>
        {/* )} */}
      </div>
    </div>
  );
}

export default CategorySection;
