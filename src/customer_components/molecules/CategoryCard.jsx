import React from "react";
import { useNavigate } from "react-router-dom";

function CategoryCard({ id, name, image }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/categories/${id}?name=${name}`);
  };

  return (
    <div
      onClick={handleClick}
      className="
        w-full
        h-[110px]
        lg:h-[115px]
        flex
        flex-col
        items-center
        justify-center
        text-center
        cursor-pointer
        bg-primary
        hover:bg-gray-50
        transition-all
        duration-200
        group
      "
    >
      {/* IMAGE */}
      <div
        className="
    w-[55px]
    h-[55px]
    rounded-full
    bg-gray-100
    flex
    items-center
    justify-center
    overflow-hidden
  "
      >
        <img
          src={image}
          alt={name}
          className="
      w-full
      h-full
      object-cover
      group-hover:scale-105
      transition-transform
      duration-200
    "
        />
      </div>

      {/* TEXT */}
      <div className="mt-2 px-2 w-full">
        <span
          className="
            text-[12px]
            text-gray-700
            leading-4
            line-clamp-2
            block
          "
        >
          {name}
        </span>
      </div>
    </div>
  );
}

export default CategoryCard;
