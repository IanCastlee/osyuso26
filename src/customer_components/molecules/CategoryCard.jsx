import React from "react";
import { useNavigate } from "react-router-dom";

function CategoryCard({ id, name, image }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/categories/${id}?name=${encodeURIComponent(name)}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group flex h-[118px] w-full items-center justify-center bg-white px-2 text-center transition hover:bg-orange-50 sm:h-[126px]"
    >
      <div className="flex flex-col items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-100 transition group-hover:ring-orange-200 sm:h-16 sm:w-16">
          <img
            src={image || "/placeholder.png"}
            alt={name}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
          />
        </div>

        <span className="mt-3 line-clamp-2 text-center text-xs font-medium leading-4 text-gray-700 transition group-hover:text-secondary">
          {name}
        </span>
      </div>
    </button>
  );
}

export default CategoryCard;
