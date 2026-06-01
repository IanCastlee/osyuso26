import React, { useMemo, useState } from "react";
import { FaMoneyBillWave } from "react-icons/fa";
import { FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";

import VendorTable from "../organisms/VendorTable";
import useFormSubmit from "../../hooks/useFormSubmit";
import { useToast } from "../../context/ToastContext";
import ConfirmationModal from "../../reusable_components/ConfirmationModal";
import useGetData from "../../hooks/useGetData";

function VendorPayout() {
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [cursor, setCursor] = useState(null);
  const [history, setHistory] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const query = useMemo(() => {
    const q = new URLSearchParams();

    q.append("limit", String(limit));
    if (search.trim()) q.append("search", search.trim());
    if (cursor) q.append("cursor", cursor);

    return q.toString();
  }, [limit, search, cursor]);

  const { data, loading, error, refetch } = useGetData(
    `payout/get-vendor-payout.php?${query}`,
  );

  const payload = useMemo(() => {
    return (
      data || {
        summary: {},
        rows: [],
        has_more: false,
        next_cursor: null,
      }
    );
  }, [data]);

  const summary = payload.summary || {};
  const payoutRows = payload.rows || [];

  const hasMore = Boolean(payload?.has_more);
  const nextCursor = payload?.next_cursor || null;
  const canGoNext = Boolean(hasMore && nextCursor);
  const canGoPrev = history.length > 0;

  const { submit: requestPayout, loading: requesting } = useFormSubmit(
    "payout/request-vendor-payout.php",
    () => {
      showToast({
        type: "success",
        message: "Payout request submitted",
        duration: 3000,
      });

      setConfirmOpen(false);
      refetch();
    },
  );

  const formatMoney = (value) => {
    return `₱${Number(value || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
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

  const handleLimitChange = (value) => {
    setLimit(Number(value));
    setCursor(null);
    setHistory([]);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setCursor(null);
    setHistory([]);
  };

  const canRequest =
    Boolean(summary.can_request_payout) &&
    Number(summary.available_net_amount || 0) > 0 &&
    !summary.has_pending_payout;

  const formatPayoutTime = (value) => {
    if (!value) return "";

    const [hour = "0", minute = "00"] = String(value).split(":");
    const date = new Date();

    date.setHours(Number(hour), Number(minute), 0, 0);

    return date.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const columns = [
    {
      header: "Reference",
      render: (row) => (
        <span className="text-sm font-semibold text-slate-900">
          {row.reference_no}
        </span>
      ),
    },
    {
      header: "Gross",
      render: (row) => (
        <span className="text-sm font-semibold text-slate-900">
          {formatMoney(row.gross_amount)}
        </span>
      ),
    },
    {
      header: "Fee",
      render: (row) => (
        <span className="text-sm font-semibold text-red-600">
          -{formatMoney(row.commission_amount)}
        </span>
      ),
    },
    {
      header: "Net Payout",
      render: (row) => (
        <span className="text-sm font-semibold text-emerald-700">
          {formatMoney(row.net_amount)}
        </span>
      ),
    },
    {
      header: "Items",
      render: (row) => (
        <span className="text-sm text-slate-600">{row.items_count || 0}</span>
      ),
    },
    {
      header: "Status",
      render: (row) => {
        const status = row.status || "pending";

        const statusClass =
          status === "paid"
            ? "bg-emerald-50 text-emerald-700"
            : status === "failed" || status === "cancelled"
              ? "bg-red-50 text-red-700"
              : status === "processing"
                ? "bg-blue-50 text-blue-700"
                : "bg-amber-50 text-amber-700";

        return (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      header: "Requested",
      render: (row) => (
        <span className="text-sm text-slate-500">
          {formatDate(row.requested_at || row.created_at)}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-secondary">
                <FaMoneyBillWave className="text-xl" />
              </span>

              <div>
                <h1 className="text-xl font-bold text-slate-950">
                  Vendor Payout
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Weekly payout is available every{" "}
                  {summary?.payout_release_day_name || "scheduled day"}
                  {summary?.payout_release_time
                    ? ` at ${formatPayoutTime(summary.payout_release_time)}`
                    : ""}
                  .
                </p>
              </div>
            </div>

            <button
              onClick={() => setConfirmOpen(true)}
              disabled={!canRequest || requesting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-secondary px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Request Payout
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Gross Sales
              </p>
              <p className="mt-2 text-xl font-bold text-slate-950">
                {formatMoney(summary.available_gross_amount)}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase text-red-400">
                Platform Fee 10%
              </p>
              <p className="mt-2 text-xl font-bold text-red-700">
                -{formatMoney(summary.available_commission_amount)}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase text-emerald-500">
                Net Payout
              </p>
              <p className="mt-2 text-xl font-bold text-emerald-700">
                {formatMoney(summary.available_net_amount)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Next Payout
              </p>
              <p className="mt-2 text-xl font-bold text-slate-950">
                {formatDate(summary.next_payout_date)}
              </p>
            </div>
          </div>

          {summary.has_pending_payout && (
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
              You already have a pending or processing payout.
            </p>
          )}

          {!summary.can_request_payout && (
            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              Payout requests are only available every Sunday.
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-slate-100 p-5 md:grid-cols-[1fr_160px_120px]">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Search Reference
              </label>

              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search payout reference..."
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
                {payoutRows.length}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto p-4">
            <VendorTable
              columns={columns}
              data={payoutRows}
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
        open={confirmOpen}
        title="Request payout?"
        message={`You will receive ${formatMoney(
          summary.available_net_amount,
        )} after 10% platform fee.`}
        confirmText="Request Payout"
        cancelText="Cancel"
        loading={requesting}
        onConfirm={() => requestPayout({})}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

export default VendorPayout;
