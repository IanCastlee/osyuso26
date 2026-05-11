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
    <div className="w-full flex flex-col gap-3 px-1 lg:p-4 bg-primary mt-2">
      <h2 className="text-xs font-bold text-secondary mt-2">CATEGORIES</h2>

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

        <div className="w-full flex justify-end my-2 lg:my-0">
          <button
            onClick={handleViewAll}
            className="text-[10px] lg:text-xs text-primary px-4 rounded hover:text-secondary transition duration-300"
          >
            View All
          </button>
        </div>
      </div>
    </div>
  );
}

export default CategorySection;
