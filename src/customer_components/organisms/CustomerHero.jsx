import React from "react";
import SpecialOfferCard from "../molecules/SpecialOfferCard";
import adobo from "../../assets/hero_images/adobo.jpg";
import milkTea from "../../assets/hero_images/milktea2.webp";
import { LazyLoadImage } from "react-lazy-load-image-component";

function CustomerHero() {
  return (
    <div className="w-full h-[300px] flex mt-1.5 gap-1">
      <div className="w-[80%] h-full bg-primary">
        <SpecialOfferCard />
      </div>

      <div className="flex flex-col w-[20%] h-full gap-1">
        <div className="h-[49%] w-full bg-primary">
          <LazyLoadImage
            src={adobo}
            className="w-full h-full object-cover object-center block"
          />
        </div>
        <div className="h-[49%] w-full bg-primary">
          <LazyLoadImage
            src={milkTea}
            className="w-full h-full object-cover object-center block"
          />
        </div>
      </div>
    </div>
  );
}

export default CustomerHero;
