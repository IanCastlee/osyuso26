import React, { useEffect, useState } from "react";
import ProductCard from "../molecules/ProductCard";
import { useParams, useSearchParams } from "react-router-dom";
import useGetData from "../../hooks/useGetData";
import { icons } from "../../constant/icons";
import SkeletonLoader from "../../reusable_components/SkeletonLoader";

function Categories() {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();

  const urlName = searchParams.get("name");

  const [subCategories, setSubCategories] = useState([]);
  const [active, setActive] = useState("");
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

    if (list.length > 0) {
      setSubCategories(list);
      setActive(Number(list[0].id));
    }
  }, [data]);

  // ================= FETCH PRODUCTS =================
  const fetchProducts = async ({
    cursor = null,
    direction = "next",
    reset = false,
  } = {}) => {
    if (loadingMore) return;
    if (!active) return;

    setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        subcategory_id: active,
        limit: 20,
      });

      if (cursor) {
        params.append("cursor", cursor);
        params.append("direction", direction);
      }

      const res = await fetch(
        `http://localhost/OSYUSO26/backend/product/get-products_c.php?${params}`,
      );

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

  // ================= RESET ON SUBCATEGORY CHANGE =================
  useEffect(() => {
    if (!active) return;

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
    <div className="w-full bg-gray-100 min-h-[calc(100vh-4rem)]">
      <div className="w-full h-full flex flex-col bg-primary px-3 sm:px-6 lg:px-28 py-3">
        {/* TITLE */}
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
          {urlName || "Category"}
        </h1>

        {/* DESKTOP TABS */}
        <div className="mt-3 border-b border-white/10 hidden lg:block mb-2">
          <div className="flex gap-12 overflow-x-auto no-scrollbar py-2">
            {loading ? (
              <p className="text-gray-500 text-xs">Loading...</p>
            ) : (
              subCategories.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActive(Number(item.id))}
                  className={`pb-2 text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0
                    ${
                      active === item.id
                        ? "text-secondary font-semibold border-b-2 border-secondary"
                        : "text-gray-500 hover:text-secondary"
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
            {subCategories.find((s) => Number(s.id) === Number(active))?.name ||
              "Select"}
          </button>

          {openDropdown && (
            <div className="absolute top-8 right-0 w-48 bg-white shadow-lg rounded-md z-50">
              <div className="max-h-48 overflow-y-auto">
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
              className="w-full text-xs text-secondary py-3"
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Categories;
