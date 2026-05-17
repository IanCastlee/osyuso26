import React, { useEffect, useState } from "react";
import ProductCard from "../molecules/ProductCard";
import { useParams, useSearchParams } from "react-router-dom";
import useGetData from "../../hooks/useGetData";
import { icons } from "../../constant/icons";
import SkeletonLoader from "../../reusable_components/SkeletonLoader";
import { URL } from "../../utils/URL";

function Categories() {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();

  const urlName = searchParams.get("name");

  const [subCategories, setSubCategories] = useState([]);
  const [active, setActive] = useState("all");
  const [openDropdown, setOpenDropdown] = useState(false);

  const [products, setProducts] = useState([]);

  const [nextCursor, setNextCursor] = useState(null);
  const [prevCursor, setPrevCursor] = useState(null);

  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // ================= SUBCATEGORIES =================
  const { data, loading } = useGetData(
    `product/get-subcategories.php?category_id=${categoryId}`,
  );

  useEffect(() => {
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : [];

    setSubCategories(list);
  }, [data]);

  // ================= FETCH PRODUCTS =================
  const fetchProducts = async ({
    cursor = null,
    direction = "next",
    reset = false,
  } = {}) => {
    if (loadingMore) return;
    if (!active && active !== "all") return;

    setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        limit: 20,
      });

      // ================= FILTER =================
      if (active === "all") {
        params.append("category_id", categoryId);
      } else {
        params.append("subcategory_id", active);
      }

      // ================= CURSOR =================
      if (cursor) {
        params.append("cursor", cursor);
        params.append("direction", direction);
      }

      const res = await fetch(`${URL.URL}product/get-products_c.php?${params}`);

      const json = await res.json();

      console.log("API RESPONSE:", json);

      if (!json.success) return;

      setProducts((prev) => (reset ? json.data : [...prev, ...json.data]));

      setNextCursor(json.next_cursor);
      setPrevCursor(json.prev_cursor);
      setHasMore(!!json.next_cursor);
    } catch (err) {
      console.error("FETCH ERROR:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // ================= RESET ON FILTER CHANGE =================
  useEffect(() => {
    if (!active && active !== "all") return;

    setProducts([]);
    setNextCursor(null);
    setPrevCursor(null);
    setHasMore(true);

    fetchProducts({ reset: true });
  }, [active]);

  // ================= INFINITE SCROLL =================
  useEffect(() => {
    const handleScroll = () => {
      const bottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;

      if (bottom && hasMore && !loadingMore && active) {
        fetchProducts({
          cursor: nextCursor,
          direction: "next",
        });
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [nextCursor, hasMore, loadingMore, active]);

  console.log("PROD : ", products);

  // ================= UI =================
  return (
    <div className="w-full bg-gray-100 min-h-[calc(100vh-4rem)] px-1 lg:px-[150px]">
      <div className="w-full h-full flex  flex-col bg-primary px-1 lg:px-3  py-6 ">
        {/* TITLE */}
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
          {urlName || "Category"}
        </h1>

        {/* DESKTOP TABS */}
        <div className="mt-3 border-b border-white/10 hidden lg:block mb-2">
          <div className="flex gap-12 overflow-x-auto no-scrollbar py-2  border-b border-gray-200">
            {/* ALL */}
            <button
              onClick={() => setActive("all")}
              className={`pb-2 cursor-pointer px-4 text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0
                ${
                  active === "all"
                    ? "text-orange-500 font-semibold border-b-2 border-orange-500"
                    : "text-gray-500 hover:text-orange-500 hover:border-orange-500"
                }
              `}
            >
              All
            </button>

            {/* SUBCATEGORIES */}
            {loading ? (
              <p className="text-gray-500 text-xs">Loading...</p>
            ) : (
              subCategories.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActive(Number(item.id))}
                  className={`pb-2 cursor-pointer  px-4 text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0
                    ${
                      active === Number(item.id)
                        ? "text-orange-500 font-semibold border-b-2 border-orange-500"
                        : "text-gray-500 hover:text-orange-500 hover:border-orange-500"
                    }
                  `}
                >
                  {item.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* MOBILE DROPDOWN */}
        <div className="flex justify-end w-full lg:hidden relative mt-2 mb-2">
          <button
            onClick={() => setOpenDropdown(!openDropdown)}
            className="flex items-center gap-2 text-xs text-secondary"
          >
            <icons.MdSort />

            {active === "all"
              ? "All"
              : subCategories.find((s) => Number(s.id) === Number(active))
                  ?.name || "Select"}
          </button>

          {openDropdown && (
            <div className="absolute top-8 right-0 w-48 bg-white shadow-lg rounded-md z-50">
              <div className="max-h-48 overflow-y-auto">
                {/* ALL */}
                <button
                  onClick={() => {
                    setActive("all");
                    setOpenDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100
                    ${active === "all" ? "text-secondary font-semibold" : ""}
                  `}
                >
                  All
                </button>

                {/* SUBCATEGORIES */}
                {subCategories.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActive(Number(item.id));
                      setOpenDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100
                      ${
                        Number(active) === Number(item.id)
                          ? "text-secondary font-semibold"
                          : ""
                      }
                    `}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PRODUCTS */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {loading && products.length === 0 ? (
            <SkeletonLoader count={10} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5 pb-10 mt-1">
              {[...products].map((item, index) => (
                <ProductCard
                  key={`${item.id}-${index}`}
                  id={item.id}
                  name={item.name}
                  price={item.price}
                  image={item.image_path}
                  seller={item.shop_name}
                  stock={item.stock}
                />
              ))}
            </div>
          )}

          {hasMore && !loading && (
            <button
              onClick={() =>
                fetchProducts({
                  cursor: nextCursor,
                  direction: "next",
                })
              }
              className="w-full text-xs text-orange-500 font-semibold py-3"
            >
              {loadingMore ? <SkeletonLoader /> : "Load More"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Categories;
