import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { CiLocationOn } from "react-icons/ci";

import ProductCard from "../molecules/ProductCard";
import useGetData from "../../hooks/useGetData";
import { icons } from "../../constant/icons";
import bgImage from "../../assets/assets_osyuso/defaultCover.webp";
import profileImage from "../../assets/assets_osyuso/shop.png";
import MarketSkeletonLoader from "../../reusable_components/MarketSkeletonLoader";
import SkeletonLoader from "../../reusable_components/SkeletonLoader";
import { URL } from "../../utils/URL";

function Market() {
  const { id } = useParams();

  const { data, loading } = useGetData(`market/get-market.php?id=${id}`);
  const market = data?.market;

  const ALL = "all";

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState(ALL);
  const [activeMode, setActiveMode] = useState("all");

  const [products, setProducts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [openDropdown, setOpenDropdown] = useState(false);

  const fetchCategories = async () => {
    if (!market?.shop_id) return;

    try {
      const res = await fetch(
        `${URL.URL}market/get-vendor-categories.php?shop_id=${market.shop_id}`,
      );

      const json = await res.json();
      if (!json.success) return;

      setCategories(json.data);

      if (json.data.length > 0) {
        setActiveCategory(json.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubcategories = async () => {
    if (!market?.shop_id || !activeCategory) return;

    try {
      const res = await fetch(
        `${URL.URL}market/get-vendor-subcategories.php?category_id=${activeCategory}&shop_id=${market.shop_id}`,
      );

      const json = await res.json();
      if (!json.success) return;

      setSubcategories(json.data);
      setActiveSubcategory(ALL);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async ({ cursor = null, reset = false } = {}) => {
    if (!market?.shop_id || loadingProducts) return;

    setLoadingProducts(true);

    try {
      const params = new URLSearchParams({
        shop_id: market.shop_id,
        limit: 20,
      });

      if (activeMode === "sub" && activeSubcategory !== ALL) {
        params.append("subcategory_id", activeSubcategory);
      } else if (activeMode === "category" && activeCategory) {
        params.append("category_id", activeCategory);
      }

      if (cursor) {
        params.append("cursor", cursor);
      }

      const res = await fetch(
        `${URL.URL}market/get-vendor-products.php?${params}`,
      );

      const json = await res.json();
      if (!json.success) return;

      setProducts((prev) => {
        const merged = reset ? json.data : [...prev, ...json.data];

        return Array.from(
          new Map(merged.map((item) => [item.id, item])).values(),
        );
      });

      setNextCursor(json.next_cursor);
      setHasMore(!!json.next_cursor);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (market?.shop_id) {
      fetchCategories();
    }
  }, [market?.shop_id]);

  useEffect(() => {
    fetchSubcategories();
  }, [market?.shop_id, activeCategory]);

  useEffect(() => {
    if (!market?.shop_id) return;

    if (activeMode === "all") {
      setProducts([]);
      setNextCursor(null);
      setHasMore(true);
      fetchProducts({ reset: true });
    }
  }, [market?.shop_id, activeMode]);

  useEffect(() => {
    if (!market?.shop_id) return;

    if (activeMode === "category" && activeCategory) {
      setProducts([]);
      setNextCursor(null);
      setHasMore(true);
      fetchProducts({ reset: true });
    }
  }, [market?.shop_id, activeCategory, activeMode]);

  useEffect(() => {
    if (!market?.shop_id) return;

    if (activeMode === "sub" && activeSubcategory !== ALL) {
      setProducts([]);
      setNextCursor(null);
      setHasMore(true);
      fetchProducts({ reset: true });
    }
  }, [market?.shop_id, activeSubcategory, activeMode]);

  useEffect(() => {
    const handleScroll = () => {
      const bottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;

      if (bottom && hasMore && !loadingProducts) {
        fetchProducts({ cursor: nextCursor });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [market?.shop_id, nextCursor, hasMore, loadingProducts]);

  if (loading) {
    return <MarketSkeletonLoader />;
  }

  return (
    <div className="w-full bg-gray-100 lg:px-3 sm:px-6 lg:px-28">
      <div className="w-full flex flex-col bg-primary">
        <div className="w-full h-[160px] sm:h-[200px] md:h-[220px] relative">
          <LazyLoadImage
            src={market?.shop_cover_photo || bgImage}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />

          <div className="w-[100px] lg:w-[120px] h-[100px] lg:h-[120px] absolute left-3 sm:left-6 bottom-0 lg:-bottom-10 rounded-full border-4 border-white overflow-hidden bg-white">
            <LazyLoadImage
              src={market?.shop_logo || profileImage}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="pl-3 sm:pl-28 md:pl-36 mt-2">
          <h2 className="text-xl font-semibold">{market?.shop_name}</h2>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              market?.address || "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-600 flex items-center gap-1 hover:text-blue-600 hover:underline"
          >
            <CiLocationOn />
            {market?.address}
          </a>

          <div className="text-xs text-gray-600 flex items-center gap-1">
            <icons.CiLocationArrow1 />
            <span className="text-[10px]">
              Nearby Landmark : {market?.nearby}
            </span>
          </div>
        </div>

        <div className="flex gap-4 border-b border-gray-200 px-3 mt-8 lg:mt-12 overflow-x-auto">
          <button
            onClick={() => {
              setActiveMode("all");
              setActiveSubcategory(ALL);
              setProducts([]);
              setNextCursor(null);
              setHasMore(true);
            }}
            className={`pb-2 text-xs font-medium px-2 lg:px-4 ${
              activeMode === "all"
                ? "text-orange-500 border-b-2 border-orange-500"
                : "text-gray-500"
            }`}
          >
            All
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setActiveMode("category");
              }}
              className={`pb-2 text-xs font-medium px-2 lg:px-4 ${
                activeCategory === cat.id && activeMode === "category"
                  ? "text-orange-500 border-b-2 border-orange-500"
                  : "text-gray-500"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex justify-end px-3 mt-3 relative">
          <icons.MdSort
            onClick={() => setOpenDropdown(!openDropdown)}
            className="text-secondary mr-1 cursor-pointer"
          />

          <button
            onClick={() => setOpenDropdown(!openDropdown)}
            className="text-xs text-secondary"
          >
            {activeSubcategory === ALL
              ? "All"
              : subcategories.find(
                  (s) => Number(s.id) === Number(activeSubcategory),
                )?.name || "All"}
          </button>

          {openDropdown && (
            <div className="absolute right-3 top-6 bg-white shadow rounded w-48 z-50">
              <button
                onClick={() => {
                  setActiveSubcategory(ALL);
                  setActiveMode("category");
                  setOpenDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 ${
                  activeSubcategory === ALL
                    ? "text-secondary font-semibold"
                    : ""
                }`}
              >
                All
              </button>

              {subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    setActiveSubcategory(sub.id);
                    setActiveMode("sub");
                    setOpenDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 ${
                    Number(activeSubcategory) === Number(sub.id)
                      ? "text-secondary font-semibold"
                      : ""
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 px-3 mt-4 pb-6">
          {products.map((item) => (
            <ProductCard
              key={item.id}
              id={item.id}
              name={item.name}
              price={item.price}
              image={item.image_path}
              stock={item.stock}
              seller={market?.shop_name}
            />
          ))}
        </div>

        {hasMore && (
          <button
            onClick={() => fetchProducts({ cursor: nextCursor })}
            disabled={loadingProducts}
            className="w-full text-xs text-orange-500 font-semibold py-3"
          >
            {loadingProducts ? <SkeletonLoader /> : "Load More"}
          </button>
        )}
      </div>
    </div>
  );
}

export default Market;
