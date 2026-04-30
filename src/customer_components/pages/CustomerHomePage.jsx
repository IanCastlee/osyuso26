import React, { lazy, Suspense } from "react";
import Loader from "../../reusable_components/Loader";
import SkeletonLoader from "../../reusable_components/SkeletonLoader";

const CustomerHero = lazy(() => import("../organisms/CustomerHero"));
const CategorySection = lazy(() => import("../organisms/CategorySection"));
const MarketSection = lazy(() => import("../organisms/MarketSection"));

function CustomerHomePage() {
  return (
    <div className="w-full bg-gray-100 px-1 lg:px-28">
      <div className="w-full h-full flex flex-col">
        {/* HERO */}
        <Suspense fallback={<Loader />}>
          <CustomerHero />
        </Suspense>

        {/* CATEGORY */}
        <Suspense
          fallback={
            <div className="py-6">
              <SkeletonLoader count={4} />
            </div>
          }
        >
          <CategorySection />
        </Suspense>

        {/* MARKET */}
        <Suspense
          fallback={
            <div className="py-6">
              <SkeletonLoader count={8} />
            </div>
          }
        >
          <MarketSection />
        </Suspense>
      </div>
    </div>
  );
}

export default CustomerHomePage;
