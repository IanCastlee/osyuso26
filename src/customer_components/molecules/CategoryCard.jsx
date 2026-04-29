import React from "react";
import { useNavigate } from "react-router-dom";
import meat from "../../../../assets_osyuso/meat.png";

function CategoryCard() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/categories");
  };

  return (
    <div
      onClick={handleClick}
      className=" w-[90px] h-[100px] flex flex-col items-center justify-center overflow-hidden transition-all duration-300 cursor-pointer group"
    >
      {/* Image */}
      <div className="flex items-center justify-center">
        <img
          src={meat}
          alt="Meat"
          className="h-[40px] lg:h-[50px]  w-[40px] lg:w-[50px] object-contain group-hover:scale-110 transition-transform duration-300"
        />
      </div>

      {/* Text */}
      <div className="mt-2 flex items-center justify-center">
        <span className=" text-xs lg:text-sm font-semibold text-primary">
          Meat
        </span>
      </div>
    </div>
  );
}

export default CategoryCard;
