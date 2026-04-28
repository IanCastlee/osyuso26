import React from "react";
import SpecialOfferCard from "../molecules/SpecialOfferCard";
import adobo from "../../assets/hero_images/adobo.jpg";
import milkTea from "../../assets/hero_images/milktea2.webp";
import { LazyLoadImage } from "react-lazy-load-image-component";

function CustomerHero() {
  return (
    <div className="w-full h-[300px] flex mt-1.5 gap-1">
      <div className="w-[80%] h-full bg-primary">
        <SpecialOfferCard
          title="50% OFF Pork Belly Today!"
          description="Limited time offer from Juan Meat Shop in Bulusan."
          tag="🔥 FLASH SALE"
        />
      </div>

      <div className="flex flex-col w-[20%] h-full gap-1">
        {/* ITEM 1 */}
        <div className="h-[49%] w-full rounded-xl overflow-hidden relative group">
          <LazyLoadImage
            src={adobo}
            className="w-full h-full object-cover object-center block"
          />

          {/* OVERLAY */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
            <button className="opacity-0 group-hover:opacity-100 transition-all duration-300 px-3 py-1 text-xs bg-white text-primary font-semibold rounded-md">
              Visit Shop
            </button>
          </div>
        </div>

        {/* ITEM 2 */}
        <div className="h-[49%] w-full rounded-xl overflow-hidden relative group">
          <LazyLoadImage
            src={milkTea}
            className="w-full h-full object-cover object-center block"
          />

          {/* OVERLAY */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
            <button className="opacity-0 group-hover:opacity-100 transition-all duration-300 px-3 py-1 text-xs bg-white text-primary font-semibold rounded-md">
              Visit Shop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerHero;
