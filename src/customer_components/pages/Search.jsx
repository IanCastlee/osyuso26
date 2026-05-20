import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { FiMapPin, FiSearch, FiShoppingBag } from "react-icons/fi";

import ProductCard from "../molecules/ProductCard";
import useGetData from "../../hooks/useGetData";
import bgImage from "../../assets/assets_osyuso/defaultCover.webp";
import profileImage from "../../assets/assets_osyuso/shop.png";

function useDebouncedValue(value, delay = 450) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlQuery = searchParams.get("q") || "";

  const [searchText, setSearchText] = useState(urlQuery);
  const [activeTab, setActiveTab] = useState("all");

  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);

  const [productCursor, setProductCursor] = useState(null);
  const [shopCursor, setShopCursor] = useState(null);

  const [productNextCursor, setProductNextCursor] = useState(null);
  const [shopNextCursor, setShopNextCursor] = useState(null);

  const [productHasMore, setProductHasMore] = useState(false);
  const [shopHasMore, setShopHasMore] = useState(false);

  const debouncedQuery = useDebouncedValue(searchText.trim());

  const resetResults = () => {
    setProducts([]);
    setShops([]);
    setProductCursor(null);
    setShopCursor(null);
    setProductNextCursor(null);
    setShopNextCursor(null);
    setProductHasMore(false);
    setShopHasMore(false);
  };

  const mergeById = (oldRows, newRows) => {
    return Array.from(
      new Map([...oldRows, ...newRows].map((item) => [item.id, item])).values(),
    );
  };

  useEffect(() => {
    setSearchText(urlQuery);
    resetResults();
  }, [urlQuery]);

  useEffect(() => {
    resetResults();
  }, [debouncedQuery, activeTab]);

  const endpoint = useMemo(() => {
    if (!debouncedQuery) return null;

    const params = new URLSearchParams({
      q: debouncedQuery,
      type: activeTab,
      limit: activeTab === "all" ? "8" : "20",
    });

    if (activeTab === "products" && productCursor) {
      params.append("product_cursor", productCursor);
    }

    if (activeTab === "shops" && shopCursor) {
      params.append("shop_cursor", shopCursor);
    }

    return `search/search.php?${params.toString()}`;
  }, [debouncedQuery, activeTab, productCursor, shopCursor]);

  const { data, loading } = useGetData(endpoint);

  useEffect(() => {
    if (!data) return;

    const payload = data?.data || data;

    const productRows = Array.isArray(payload.products?.rows)
      ? payload.products.rows
      : [];

    const shopRows = Array.isArray(payload.shops?.rows)
      ? payload.shops.rows
      : [];

    if (activeTab === "products") {
      setProducts((prev) =>
        productCursor ? mergeById(prev, productRows) : productRows,
      );
      setShops([]);
    } else if (activeTab === "shops") {
      setShops((prev) => (shopCursor ? mergeById(prev, shopRows) : shopRows));
      setProducts([]);
    } else {
      setProducts(productRows);
      setShops(shopRows);
    }

    setProductNextCursor(payload.products?.next_cursor || null);
    setShopNextCursor(payload.shops?.next_cursor || null);
    setProductHasMore(Boolean(payload.products?.has_more));
    setShopHasMore(Boolean(payload.shops?.has_more));
  }, [data]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const keyword = searchText.trim();
    if (!keyword) return;

    navigate(`/search?q=${encodeURIComponent(keyword)}`);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    resetResults();
  };

  const totalResults = products.length + shops.length;
  const showProducts = activeTab === "all" || activeTab === "products";
  const showShops = activeTab === "all" || activeTab === "shops";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <section className="mx-auto w-full max-w-7xl lg:px-3 lg:py-4  lg:px-[120px]">
        <div className="overflow-hidden rounded-none lg:rounded-2xl border border-orange-200 bg-white shadow-sm">
          <div className="bg-orange-500 px-4 py-6 text-white sm:px-6 sm:py-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                  Search
                </p>

                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  Find products and markets
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-white/85">
                  Search products or shops by name, description, or location.
                </p>
              </div>

              <div className="w-fit rounded-full bg-white/15 px-4 py-2 text-sm text-white">
                <span className="font-bold">{totalResults}</span> results shown
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5">
              <div className="flex flex-col gap-2 rounded-xl bg-white p-2 shadow-sm sm:flex-row">
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search products or markets"
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />

                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  <FiSearch />
                  Search
                </button>
              </div>
            </form>
          </div>

          <div className="flex gap-2 overflow-x-auto bg-white px-4 py-4 no-scrollbar sm:px-6">
            {[
              { key: "all", label: "All" },
              { key: "products", label: "Products" },
              { key: "shops", label: "Markets" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {!debouncedQuery ? (
          <EmptyState title="Start searching" text="Enter a keyword above." />
        ) : loading && totalResults === 0 ? (
          <EmptyState title="Searching..." text="Finding matches for you." />
        ) : totalResults === 0 ? (
          <EmptyState title="No results found" text="Try another keyword." />
        ) : (
          <div className="mt-5 space-y-8 px-2 lg:px-0">
            {showProducts && products.length > 0 && (
              <section>
                <SectionHeader
                  title="Products"
                  showAction={activeTab === "all" && productHasMore}
                  onAction={() => handleTabChange("products")}
                />

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
                      unitType={item.unit_type}
                    />
                  ))}
                </div>

                {activeTab === "products" && productHasMore && (
                  <LoadMore
                    loading={loading}
                    onClick={() => setProductCursor(productNextCursor)}
                  />
                )}
              </section>
            )}

            {showShops && shops.length > 0 && (
              <section>
                <SectionHeader
                  title="Markets"
                  showAction={activeTab === "all" && shopHasMore}
                  onAction={() => handleTabChange("shops")}
                />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {shops.map((shop) => (
                    <Link
                      key={shop.id}
                      to={`/market/${shop.id}`}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="relative h-36 sm:h-40">
                        <LazyLoadImage
                          src={shop.shop_cover_photo || bgImage}
                          alt={shop.shop_name}
                          className="h-full w-full object-cover"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 to-transparent" />

                        <div className="absolute -bottom-8 left-4 h-16 w-16 overflow-hidden rounded-xl border-4 border-white bg-white shadow">
                          <LazyLoadImage
                            src={shop.shop_logo || profileImage}
                            alt={shop.shop_name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>

                      <div className="px-4 pb-4 pt-10">
                        <h3 className="truncate text-base font-bold text-slate-950">
                          {shop.shop_name}
                        </h3>

                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {shop.shop_description || "No description"}
                        </p>

                        <p className="mt-3 flex items-start gap-2 text-xs text-slate-500">
                          <FiMapPin className="mt-0.5 shrink-0 text-orange-500" />
                          <span className="line-clamp-2">
                            {shop.address || "Address unavailable"}
                          </span>
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                {activeTab === "shops" && shopHasMore && (
                  <LoadMore
                    loading={loading}
                    onClick={() => setShopCursor(shopNextCursor)}
                  />
                )}
              </section>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function SectionHeader({ title, showAction, onAction }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-bold text-slate-950">{title}</h2>

      {showAction && (
        <button
          onClick={onAction}
          className="text-sm font-semibold text-orange-500 hover:underline"
        >
          View all
        </button>
      )}
    </div>
  );
}

function LoadMore({ loading, onClick }) {
  return (
    <div className="mt-6 flex justify-center">
      <button
        onClick={onClick}
        disabled={loading}
        className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Loading..." : "Load More"}
      </button>
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="mt-5 flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-white p-8 text-center">
      <div>
        <FiShoppingBag className="mx-auto mb-3 text-3xl text-orange-300" />
        <p className="text-base font-semibold text-slate-950">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{text}</p>
      </div>
    </div>
  );
}

export default Search;
