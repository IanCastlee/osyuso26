import React, { useEffect, useMemo, useState } from "react";
import { FaClipboardList } from "react-icons/fa";
import {
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiShoppingBag,
  FiRefreshCw,
} from "react-icons/fi";

import VendorTable from "../organisms/VendorTable";
import useGetData from "../../hooks/useGetData";
import noImage from "../../assets/assets_osyuso/no-image.png";
import useFormSubmit from "../../hooks/useFormSubmit";
import { useToast } from "../../context/ToastContext";

function ReservationHistory() {
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [cursor, setCursor] = useState(null);
  const [history, setHistory] = useState([]);
  const [orderRows, setOrderRows] = useState([]);

  const { showToast } = useToast();

  const query = useMemo(() => {
    const q = new URLSearchParams();

    q.append("limit", String(limit));
    if (search.trim()) q.append("search", search.trim());
    if (cursor) q.append("cursor", cursor);

    return q.toString();
  }, [limit, search, cursor]);

  const { data, loading, refetch } = useGetData(
    `order/get-vendor-order_history.php?${query}`,
  );

  const payload = useMemo(() => data?.data || data, [data]);

  const orders = useMemo(() => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }, [payload]);

  useEffect(() => {
    setOrderRows(orders);
  }, [orders]);

  const hasMore = Boolean(payload?.has_more);
  const nextCursor = payload?.next_cursor || null;

  const canGoNext = Boolean(hasMore && nextCursor);
  const canGoPrev = history.length > 0;

  const { submit: markUnclaimedSubmit, loading: markingUnclaimed } =
    useFormSubmit("order/mark-unclaimed.php", () => {
      showToast({
        type: "success",
        message: "Order marked as unclaimed",
        duration: 3000,
      });
    });

  const markAsUnclaimed = async (orderId) => {
    try {
      await markUnclaimedSubmit({ order_id: orderId });

      setOrderRows((prev) =>
        prev.map((order) =>
          Number(order.id) === Number(orderId)
            ? {
                ...order,
                claim_status: "unclaimed",
                claimed_at: null,
              }
            : order,
        ),
      );

      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setCursor(null);
    setHistory([]);
  }, [search, limit]);

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

  const formatMoney = (value) => `₱${Number(value || 0).toFixed(2)}`;

  const formatDate = (value) => {
    if (!value) return "Not set";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getQty = (row) => {
    if (Number(row.weight) > 0) return `${row.weight} kg`;
    return `${row.quantity || 0} pcs`;
  };

  const handleRefresh = () => {
    setCursor(null);
    setHistory([]);
    refetch();
  };

  const columns = [
    {
      header: "Order",
      render: (row) => (
        <div>
          <p className="text-sm font-bold text-slate-950">#{row.id}</p>
          <p className="text-xs text-slate-500">{formatDate(row.created_at)}</p>
        </div>
      ),
    },
    {
      header: "Product",
      render: (row) => (
        <div className="flex min-w-[260px] items-center gap-3">
          <img
            src={row.image_path || noImage}
            alt={row.product_name}
            className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 object-cover"
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">
              {row.product_name || "Unknown product"}
            </p>
            <p className="line-clamp-1 text-xs text-slate-500">
              {row.shop_name || "Shop"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Customer",
      render: (row) => (
        <div className="min-w-[160px]">
          <p className="truncate text-sm font-semibold text-slate-800">
            {row.customer_name || "Customer"}
          </p>
          <p className="truncate text-xs text-slate-500">
            {row.customer_email || "-"}
          </p>
        </div>
      ),
    },
    {
      header: "Qty/Weight",
      render: (row) => (
        <span className="text-sm font-semibold text-slate-700">
          {getQty(row)}
        </span>
      ),
    },
    {
      header: "Unit Price",
      render: (row) => (
        <span className="text-sm font-medium text-slate-600">
          {formatMoney(row.unit_price)}
        </span>
      ),
    },
    {
      header: "Total",
      render: (row) => (
        <span className="text-sm font-bold text-slate-950">
          {formatMoney(row.total_amount)}
        </span>
      ),
    },
    {
      header: "Payment",
      render: (row) => {
        const status = row.payment_status || "pending";

        return (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              status === "paid"
                ? "bg-emerald-50 text-emerald-700"
                : status === "expired"
                  ? "bg-red-50 text-red-700"
                  : "bg-amber-50 text-amber-700"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      header: "Receipt",
      render: (row) => (
        <span className="text-xs font-medium text-slate-600">
          {row.receipt_no || "-"}
        </span>
      ),
    },
    {
      header: "Claim",
      render: (row) => (
        <div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              row.claim_status === "claimed"
                ? "bg-blue-50 text-blue-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {row.claim_status || "unclaimed"}
          </span>

          <p className="truncate text-[10px] text-slate-500">
            {row.claimed_at || "-"}
          </p>
        </div>
      ),
    },
    {
      header: "Action",
      align: "right",
      render: (row) => {
        const canMarkUnclaimed =
          row.payment_status === "paid" && row.claim_status === "claimed";

        return (
          <button
            disabled={!canMarkUnclaimed || markingUnclaimed}
            onClick={() => markAsUnclaimed(row.id)}
            className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {row.claim_status === "claimed" ? "Mark Unclaimed" : "Unclaimed"}
          </button>
        );
      },
    },
  ];

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-secondary">
                <FaClipboardList className="text-xl" />
              </span>

              <div>
                <h1 className="text-xl font-bold text-slate-950">
                  Order History
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Track and manage all recent customer purchases.
                </p>
              </div>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
              <FiShoppingBag className="text-secondary" />
              <span className="font-semibold text-slate-950">
                {orderRows.length}
              </span>
              orders shown
            </div>
          </div>

          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-[1fr_160px_140px]">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Search Orders
              </label>

              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search product, customer, or order ID..."
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
                {orderRows.length} items
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Order History
              </h2>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw
                className={`text-green-600 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Refreshing..." : "Refresh Table"}
            </button>
          </div>

          <div className="overflow-x-auto p-4">
            <VendorTable columns={columns} data={orderRows} loading={loading} />
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
    </div>
  );
}

export default ReservationHistory;
