import React from "react";
import SpecialOfferCard from "../molecules/SpecialOfferCard";
import adobo from "../../assets/hero_images/adobo.jpg";
import milkTea from "../../assets/hero_images/milktea2.webp";
import { LazyLoadImage } from "react-lazy-load-image-component";

function CustomerHero() {
  return (
    <div className="w-full h-auto  lg:h-[300px] flex flex-col lg:flex-row mt-1.5 gap-1">
      <div className="w-[100%] h-full bg-primary">
        <SpecialOfferCard
          title="50% OFF Pork Belly Today!"
          description="Limited time offer from Juan Meat Shop in Bulusan."
          tag="🔥 FLASH SALE"
        />
      </div>

      <div className="mt-2 lg:w-[20%]">
        <h2 className="flex lg:hidden text-[10px] text-secondary mb-1">
          NEW ARRIVAL
        </h2>
        <div className="flex flex-row lg:flex-col w-full lg:w-full h-[80px] lg:h-full gap-1">
          {/* ITEM 1 */}
          <div className="h-full lg:h-[49%] w-[80px] lg:w-full rounded-lg lg:rounded-xl overflow-hidden relative group">
            <LazyLoadImage
              src={adobo}
              className="w-full h-full object-cover object-center block"
            />

            {/* OVERLAY */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
              <button className="text-[10px] lg:text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 px-1 lg:px-3 py-1 text-xs bg-white text-primary font-semibold rounded-md">
                Visit Shop
              </button>
            </div>
          </div>

          {/* ITEM 2 */}
          <div className="h-full lg:h-[49%] w-[80px] lg:w-full rounded-lg lg:rounded-xl overflow-hidden relative group">
            <LazyLoadImage
              src={milkTea}
              className="w-full h-full object-cover object-center block"
            />

            {/* OVERLAY */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
              <button className="text-[10px] lg:text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 px-1 lg:px-3 py-1 text-xs bg-white text-primary font-semibold rounded-md">
                Visit Shop
              </button>
            </div>
          </div>
        </div>

        <div className="w-full flex justify-end">
          <button className=" text-[10px] text-primary px-4 rounded  hover:text-secondary transition duration-300">
            Show All
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomerHero;
