import React, { useMemo, useState } from "react";
import {
  FiBox,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiSearch,
  FiSlash,
  FiX,
} from "react-icons/fi";

import AdminTable from "../organisms/AdminTable";
import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";
import { useToast } from "../../context/ToastContext";
import ViewProducts from "../organisms/ViewProducts";

const inactiveReasons = [
  "Product information needs to be reviewed before it can remain visible.",
  "Product image or description does not meet OSYUSO listing guidelines.",
  "Product is temporarily hidden due to stock or availability concerns.",
];

function Products() {
  const { showToast } = useToast();

  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [cursor, setCursor] = useState(null);
  const [history, setHistory] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);

  const [confirmAction, setConfirmAction] = useState({
    open: false,
    row: null,
    status: "",
    reason: "",
  });

  const query = useMemo(() => {
    const q = new URLSearchParams();

    q.append("status", status);
    q.append("limit", String(limit));

    if (search.trim()) q.append("search", search.trim());
    if (cursor) q.append("cursor", cursor);

    return q.toString();
  }, [status, limit, search, cursor]);

  const { data, loading, error, refetch } = useGetData(
    `admin/get-products.php?${query}`,
  );

  const payload = data || {
    summary: {},
    rows: [],
    has_more: false,
    next_cursor: null,
  };

  const summary = payload.summary || {};
  const rows = payload.rows || [];

  const hasMore = Boolean(payload.has_more);
  const nextCursor = payload.next_cursor || null;
  const canGoNext = Boolean(hasMore && nextCursor);
  const canGoPrev = history.length > 0;

  const { submit: updateStatus, loading: updating } = useFormSubmit(
    "admin/update-product-status.php",
    () => {
      showToast({
        type: "success",
        message: "Product status updated.",
        duration: 3000,
      });

      closeConfirm();
      refetch();
    },
  );

  const resetPaging = () => {
    setCursor(null);
    setHistory([]);
  };

  const handleStatusChange = (nextStatus) => {
    setStatus(nextStatus);
    resetPaging();
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    resetPaging();
  };

  const handleLimitChange = (value) => {
    setLimit(Number(value));
    resetPaging();
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

  const fileUrl = (path) => {
    if (!path) return "";
    return path;
  };

  const formatPeso = (value) =>
    `₱${Number(value || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (value) => {
    if (!value) return "Not set";

    const date = new Date(String(value).replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusClass = (value) => {
    if (value === "active") return "bg-emerald-50 text-emerald-700";
    return "bg-amber-50 text-amber-700";
  };

  const openConfirm = (row, nextStatus) => {
    setConfirmAction({
      open: true,
      row,
      status: nextStatus,
      reason: "",
    });
  };

  const closeConfirm = () => {
    setConfirmAction({
      open: false,
      row: null,
      status: "",
      reason: "",
    });
  };

  const requiresReason = confirmAction.status === "inactive";
  const reasonIsInvalid =
    requiresReason && confirmAction.reason.trim().length < 8;

  const submitAction = () => {
    if (reasonIsInvalid) return;

    updateStatus({
      product_id: confirmAction.row?.id,
      status: confirmAction.status,
      reason: confirmAction.reason.trim(),
    });
  };

  const tabs = [
    { key: "all", label: "All", count: summary.total_products },
    { key: "active", label: "Active", count: summary.active_products },
    { key: "inactive", label: "Inactive", count: summary.inactive_products },
    { key: "out_of_stock", label: "Out of Stock", count: summary.out_of_stock },
  ];

  const columns = [
    {
      header: "Product",
      render: (row) => (
        <div className="flex min-w-[280px] items-center gap-3">
          {row.image_path ? (
            <img
              src={fileUrl(row.image_path)}
              alt={row.name}
              className="h-14 w-16 rounded-lg bg-slate-100 object-cover"
            />
          ) : (
            <div className="flex h-14 w-16 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <FiBox />
            </div>
          )}

          <div className="min-w-0">
            <p className="line-clamp-1 text-sm font-bold text-slate-950">
              {row.name}
            </p>
            <p className="line-clamp-1 text-xs text-slate-500">
              {row.description || "No description"}
            </p>
            {row.is_on_sale && (
              <span className="mt-1 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                {row.sale_label || "On Sale"}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Vendor / Shop",
      render: (row) => (
        <div className="min-w-[210px]">
          <p className="text-sm font-semibold text-slate-900">
            {row.vendor_name || "Vendor"}
          </p>
          <p className="truncate text-xs text-slate-500">
            {row.shop_name || "Shop"}
          </p>
          <p className="truncate text-xs text-slate-400">
            {row.vendor_email || "No email"}
          </p>
        </div>
      ),
    },
    {
      header: "Price",
      render: (row) => (
        <div>
          <p className="text-sm font-bold text-slate-950">
            {formatPeso(row.price)}
          </p>
          <p className="text-xs text-slate-500">per {row.unit_type}</p>
        </div>
      ),
    },
    {
      header: "Stock",
      render: (row) => (
        <span
          className={`text-sm font-semibold ${
            Number(row.stock) <= 0 ? "text-red-600" : "text-slate-800"
          }`}
        >
          {Number(row.stock || 0)} {row.unit_type}
        </span>
      ),
    },
    {
      header: "Shop Status",
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
            row.shop_status,
          )}`}
        >
          {row.shop_status || "inactive"}
        </span>
      ),
    },
    {
      header: "Product Status",
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
            row.status,
          )}`}
        >
          {row.status}
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
            type="button"
            onClick={() => setSelectedProduct(row)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-700 transition hover:bg-slate-100"
            title="View product details"
          >
            <FiEye />
          </button>

          {row.status !== "active" && (
            <button
              type="button"
              onClick={() => openConfirm(row, "active")}
              disabled={updating}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
              title="Set active"
            >
              <FiCheckCircle />
            </button>
          )}

          {row.status === "active" && (
            <button
              type="button"
              onClick={() => openConfirm(row, "inactive")}
              disabled={updating}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
              title="Set inactive"
            >
              <FiSlash />
            </button>
          )}
        </div>
      ),
    },
  ];

  const confirmTitle =
    confirmAction.status === "active"
      ? "Activate Product?"
      : "Set Product as Inactive?";

  const confirmMessage =
    confirmAction.status === "active"
      ? "This will allow the product to be visible and available again if the shop is active."
      : "This will hide the product from customers. A reason will be sent to the vendor.";

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-secondary">
              <FiBox className="text-xl" />
            </span>

            <div>
              <h1 className="text-xl font-bold text-slate-950">
                Vendor Products
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Review and manage all products listed by vendors.
              </p>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Total Products
              </p>
              <p className="mt-2 text-xl font-bold text-slate-950">
                {summary.total_products || 0}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase text-emerald-500">
                Active
              </p>
              <p className="mt-2 text-xl font-bold text-emerald-700">
                {summary.active_products || 0}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase text-amber-500">
                Inactive
              </p>
              <p className="mt-2 text-xl font-bold text-amber-700">
                {summary.inactive_products || 0}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase text-red-500">
                Out of Stock
              </p>
              <p className="mt-2 text-xl font-bold text-red-700">
                {summary.out_of_stock || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="mb-4 flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleStatusChange(tab.key)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    status === tab.key
                      ? "bg-secondary text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                  {Number(tab.count || 0) > 0 && (
                    <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_160px_120px]">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Search
                </label>

                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                  <input
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search product, vendor, shop, or email..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-secondary focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Rows
                </label>

                <select
                  value={limit}
                  onChange={(e) => handleLimitChange(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-secondary focus:bg-white"
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

                <div className="flex h-11 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold">
                  {rows.length}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto p-4">
            <AdminTable columns={columns} data={rows} loading={loading} />
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

      {confirmAction.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-bold text-slate-950">
                {confirmTitle}
              </h2>

              <button
                onClick={closeConfirm}
                disabled={updating}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <FiX />
              </button>
            </div>

            <div className="px-5 py-4">
              <p className="text-sm leading-6 text-slate-600">
                {confirmMessage}
              </p>

              {confirmAction.status === "inactive" && (
                <div className="mt-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Ready Reasons
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {inactiveReasons.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() =>
                          setConfirmAction((prev) => ({
                            ...prev,
                            reason,
                          }))
                        }
                        className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Message {requiresReason ? "" : "(Optional)"}
                </label>

                <textarea
                  value={confirmAction.reason}
                  onChange={(e) =>
                    setConfirmAction((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  rows={4}
                  placeholder={
                    requiresReason
                      ? "Write a clear reason for setting this product inactive..."
                      : "Add an optional message for the vendor..."
                  }
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-secondary focus:bg-white"
                />

                {reasonIsInvalid && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    Please provide a clear reason with at least 8 characters.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                onClick={closeConfirm}
                disabled={updating}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={submitAction}
                disabled={updating || reasonIsInvalid}
                className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updating
                  ? "Processing..."
                  : confirmAction.status === "active"
                    ? "Activate"
                    : "Set Inactive"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ViewProducts
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        fileUrl={fileUrl}
        formatPeso={formatPeso}
        formatDate={formatDate}
        getStatusClass={getStatusClass}
      />
    </div>
  );
}

export default Products;
