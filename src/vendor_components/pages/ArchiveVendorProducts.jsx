import React, { useEffect, useMemo, useState } from "react";
import { FaBox } from "react-icons/fa";
import { RiRefreshFill } from "react-icons/ri";

import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit,
  FiPlus,
  FiSearch,
  FiX,
} from "react-icons/fi";

import AddVendorProduct_Form from "../molecules/AddVendorProduct_Form";
import VendorTable from "../organisms/VendorTable";
import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";
import noImage from "../../assets/assets_osyuso/no-image.png";
import { useToast } from "../../context/ToastContext";
import ConfirmationModal from "../../reusable_components/ConfirmationModal";

function ArchiveVendorProducts() {
  const { showToast } = useToast();

  const [openForm, setOpenForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productRows, setProductRows] = useState([]);

  const [confirmArchive, setConfirmArchive] = useState({
    open: false,
    product: null,
  });

  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [cursor, setCursor] = useState(null);
  const [history, setHistory] = useState([]);

  const query = useMemo(() => {
    const q = new URLSearchParams();

    q.append("limit", String(limit));
    if (search.trim()) q.append("search", search.trim());
    if (cursor) q.append("cursor", cursor);

    return q.toString();
  }, [limit, search, cursor]);

  const { data, loading, refetch } = useGetData(
    `product/get-archive-products.php?${query}`,
  );

  const payload = useMemo(() => data?.data || data, [data]);

  const products = useMemo(() => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }, [payload]);

  useEffect(() => {
    setProductRows(products);
  }, [products]);

  const hasMore = Boolean(payload?.has_more ?? products.length >= limit);
  const nextCursor =
    payload?.next_cursor ||
    (products.length >= limit ? products.at(-1)?.id : null);

  const canGoNext = Boolean(hasMore && nextCursor);
  const canGoPrev = history.length > 0;

  const { submit: archiveSubmit, loading: archiving } = useFormSubmit(
    "product/update-active-product.php",
    () => {
      showToast({
        type: "success",
        message: "Product moved to active",
        duration: 3000,
      });
    },
  );

  useEffect(() => {
    setCursor(null);
    setHistory([]);
  }, [search, limit]);

  const handleFormSuccess = () => {
    closeForm();
    refetch();
  };

  const askArchiveProduct = (product) => {
    setConfirmArchive({
      open: true,
      product,
    });
  };

  const closeArchiveModal = () => {
    setConfirmArchive({
      open: false,
      product: null,
    });
  };

  const archiveProduct = async () => {
    const productId = confirmArchive.product?.id;
    if (!productId) return;

    try {
      await archiveSubmit({ product_id: productId });

      setProductRows((prev) =>
        prev.filter((product) => Number(product.id) !== Number(productId)),
      );

      closeArchiveModal();
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNext = () => {
    if (!canGoNext) return;

    setHistory((prev) => [...prev, cursor]);
    setCursor(nextCursor);
  };

  const handlePrev = () => {
    if (!canGoPrev) return;

    const updated = [...history];
    const prevCursor = updated.pop();

    setHistory(updated);
    setCursor(prevCursor || null);
  };

  const formatPrice = (price) => {
    const value = Number(price || 0);
    return `₱${value.toFixed(2)}`;
  };

  const formatDate = (value) => {
    if (!value) return "Not set";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const columns = [
    {
      header: "#",
      render: (row) => (
        <span className="text-sm font-semibold text-slate-900">
          {row.id || "N/A"}
        </span>
      ),
    },
    {
      header: "Product",
      render: (row) => (
        <div className="flex min-w-[240px] items-center gap-3">
          <img
            src={row.image || row.image_path || noImage}
            alt={row.name}
            className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover"
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">
              {row.name}
            </p>
            <p className="line-clamp-1 text-xs text-slate-500">
              {row.description || "No description"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Price",
      render: (row) => (
        <span className="text-sm font-semibold text-slate-900">
          {formatPrice(row.price)}
        </span>
      ),
    },
    {
      header: "Stock",
      render: (row) => {
        const stock = Number(row.stock || 0);

        return (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              stock > 10
                ? "bg-emerald-50 text-emerald-700"
                : stock > 0
                  ? "bg-amber-50 text-amber-700"
                  : "bg-red-50 text-red-700"
            }`}
          >
            {stock} left
          </span>
        );
      },
    },
    {
      header: "Unit",
      render: (row) => (
        <span className="text-sm font-medium text-slate-600">
          {row.unit_type || "pcs"}
        </span>
      ),
    },
    {
      header: "Status",
      render: (row) => (
        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-700">
          {row.status || "active"}
        </span>
      ),
    },
    {
      header: "Created",
      render: (row) => (
        <span className="text-sm text-slate-500">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      header: "Action",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => askArchiveProduct(row)}
            disabled={archiving}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-green-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            title="Move to active"
          >
            <RiRefreshFill className="text-lg" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-secondary">
                <FaBox className="text-xl" />
              </span>

              <div>
                <h1 className="text-xl font-bold text-slate-950">
                  Archive Product
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Manage archived product listings, stock, and pricing.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-[1fr_160px_140px]">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Search Product
              </label>

              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by product name..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-secondary focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Rows
              </label>

              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-secondary focus:bg-white"
              >
                <option value={10}>10 rows</option>
                <option value={20}>20 rows</option>
                <option value={50}>50 rows</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Showing
              </label>

              <div className="flex h-11 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-800">
                {productRows.length} items
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Archive Product List
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Archived products are hidden from active listings.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto p-4">
            <VendorTable
              columns={columns}
              data={productRows}
              loading={loading}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">Page {history.length + 1}</p>

            <div className="flex justify-end gap-2">
              <button
                onClick={handlePrev}
                disabled={!canGoPrev}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiChevronLeft />
                Prev
              </button>

              <button
                onClick={handleNext}
                disabled={!canGoNext}
                className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <FiChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={confirmArchive.open}
        title="Move product to active?"
        message={`This will make "${
          confirmArchive.product?.name || "this product"
        }" visible in active listings again. Existing orders and receipts will not be deleted.`}
        confirmText="Move Active"
        cancelText="Cancel"
        loading={archiving}
        onConfirm={archiveProduct}
        onCancel={closeArchiveModal}
      />
    </div>
  );
}

export default ArchiveVendorProducts;
