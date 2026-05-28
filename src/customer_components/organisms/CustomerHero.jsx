import React, { useMemo } from "react";
import SpecialOfferCard from "../molecules/SpecialOfferCard";
import adobo from "../../assets/hero_images/adobo.jpg";
import milkTea from "../../assets/hero_images/milktea2.webp";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useNavigate } from "react-router-dom";
import useGetData from "../../hooks/useGetData";

function CustomerHero() {
  const navigate = useNavigate();

  const { data, loading } = useGetData("product/get-new-subcategories.php");

  const fallbackImages = [adobo, milkTea];

  const getImageUrl = (path) => {
    if (!path) return "";
    return path;
  };

  const subcategories = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }, [data]);

  const arrivals = useMemo(
    () =>
      subcategories.slice(0, 2).map((item, index) => ({
        id: item.id,
        categoryId: item.category_id,
        image: getImageUrl(item.image_path, fallbackImages[index] || adobo),
        title: item.name || "New Arrival",
        subtitle: item.category_name || "New arrival",
        productCount: Number(item.product_count || 0),
      })),
    [subcategories],
  );

  const fallbackPromos = [
    {
      id: "fallback-1",
      categoryId: null,
      image: adobo,
      title: "Fresh Meals",
      subtitle: "Local favorites",
      productCount: 0,
    },
    {
      id: "fallback-2",
      categoryId: null,
      image: milkTea,
      title: "New Shops",
      subtitle: "Explore arrivals",
      productCount: 0,
    },
  ];

  const cards = arrivals.length > 0 ? arrivals : fallbackPromos;

  const openArrival = (item) => {
    if (!item.categoryId) {
      navigate("/all-markets");
      return;
    }

    navigate(
      `/categories/${item.categoryId}?name=${encodeURIComponent(item.subtitle)}`,
    );
  };

  return (
    <section className="mt-3 w-full">
      <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
        <div className="min-w-0">
          <SpecialOfferCard />
        </div>

        <aside className="rounded-t-xl bg-white p-3 shadow-sm lg:h-[331px] lg:rounded-xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">New in Market</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            {cards.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openArrival(item)}
                className="group relative h-28 overflow-hidden rounded-lg bg-slate-100 text-left shadow-sm lg:h-[121px]"
              >
                <LazyLoadImage
                  src={item.image}
                  alt={item.title}
                  onError={(e) => {
                    e.currentTarget.src = adobo;
                  }}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="line-clamp-1 text-sm font-bold text-white">
                    {loading ? "Loading..." : item.title}
                  </p>

                  <p className="mt-0.5 line-clamp-1 text-xs text-white/80">
                    {item.productCount > 0
                      ? `${item.productCount} products`
                      : item.subtitle}
                  </p>
                </div>

                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-secondary opacity-0 shadow-sm transition group-hover:opacity-100">
                  View
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default CustomerHero;
