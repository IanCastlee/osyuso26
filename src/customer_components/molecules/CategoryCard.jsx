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
      className="w-[50px] lg:w-[90px] h-[100px] flex flex-col items-center justify-center overflow-hidden transition-all duration-300 cursor-pointer group"
    >
      {/* Image */}
      <div className="flex items-center justify-center">
        <img
          src={image}
          alt={name}
          className="h-[50px] lg:h-[50px] w-[50px] lg:w-[50px] object-cover rounded-2xl group-hover:scale-110 transition-transform duration-300"
        />
      </div>

      {/* Text */}
      <div className="mt-2 flex items-center justify-center">
        <span className="text-xs lg:text-sm font-semibold text-primary">
          {name}
        </span>
      </div>
    </div>
  );
}

export default CategoryCard;
