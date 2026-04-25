import React from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import offer1 from "../../assets/hero_images/offer1.png";

function SpecialOfferCard() {
  return (
    <div className="w-full h-full flex flex-row bg-gray-200">
      <div className="w-[30%]">
        <LazyLoadImage
          src={offer1}
          className="w-full h-full object-cover object-center block scale-x-[-1]"
        />
      </div>
      <div className="w-[70%] h-full p-2">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempora rem,
        natus commodi alias sequi eos tempore sapiente dolore quo dolorem!
      </div>
    </div>
  );
}

export default SpecialOfferCard;
