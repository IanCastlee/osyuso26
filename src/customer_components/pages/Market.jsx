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

  const activeCategoryName =
    activeMode === "all"
      ? "All Products"
      : categories.find((cat) => Number(cat.id) === Number(activeCategory))
          ?.name || "Products";

  const activeSubcategoryName =
    activeSubcategory === ALL
      ? "All Subcategories"
      : subcategories.find(
          (sub) => Number(sub.id) === Number(activeSubcategory),
        )?.name || "All Subcategories";

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
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 240;

      if (bottom && hasMore && !loadingProducts && nextCursor) {
        fetchProducts({ cursor: nextCursor });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [market?.shop_id, nextCursor, hasMore, loadingProducts]);

  if (loading) {
    return <MarketSkeletonLoader />;
  }

  const openDirections = () => {
    const destination = market?.address?.trim();

    if (!destination) return;

    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      destination,
    )}&travelmode=driving`;

    if (!navigator.geolocation) {
      window.open(fallbackUrl, "_blank", "noopener,noreferrer");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origin = `${position.coords.latitude},${position.coords.longitude}`;

        const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
          origin,
        )}&destination=${encodeURIComponent(destination)}&travelmode=driving`;

        window.open(url, "_blank", "noopener,noreferrer");
      },
      () => {
        window.open(fallbackUrl, "_blank", "noopener,noreferrer");
      },
    );
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <section className="mx-auto w-full max-w-7xl px-2 py-5  lg:px-[120px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-44 sm:h-56 lg:h-64">
            <LazyLoadImage
              src={market?.shop_cover_photo || bgImage}
              alt={market?.shop_name || "Market cover"}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

            <div className="absolute bottom-5 left-5 right-5 flex items-end gap-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg sm:h-28 sm:w-28">
                <LazyLoadImage
                  src={market?.shop_logo || profileImage}
                  alt={market?.shop_name || "Market logo"}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 pb-1 text-white">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                  Official Store
                </p>
                <h1 className="mt-1 truncate text-2xl font-bold sm:text-3xl">
                  {market?.shop_name || "Market"}
                </h1>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-2">
              <button
                type="button"
                onClick={openDirections}
                className="flex max-w-3xl items-start gap-2 text-left text-sm text-slate-600 transition hover:text-secondary hover:underline"
              >
                <CiLocationOn className="mt-0.5 shrink-0 text-lg text-secondary" />
                <span>{market?.address || "Address unavailable"}</span>
              </button>

              <div className="flex items-start gap-2 text-sm text-slate-500">
                <icons.CiLocationArrow1 className="mt-0.5 shrink-0 text-secondary" />
                <span>
                  Nearby Landmark:{" "}
                  <span className="font-medium text-slate-700">
                    {market?.nearby || "Not specified"}
                  </span>
                </span>
              </div>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              <span className="font-semibold text-slate-900">
                {products.length}
              </span>
              products shown
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-950">
                {activeCategoryName}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Browse products from this market by category and subcategory.
              </p>
            </div>

            <div className="relative w-full lg:w-64">
              <button
                onClick={() => setOpenDropdown(!openDropdown)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <icons.MdSort className="shrink-0 text-secondary" />
                  <span className="truncate">{activeSubcategoryName}</span>
                </span>
                <span className="text-xs text-slate-400">
                  {openDropdown ? "Close" : "Filter"}
                </span>
              </button>

              {openDropdown && (
                <div className="absolute  left-0 right-0 top-14 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  <div className="max-h-64 overflow-y-auto p-2">
                    <button
                      onClick={() => {
                        setActiveSubcategory(ALL);
                        setActiveMode(activeCategory ? "category" : "all");
                        setOpenDropdown(false);
                      }}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100 ${
                        activeSubcategory === ALL
                          ? "bg-orange-50 font-semibold text-secondary"
                          : "text-slate-600"
                      }`}
                    >
                      All Subcategories
                    </button>

                    {subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setActiveSubcategory(sub.id);
                          setActiveMode("sub");
                          setOpenDropdown(false);
                        }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100 ${
                          Number(activeSubcategory) === Number(sub.id)
                            ? "bg-orange-50 font-semibold text-secondary"
                            : "text-slate-600"
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto border-t border-slate-100 pt-4 no-scrollbar">
            <button
              onClick={() => {
                setActiveMode("all");
                setActiveSubcategory(ALL);
                setProducts([]);
                setNextCursor(null);
                setHasMore(true);
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                activeMode === "all"
                  ? "bg-secondary text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950"
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
                  setActiveSubcategory(ALL);
                }}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeCategory === cat.id && activeMode === "category"
                    ? "bg-secondary text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          {loadingProducts && products.length === 0 ? (
            <SkeletonLoader count={10} />
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-1 pb-8 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {products.map((item) => (
                <ProductCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  price={item.price}
                  originalPrice={item.original_price}
                  finalPrice={item.final_price}
                  isOnSale={item.is_on_sale}
                  saleLabel={item.sale_label}
                  image={item.image_path}
                  seller={item.shop_name}
                  stock={item.stock}
                  unitType={item.unit_type}
                  isShopOpen={item.is_shop_open}
                  shopClosedMessage={item.shop_closed_message}
                  shopOpensAt={item.shop_opens_at}
                  shopClosesAt={item.shop_closes_at}
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
                  Try another category or subcategory.
                </p>
              </div>
            </div>
          )}

          {hasMore && products.length > 0 && (
            <div className="flex justify-center pb-10">
              <button
                onClick={() => fetchProducts({ cursor: nextCursor })}
                disabled={loadingProducts}
                className="rounded-full bg-secondary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingProducts ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Market;
