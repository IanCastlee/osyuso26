import React, { useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEye,
  FiSearch,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import { FaBullhorn } from "react-icons/fa";

import AdminTable from "../organisms/AdminTable";
import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";
import { useToast } from "../../context/ToastContext";

const ASSET_BASE_URL = "http://localhost/OSYUSO26/backend/";

const rejectionReasons = [
  "The submitted image does not meet OSYUSO promotion guidelines.",
  "The promotion title or description needs to be revised for clarity.",
  "The promotion content appears misleading or incomplete.",
];

function AdminPromotionApprovals() {
  const { showToast } = useToast();

  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [cursor, setCursor] = useState(null);
  const [history, setHistory] = useState([]);

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
    `admin/get-promotion-requests.php?${query}`,
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
    "admin/update-promotion-status.php",
    () => {
      showToast({
        type: "success",
        message: "Promotion updated successfully.",
        duration: 3000,
      });

      closeConfirm();
      refetch();
    },
  );

  const fileUrl = (path) => {
    if (!path) return "#";
    if (path.startsWith("http")) return path;
    return ASSET_BASE_URL + path.replace(/^(\.\.\/|\/)+/, "");
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

    return date.toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

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

  const requiresReason = confirmAction.status === "rejected";
  const reasonIsInvalid =
    requiresReason && confirmAction.reason.trim().length < 8;

  const submitAction = () => {
    if (reasonIsInvalid) return;

    updateStatus({
      promotion_id: confirmAction.row?.id,
      status: confirmAction.status,
      reason: confirmAction.reason.trim(),
    });
  };

  const getStatusClass = (value) => {
    if (value === "active" || value === "paid") {
      return "bg-emerald-50 text-emerald-700";
    }

    if (value === "pending" || value === "pending_payment") {
      return "bg-amber-50 text-amber-700";
    }

    return "bg-red-50 text-red-700";
  };

  const columns = [
    {
      header: "Promotion",
      render: (row) => (
        <div className="flex min-w-[280px] items-center gap-3">
          <img
            src={fileUrl(row.image_path)}
            alt={row.title}
            className="h-14 w-20 rounded-lg object-cover bg-slate-100"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          <div className="min-w-0">
            <p className="line-clamp-1 text-sm font-bold text-slate-950">
              {row.title}
            </p>
            <p className="line-clamp-1 text-xs text-slate-500">
              {row.description}
            </p>
            <p className="mt-1 text-xs font-semibold text-secondary">
              {row.tag || "Featured"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Vendor",
      render: (row) => (
        <div className="min-w-[190px]">
          <p className="text-sm font-semibold text-slate-900">
            {row.vendor_name || "Vendor"}
          </p>
          <p className="truncate text-xs text-slate-500">
            {row.vendor_email || "No email"}
          </p>
        </div>
      ),
    },
    {
      header: "Product",
      render: (row) => (
        <div className="min-w-[180px]">
          <p className="text-sm font-semibold text-slate-900">
            {row.product_name || "Product"}
          </p>
          <p className="text-xs text-slate-500">{row.shop_name || "Shop"}</p>
        </div>
      ),
    },
    {
      header: "Payment",
      render: (row) => (
        <div>
          <p className="text-sm font-bold text-slate-950">
            {formatPeso(row.total_price)}
          </p>
          <span
            className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusClass(
              row.payment_status,
            )}`}
          >
            {row.payment_status}
          </span>
        </div>
      ),
    },
    {
      header: "Schedule",
      render: (row) => (
        <div className="min-w-[180px] text-xs text-slate-500">
          <p>{formatDate(row.start_date)}</p>
          <p>{formatDate(row.expires_at)}</p>
          <p className="mt-1 font-semibold text-slate-700">
            {row.total_hours} hours
          </p>
        </div>
      ),
    },
    {
      header: "Status",
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
      header: "Action",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          {row.image_path && (
            <a
              href={fileUrl(row.image_path)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-700 transition hover:bg-slate-100"
              title="View image"
            >
              <FiEye />
            </a>
          )}

          {row.payment_status === "paid" && row.status !== "active" && (
            <button
              onClick={() => openConfirm(row, "active")}
              disabled={updating}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
              title="Approve promotion"
            >
              <FiCheckCircle />
            </button>
          )}

          {row.status !== "rejected" && row.status !== "active" && (
            <button
              onClick={() => openConfirm(row, "rejected")}
              disabled={updating}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              title="Reject promotion"
            >
              <FiXCircle />
            </button>
          )}
        </div>
      ),
    },
  ];

  const confirmTitle =
    confirmAction.status === "active"
      ? "Approve Promotion?"
      : "Reject Promotion?";

  const confirmMessage =
    confirmAction.status === "active"
      ? "This will make the paid promotion visible to customers. The promotion schedule will start from the approval time."
      : "This will reject the promotion request. The reason will be sent to the vendor.";

  const tabs = [
    { key: "pending", label: "Pending Review", count: summary.pending_review },
    { key: "active", label: "Active", count: summary.active_promotions },
    { key: "rejected", label: "Rejected", count: summary.rejected_promotions },
    { key: "pending_payment", label: "Unpaid", count: summary.pending_payment },
    { key: "all", label: "All", count: summary.total_promotions },
  ];

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-secondary">
                <FaBullhorn className="text-xl" />
              </span>

              <div>
                <h1 className="text-xl font-bold text-slate-950">
                  Promotion Approvals
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Review paid featured promotions before they appear to
                  customers.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-4">
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase text-amber-500">
                Pending Review
              </p>
              <p className="mt-2 text-xl font-bold text-amber-700">
                {summary.pending_review || 0}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase text-emerald-500">
                Active
              </p>
              <p className="mt-2 text-xl font-bold text-emerald-700">
                {summary.active_promotions || 0}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase text-red-500">
                Rejected
              </p>
              <p className="mt-2 text-xl font-bold text-red-700">
                {summary.rejected_promotions || 0}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Total
              </p>
              <p className="mt-2 text-xl font-bold text-slate-950">
                {summary.total_promotions || 0}
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
                    placeholder="Search title, product, vendor, or shop..."
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

              {confirmAction.status === "active" && (
                <div className="mt-4 rounded-xl bg-orange-50 p-4 text-sm text-orange-700">
                  <FiClock className="mb-2" />
                  The start date will be reset to now, and the vendor will get
                  the full paid promotion duration.
                </div>
              )}

              {confirmAction.status === "rejected" && (
                <div className="mt-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Ready Reasons
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {rejectionReasons.map((reason) => (
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
                      ? "Write a clear reason for rejecting this promotion..."
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
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  confirmAction.status === "rejected"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-secondary hover:opacity-90"
                }`}
              >
                {updating
                  ? "Processing..."
                  : confirmAction.status === "active"
                    ? "Approve"
                    : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPromotionApprovals;
