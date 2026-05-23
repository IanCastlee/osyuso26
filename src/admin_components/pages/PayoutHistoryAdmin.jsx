import React, { useMemo, useState } from "react";
import { FaMoneyBillWave } from "react-icons/fa";
import { FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";

import useGetData from "../../hooks/useGetData";
import AdminTable from "../organisms/AdminTable";

function PayoutHistoryAdmin() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("paid");
  const [limit, setLimit] = useState(10);
  const [cursor, setCursor] = useState(null);
  const [history, setHistory] = useState([]);

  const query = useMemo(() => {
    const q = new URLSearchParams();

    q.append("limit", String(limit));
    q.append("status", status);

    if (search.trim()) q.append("search", search.trim());
    if (cursor) q.append("cursor", cursor);

    return q.toString();
  }, [limit, search, status, cursor]);

  const { data, loading, error } = useGetData(
    `payout/admin-get-payout-requests.php?${query}`,
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

  const hasMore = Boolean(payload.has_more);
  const nextCursor = payload.next_cursor || null;
  const canGoNext = Boolean(hasMore && nextCursor);
  const canGoPrev = history.length > 0;

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

  const getStatusClass = (value) => {
    if (value === "paid") return "bg-emerald-50 text-emerald-700";
    if (value === "failed" || value === "cancelled")
      return "bg-red-50 text-red-700";
    if (value === "processing") return "bg-blue-50 text-blue-700";
    return "bg-amber-50 text-amber-700";
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setCursor(null);
    setHistory([]);
  };

  const handleLimitChange = (value) => {
    setLimit(Number(value));
    setCursor(null);
    setHistory([]);
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    setCursor(null);
    setHistory([]);
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

  const columns = [
    {
      header: "Reference",
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {row.reference_no}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Requested {formatDate(row.requested_at || row.created_at)}
          </p>
        </div>
      ),
    },
    {
      header: "Vendor",
      render: (row) => (
        <div className="min-w-[180px]">
          <p className="truncate text-sm font-semibold text-slate-900">
            {row.vendor_name || row.shop_name || "Vendor"}
          </p>
          <p className="truncate text-xs text-slate-500">
            {row.vendor_email || "No email"}
          </p>
        </div>
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
      header: "Platform Fee",
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
        const currentStatus = row.status || "paid";

        return (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
              currentStatus,
            )}`}
          >
            {currentStatus}
          </span>
        );
      },
    },
    {
      header: "Paid Date",
      render: (row) => (
        <span className="text-sm text-slate-500">
          {formatDate(row.paid_at || row.processed_at || row.created_at)}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-secondary">
              <FaMoneyBillWave className="text-xl" />
            </span>

            <div>
              <h1 className="text-xl font-bold text-slate-950">
                Payout History
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                View released, failed, and cancelled vendor payouts.
              </p>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-4">
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase text-emerald-500">
                Paid Records
              </p>
              <p className="mt-2 text-xl font-bold text-emerald-700">
                {status === "paid"
                  ? payoutRows.length
                  : summary.paid_count || 0}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Gross Sales
              </p>
              <p className="mt-2 text-xl font-bold text-slate-950">
                {formatMoney(
                  payoutRows.reduce(
                    (total, row) => total + Number(row.gross_amount || 0),
                    0,
                  ),
                )}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase text-red-400">
                Platform Fees
              </p>
              <p className="mt-2 text-xl font-bold text-red-700">
                {formatMoney(
                  payoutRows.reduce(
                    (total, row) => total + Number(row.commission_amount || 0),
                    0,
                  ),
                )}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase text-emerald-500">
                Net Released
              </p>
              <p className="mt-2 text-xl font-bold text-emerald-700">
                {formatMoney(
                  payoutRows.reduce(
                    (total, row) => total + Number(row.net_amount || 0),
                    0,
                  ),
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-slate-100 p-5 md:grid-cols-[1fr_170px_160px_120px]">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Search
              </label>

              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search reference, vendor, or email..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-secondary focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Status
              </label>

              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-secondary focus:bg-white"
              >
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="all">All</option>
              </select>
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
            <AdminTable columns={columns} data={payoutRows} loading={loading} />
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

export default PayoutHistoryAdmin;
