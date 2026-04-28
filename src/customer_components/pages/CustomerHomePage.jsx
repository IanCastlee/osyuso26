import React from "react";
import CustomerHero from "../organisms/CustomerHero";
import CategorySection from "../organisms/CategorySection";
import MarketSection from "../organisms/MarketSection";

function CustomerHomePage() {
  return (
    <div className="w-full bg-gray-100 px-28">
      <div className="w-full h-full  flex flex-col">
        <CustomerHero />
        <CategorySection />
        <MarketSection />
      </div>
    </div>
  );
}

export default CustomerHomePage;
