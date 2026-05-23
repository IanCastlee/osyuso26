import React, { useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiUser,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import { FaUsers } from "react-icons/fa";

import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";
import { useToast } from "../../context/ToastContext";
import AdminTable from "./AdminTable";

const ASSET_BASE_URL = "http://localhost/OSYUSO26/backend/";

const messageTemplates = {
  banned: [
    {
      key: "policy",
      label: "Policy violation",
      message:
        "Your customer account has been restricted due to activity that does not comply with OSYUSO platform policies.",
    },
    {
      key: "security",
      label: "Security review",
      message:
        "Your customer account has been temporarily restricted while our team reviews account security concerns.",
    },
    {
      key: "custom",
      label: "Custom message",
      message: "",
    },
  ],
  active: [
    {
      key: "reviewed",
      label: "Review completed",
      message:
        "Your customer account has been reviewed and reactivated. You may now continue using OSYUSO.",
    },
    {
      key: "appeal",
      label: "Appeal accepted",
      message:
        "Your account appeal has been reviewed and accepted. Your OSYUSO customer account is now active again.",
    },
    {
      key: "custom",
      label: "Custom message",
      message: "",
    },
  ],
};

function CustomerDirectory({ type, title, description }) {
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [cursor, setCursor] = useState(null);
  const [history, setHistory] = useState([]);
  const [confirmAction, setConfirmAction] = useState({
    open: false,
    row: null,
    status: "",
    messageTemplate: "",
    message: "",
  });

  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.append("type", type);
    q.append("limit", String(limit));
    if (search.trim()) q.append("search", search.trim());
    if (cursor) q.append("cursor", cursor);
    return q.toString();
  }, [type, limit, search, cursor]);

  const { data, loading, error, refetch } = useGetData(
    `admin/get-customers.php?${query}`,
  );

  console.log("DATA : ", data);

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

  const { submit: updateCustomerStatus, loading: updating } = useFormSubmit(
    "admin/update-customer-status.php",
    () => {
      showToast({
        type: "success",
        message: "Customer status updated",
        duration: 3000,
      });
      closeConfirm();
      refetch();
    },
  );

  const currentTemplates = messageTemplates[confirmAction.status] || [];
  const messageIsInvalid = confirmAction.message.trim().length < 8;

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

  const fileUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return ASSET_BASE_URL + path.replace(/^(\.\.\/|\/)+/, "");
  };

  const getStatusClass = (status) => {
    if (status === "active") return "bg-emerald-50 text-emerald-700";
    if (status === "inactive") return "bg-amber-50 text-amber-700";
    return "bg-red-50 text-red-700";
  };

  const resetPaging = () => {
    setCursor(null);
    setHistory([]);
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

  const askStatus = (row, status) => {
    const templates = messageTemplates[status] || [];
    const firstTemplate = templates[0] || { key: "", message: "" };

    setConfirmAction({
      open: true,
      row,
      status,
      messageTemplate: firstTemplate.key,
      message: firstTemplate.message,
    });
  };

  const closeConfirm = () => {
    setConfirmAction({
      open: false,
      row: null,
      status: "",
      messageTemplate: "",
      message: "",
    });
  };

  const handleTemplateChange = (key) => {
    const selected = currentTemplates.find((item) => item.key === key);

    setConfirmAction((prev) => ({
      ...prev,
      messageTemplate: key,
      message: selected?.message || "",
    }));
  };

  const confirmSubmit = () => {
    if (messageIsInvalid) return;

    updateCustomerStatus({
      customer_id: confirmAction.row?.user_id,
      status: confirmAction.status,
      message: confirmAction.message.trim(),
      message_template: confirmAction.messageTemplate,
    });
  };

  const columns = [
    {
      header: "Customer",
      render: (row) => (
        <div className="flex min-w-[240px] items-center gap-3">
          {row.profile_picture ? (
            <img
              src={fileUrl(row.profile_picture)}
              alt={row.fullname || "Customer"}
              className="h-10 w-10 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <FiUser />
            </span>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {row.fullname || "Customer"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {row.email || "No email"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Address",
      render: (row) => (
        <div className="min-w-[220px]">
          <p className="line-clamp-1 text-sm text-slate-700">
            {row.address || "No address"}
          </p>
          <p className="line-clamp-1 text-xs text-slate-500">
            {row.nearby || "No nearby landmark"}
          </p>
        </div>
      ),
    },
    {
      header: "Verification",
      render: (row) => {
        const verified = Number(row.email_verified || 0) === 1;

        return (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              verified
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {verified ? "Verified" : "Unverified"}
          </span>
        );
      },
    },
    {
      header: "Status",
      render: (row) => {
        const status = row.status || "active";

        return (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
              status,
            )}`}
          >
            {status}
          </span>
        );
      },
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
      render: (row) => {
        const status = row.status || "active";
        const isBanned = status === "banned";

        return (
          <div className="flex justify-end gap-2">
            {isBanned ? (
              <button
                onClick={() => askStatus(row, "active")}
                disabled={updating}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                title="Unban customer"
              >
                <FiCheckCircle className="text-lg" />
              </button>
            ) : (
              <button
                onClick={() => askStatus(row, "banned")}
                disabled={updating}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                title="Ban customer"
              >
                <FiXCircle className="text-lg" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const isUnban = confirmAction.status === "active";
  const confirmTitle = isUnban ? "Unban Customer?" : "Ban Customer?";
  const confirmText = isUnban ? "Unban Customer" : "Ban Customer";

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-secondary">
              <FaUsers className="text-xl" />
            </span>

            <div>
              <h1 className="text-xl font-bold text-slate-950">{title}</h1>
              <p className="mt-1 text-sm text-slate-500">{description}</p>
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
                Customers
              </p>
              <p className="mt-2 text-xl font-bold text-slate-950">
                {summary.total_customers || 0}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase text-emerald-500">
                Verified
              </p>
              <p className="mt-2 text-xl font-bold text-emerald-700">
                {summary.verified_customers || 0}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase text-amber-500">
                Unverified
              </p>
              <p className="mt-2 text-xl font-bold text-amber-700">
                {summary.unverified_customers || 0}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase text-red-400">
                Banned
              </p>
              <p className="mt-2 text-xl font-bold text-red-700">
                {summary.banned_customers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-slate-100 p-5 md:grid-cols-[1fr_160px_120px]">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Search
              </label>

              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search customer name, email, or address..."
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

          <div className="overflow-x-auto p-4">
            <AdminTable columns={columns} data={rows} loading={loading} />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">Page {history.length + 1}</p>

            <div className="flex justify-end gap-2">
              <button
                onClick={handlePrev}
                disabled={!canGoPrev}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <FiChevronLeft />
                Prev
              </button>

              <button
                onClick={handleNext}
                disabled={!canGoNext}
                className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
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
                <FiX className="text-lg" />
              </button>
            </div>

            <div className="px-5 py-4">
              <p className="text-sm leading-6 text-slate-600">
                This message will be sent to{" "}
                <span className="font-semibold">
                  {confirmAction.row?.fullname || "this customer"}
                </span>{" "}
                by email and notification.
              </p>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Ready-made message
                </label>

                <select
                  value={confirmAction.messageTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-secondary focus:bg-white"
                >
                  {currentTemplates.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Customer Message
                </label>

                <textarea
                  value={confirmAction.message}
                  onChange={(e) =>
                    setConfirmAction((prev) => ({
                      ...prev,
                      message: e.target.value,
                      messageTemplate: "custom",
                    }))
                  }
                  rows={5}
                  placeholder="Write a clear message for the customer..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none focus:border-secondary focus:bg-white"
                />

                {messageIsInvalid && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    Please provide a clear message with at least 8 characters.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                onClick={closeConfirm}
                disabled={updating}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmSubmit}
                disabled={updating || messageIsInvalid}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                  isUnban
                    ? "bg-secondary hover:opacity-90"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {updating ? "Processing..." : confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerDirectory;
