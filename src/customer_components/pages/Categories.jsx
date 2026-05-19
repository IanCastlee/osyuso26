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
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

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

  const activeName =
    active === "all"
      ? "All Products"
      : subCategories.find((item) => Number(item.id) === Number(active))
          ?.name || "Selected";

  const fetchProducts = async ({
    cursor = null,
    direction = "next",
    reset = false,
  } = {}) => {
    if (loadingMore) return;
    if (!active && active !== "all") return;

    if (reset) {
      setInitialLoading(true);
    }

    setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        limit: "20",
      });

      if (active === "all") {
        params.append("category_id", categoryId);
      } else {
        params.append("subcategory_id", active);
      }

      if (cursor) {
        params.append("cursor", cursor);
        params.append("direction", direction);
      }

      const res = await fetch(`${URL.URL}product/get-products_c.php?${params}`);
      const json = await res.json();

      console.log("JSON : ", json);

      if (!json.success) {
        if (reset) setProducts([]);
        setHasMore(false);
        return;
      }

      const rows = Array.isArray(json.data) ? json.data : [];

      setProducts((prev) => {
        const merged = reset ? rows : [...prev, ...rows];

        return Array.from(
          new Map(merged.map((item) => [Number(item.id), item])).values(),
        );
      });

      setNextCursor(json.next_cursor || null);
      setHasMore(Boolean(json.next_cursor));
    } catch (err) {
      console.error("FETCH ERROR:", err);

      if (reset) {
        setProducts([]);
      }

      setHasMore(false);
    } finally {
      setLoadingMore(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (!active && active !== "all") return;

    setProducts([]);
    setNextCursor(null);
    setHasMore(true);

    fetchProducts({ reset: true });
  }, [active, categoryId]);

  useEffect(() => {
    const handleScroll = () => {
      const bottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 240;

      if (bottom && hasMore && !loadingMore && nextCursor) {
        fetchProducts({
          cursor: nextCursor,
          direction: "next",
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [nextCursor, hasMore, loadingMore, active, categoryId]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <section className="mx-auto w-full max-w-7xl px-2 py-5 sm:px-6 lg:px-[100px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                Category
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
                {urlName || "Products"}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Browse fresh picks and filter products by subcategory.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              <span className="font-medium text-slate-900">
                {products.length}
              </span>
              products shown
            </div>
          </div>

          <div className="mt-5 hidden border-t border-slate-100 pt-4 lg:block">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActive("all")}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  active === "all"
                    ? "bg-secondary text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950"
                }`}
              >
                All Products
              </button>

              {loading ? (
                <div className="flex items-center px-3 text-sm text-slate-400">
                  Loading filters...
                </div>
              ) : (
                subCategories.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActive(Number(item.id))}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                      active === Number(item.id)
                        ? "bg-secondary text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950"
                    }`}
                  >
                    {item.name}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="relative mt-5 lg:hidden">
            <button
              onClick={() => setOpenDropdown(!openDropdown)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800"
            >
              <span className="flex items-center gap-2">
                <icons.MdSort className="text-secondary" />
                {activeName}
              </span>
              <span className="text-xs text-slate-400">
                {openDropdown ? "Close" : "Filter"}
              </span>
            </button>

            {openDropdown && (
              <div className="absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="max-h-64 overflow-y-auto p-2">
                  <button
                    onClick={() => {
                      setActive("all");
                      setOpenDropdown(false);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100 ${
                      active === "all"
                        ? "bg-orange-50 font-semibold text-secondary"
                        : "text-slate-600"
                    }`}
                  >
                    All Products
                  </button>

                  {subCategories.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActive(Number(item.id));
                        setOpenDropdown(false);
                      }}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100 ${
                        Number(active) === Number(item.id)
                          ? "bg-orange-50 font-semibold text-secondary"
                          : "text-slate-600"
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-4 flex items-center justify-between pl-1">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {activeName}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Showing available products in this category.
              </p>
            </div>
          </div>

          {initialLoading ? (
            <SkeletonLoader count={10} />
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 pb-8 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {products.map((item) => (
                <ProductCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  price={item.final_price ?? item.price}
                  originalPrice={item.original_price ?? item.price}
                  finalPrice={item.final_price ?? item.price}
                  isOnSale={item.is_on_sale}
                  saleLabel={item.sale_label}
                  image={item.image_path}
                  seller={item.shop_name}
                  stock={item.stock}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div>
                <p className="text-base font-semibold text-slate-900">
                  No products found
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Try selecting another subcategory.
                </p>
              </div>
            </div>
          )}

          {hasMore && products.length > 0 && (
            <div className="flex justify-center pb-10">
              <button
                onClick={() =>
                  fetchProducts({
                    cursor: nextCursor,
                    direction: "next",
                  })
                }
                disabled={loadingMore}
                className="rounded-full bg-secondary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Categories;
