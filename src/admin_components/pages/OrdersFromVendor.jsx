import React, { useEffect, useMemo, useState } from "react";
import { FaClipboardList } from "react-icons/fa";
import {
  FiArchive,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEye,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
} from "react-icons/fi";

import useGetData from "../../hooks/useGetData";
import noImage from "../../assets/assets_osyuso/no-image.png";
import AdminTable from "../organisms/AdminTable";
import ReceiptModal from "../organisms/ReceiptModal";

function OrdersFromVendor() {
  const [view, setView] = useState("unclaimed");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [cursor, setCursor] = useState(null);
  const [history, setHistory] = useState([]);
  const [orderRows, setOrderRows] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const orderViews = [
    {
      id: "unclaimed",
      label: "Unclaimed",
      icon: FiCheckCircle,
      description: "Paid orders ready for claiming",
    },
    {
      id: "pending",
      label: "Pending",
      icon: FiClock,
      description: "Orders waiting for payment",
    },
    {
      id: "history",
      label: "Order History",
      icon: FiArchive,
      description: "Claimed, expired, and failed orders",
    },
  ];

  const activeView = orderViews.find((item) => item.id === view);

  const query = useMemo(() => {
    const q = new URLSearchParams();

    q.append("limit", String(limit));
    q.append("view", view);
    if (search.trim()) q.append("search", search.trim());
    if (cursor) q.append("cursor", cursor);

    return q.toString();
  }, [limit, search, cursor, view]);

  const { data, loading, refetch } = useGetData(
    `admin/get-vendor-orders.php?${query}`,
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

  useEffect(() => {
    setCursor(null);
    setHistory([]);
  }, [search, limit, view]);

  const hasMore = Boolean(payload?.has_more);
  const nextCursor = payload?.next_cursor || null;
  const canGoNext = Boolean(hasMore && nextCursor);
  const canGoPrev = history.length > 0;

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

  const handleRefresh = () => {
    setCursor(null);
    setHistory([]);
    refetch();
  };

  const formatMoney = (value) => `₱${Number(value || 0).toFixed(2)}`;

  const formatDate = (value) => {
    if (!value) return "-";

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

  const getPaymentClass = (status) => {
    if (status === "paid") return "bg-emerald-50 text-emerald-700";
    if (status === "expired" || status === "failed") {
      return "bg-red-50 text-red-700";
    }
    return "bg-amber-50 text-amber-700";
  };

  const getClaimClass = (status) => {
    if (status === "claimed") return "bg-blue-50 text-blue-700";
    return "bg-slate-100 text-slate-700";
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
            alt={row.product_name || "Product"}
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
        <div className="min-w-[170px]">
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
      header: "Vendor",
      render: (row) => (
        <div className="min-w-[160px]">
          <p className="truncate text-sm font-semibold text-slate-800">
            {row.vendor_name || "Vendor"}
          </p>
          <p className="truncate text-xs text-slate-500">
            {row.vendor_email || "-"}
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
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getPaymentClass(
              status,
            )}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      header: "Claim",
      render: (row) => (
        <div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getClaimClass(
              row.claim_status,
            )}`}
          >
            {row.claim_status || "unclaimed"}
          </span>

          <p className="truncate text-[10px] text-slate-500">
            {row.claimed_at ? formatDate(row.claimed_at) : "-"}
          </p>
        </div>
      ),
    },
    {
      header: "Action",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setSelectedOrder(row)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-700 transition hover:bg-slate-100"
            title="View details"
          >
            <FiEye />
          </button>

          <button
            type="button"
            disabled={!row.receipt_no}
            onClick={() => setSelectedReceipt(row)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
            title="View receipt"
          >
            <FiFileText />
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
                <FaClipboardList className="text-xl" />
              </span>

              <div>
                <h1 className="text-xl font-bold text-slate-950">Orders</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Manage and review all customer orders from vendors.
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

          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-3">
            {orderViews.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={`rounded-xl border p-4 text-left transition ${
                    active
                      ? "border-secondary bg-orange-50 text-secondary"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon />
                    <p className="text-sm font-bold">{item.label}</p>
                  </div>

                  <p className="mt-1 text-xs opacity-80">{item.description}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_160px_140px]">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Search Orders
              </label>

              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search product, customer, vendor, or order ID..."
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
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                {activeView?.label || "Orders"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {activeView?.description || "Latest customer orders."}
              </p>
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
            <AdminTable columns={columns} data={orderRows} loading={loading} />
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

      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        formatMoney={formatMoney}
        formatDate={formatDate}
        getQty={getQty}
      />

      <ReceiptModal
        order={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}

function OrderDetailsModal({
  order,
  onClose,
  formatMoney,
  formatDate,
  getQty,
}) {
  if (!order) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 p-5">
          <h3 className="text-lg font-bold text-slate-950">
            Order #{order.id}
          </h3>
          <p className="text-sm text-slate-500">
            {formatDate(order.created_at)}
          </p>
        </div>

        <div className="grid gap-3 p-5 text-sm sm:grid-cols-2">
          <Info label="Product" value={order.product_name} />
          <Info label="Shop" value={order.shop_name} />
          <Info label="Customer" value={order.customer_name} />
          <Info label="Customer Email" value={order.customer_email} />
          <Info label="Vendor" value={order.vendor_name} />
          <Info label="Vendor Email" value={order.vendor_email} />
          <Info label="Qty/Weight" value={getQty(order)} />
          <Info label="Unit Price" value={formatMoney(order.unit_price)} />
          <Info label="Total" value={formatMoney(order.total_amount)} />
          <Info label="Receipt No." value={order.receipt_no || "-"} />
          <Info label="Payment" value={order.payment_status || "pending"} />
          <Info label="Claim" value={order.claim_status || "unclaimed"} />
        </div>

        <div className="flex justify-end border-t border-slate-100 p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}

export default OrdersFromVendor;
