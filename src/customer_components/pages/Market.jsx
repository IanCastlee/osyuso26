import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { CiLocationOn } from "react-icons/ci";

import ProductCard from "../molecules/ProductCard";
import useGetData from "../../hooks/useGetData";
import { icons } from "../../constant/icons";
import bgImage from "../../assets/assets_osyuso/bg.webp";
import profileImage from "../../assets/assets_osyuso/shop.png";
import MarketSkeletonLoader from "../../reusable_components/MarketSkeletonLoader";
import SkeletonLoader from "../../reusable_components/SkeletonLoader";
import { URL } from "../../utils/URL";

function Market() {
  const { id } = useParams();

  // ================= MARKET =================
  const { data, loading } = useGetData(`market/get-market.php?id=${id}`);
  const market = data?.market;

  const ALL = "all";

  // ================= STATES =================
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

  // ================= FETCH CATEGORIES =================
  const fetchCategories = async () => {
    try {
      const res = await fetch(
        `${URL.URL}market/get-vendor-categories.php?vendor_id=${id}`,
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

  // ================= FETCH SUBCATEGORIES =================
  const fetchSubcategories = async () => {
    if (!activeCategory) return;

    try {
      const res = await fetch(
        `${URL.URL}market/get-vendor-subcategories.php?category_id=${activeCategory}&vendor_id=${id}`,
      );

      const json = await res.json();
      if (!json.success) return;

      setSubcategories(json.data);
      setActiveSubcategory(ALL);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= FETCH PRODUCTS =================
  const fetchProducts = async ({ cursor = null, reset = false } = {}) => {
    if (loadingProducts) return;

    setLoadingProducts(true);

    try {
      const params = new URLSearchParams({
        vendor_id: id,
        limit: 20,
      });

      if (activeMode === "sub" && activeSubcategory !== ALL) {
        params.append("subcategory_id", activeSubcategory);
      } else if (activeMode === "category") {
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

      // ================= FIX DUPLICATES =================
      setProducts((prev) => {
        const merged = reset ? json.data : [...prev, ...json.data];

        const unique = Array.from(
          new Map(merged.map((item) => [item.id, item])).values(),
        );

        return unique;
      });

      setNextCursor(json.next_cursor);
      setHasMore(!!json.next_cursor);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // ================= INIT =================
  useEffect(() => {
    if (id) fetchCategories();
  }, [id]);

  useEffect(() => {
    fetchSubcategories();
  }, [activeCategory]);

  // ================= MODE HANDLERS =================
  useEffect(() => {
    if (activeMode === "all") {
      setProducts([]);
      setNextCursor(null);
      setHasMore(true);
      fetchProducts({ reset: true });
    }
  }, [activeMode]);

  useEffect(() => {
    if (activeMode === "category" && activeCategory) {
      setProducts([]);
      setNextCursor(null);
      setHasMore(true);
      fetchProducts({ reset: true });
    }
  }, [activeCategory, activeMode]);

  useEffect(() => {
    if (activeMode === "sub" && activeSubcategory !== ALL) {
      setProducts([]);
      setNextCursor(null);
      setHasMore(true);
      fetchProducts({ reset: true });
    }
  }, [activeSubcategory, activeMode]);

  // ================= SCROLL =================
  useEffect(() => {
    const handleScroll = () => {
      const bottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;

      if (bottom && hasMore && !loadingProducts) {
        setLoadingProducts(true); // 🔥 prevent double trigger
        fetchProducts({ cursor: nextCursor });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [nextCursor, hasMore, loadingProducts]);

  // ================= LOADING =================
  if (loading) {
    return <MarketSkeletonLoader />;
  }

  return (
    <div className="w-full bg-gray-100 lg:px-3 sm:px-6 lg:px-28">
      <div className="w-full flex flex-col bg-primary">
        {/* ================= BANNER ================= */}
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

        {/* ================= SHOP INFO ================= */}
        <div className="pl-3 sm:pl-28 md:pl-36 mt-2">
          <h2 className="text-xl font-semibold">{market?.shop_name}</h2>

          <div className="text-xs text-gray-600 flex items-center gap-1">
            <CiLocationOn />
            {market?.address}
          </div>

          <div className="text-xs text-gray-600 flex items-center gap-1">
            <icons.CiLocationArrow1 />
            <span className="text-[10px]">
              Nearby Landmark : {market?.nearby}
            </span>
          </div>
        </div>

        {/* ================= CATEGORY ================= */}
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

        {/* ================= SUBCATEGORY ================= */}
        <div className="flex justify-end px-3 mt-3 relative">
          <icons.MdSort
            onClick={() => setOpenDropdown(!openDropdown)}
            className="text-secondary mr-1"
          />

          <button
            onClick={() => setOpenDropdown(!openDropdown)}
            className="text-xs text-secondary"
          >
            {activeSubcategory === ALL
              ? "All"
              : subcategories.find(
                  (s) => Number(s.id) === Number(activeSubcategory),
                )?.name}
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
                    activeSubcategory === sub.id
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

        {/* ================= PRODUCTS ================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 px-3 mt-4 pb-6">
          {products.map((item, index) => (
            <ProductCard
              key={`${item.id}-${index}`}
              id={item.id}
              name={item.name}
              price={item.price}
              image={item.image_path}
              stock={item.stock}
              seller={market?.shop_name}
            />
          ))}
        </div>

        {/* ================= LOAD MORE ================= */}
        {hasMore && (
          <button
            onClick={() => fetchProducts({ cursor: nextCursor })}
            className="text-xs text-secondary py-4"
          >
            {loadingProducts ? <SkeletonLoader /> : "Load More"}
          </button>
        )}
      </div>
    </div>
  );
}

export default Market;
