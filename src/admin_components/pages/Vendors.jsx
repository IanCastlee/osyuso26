import React, { useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiSearch,
  FiSlash,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import { FaStore } from "react-icons/fa";

import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";
import { useToast } from "../../context/ToastContext";
import AdminTable from "../organisms/AdminTable";

const ASSET_BASE_URL = "http://localhost/OSYUSO26/backend/";

const reasonTemplates = {
  permit_rejected: [
    {
      key: "invalid_document",
      label: "Invalid document",
      reason:
        "The submitted business permit could not be approved because the document appears invalid, incomplete, or unreadable.",
    },
    {
      key: "details_mismatch",
      label: "Details mismatch",
      reason:
        "The submitted permit details do not match the vendor or shop information provided in the application.",
    },
    {
      key: "expired_permit",
      label: "Expired permit",
      reason:
        "The submitted business permit appears to be expired. Please upload a valid and updated permit.",
    },
    {
      key: "custom",
      label: "Custom reason",
      reason: "",
    },
  ],
  shop_banned: [
    {
      key: "policy_violation",
      label: "Policy violation",
      reason:
        "Your shop has been banned due to activity that violates OSYUSO platform policies.",
    },
    {
      key: "prohibited_items",
      label: "Prohibited items",
      reason:
        "Your shop has been banned because it listed or attempted to sell items that are not allowed on OSYUSO.",
    },
    {
      key: "fraudulent_activity",
      label: "Fraudulent activity",
      reason:
        "Your shop has been banned due to suspicious or fraudulent activity detected during review.",
    },
    {
      key: "custom",
      label: "Custom reason",
      reason: "",
    },
  ],
  shop_unban: [
    {
      key: "appeal_approved",
      label: "Appeal approved",
      reason:
        "Your shop has been reinstated after review. The issue has been resolved and your shop may now operate again on OSYUSO.",
    },
    {
      key: "mistaken_action",
      label: "Mistaken action",
      reason:
        "Your shop has been reinstated after further review. The previous restriction was applied in error.",
    },
    {
      key: "compliance_resolved",
      label: "Compliance resolved",
      reason:
        "Your shop has been reinstated after completing the required compliance steps.",
    },
    {
      key: "custom",
      label: "Custom reason",
      reason: "",
    },
  ],
  shop_inactive: [
    {
      key: "temporary_review",
      label: "Temporary review",
      reason:
        "Your shop has been temporarily set as inactive while OSYUSO reviews account or shop information.",
    },
    {
      key: "incomplete_details",
      label: "Incomplete details",
      reason:
        "Your shop has been temporarily set as inactive because some shop details require correction or completion.",
    },
    {
      key: "custom",
      label: "Custom reason",
      reason: "",
    },
  ],
  shop_active: [
    {
      key: "approved_to_operate",
      label: "Approved to operate",
      reason: "Your shop has been activated and may now operate on OSYUSO.",
    },
    {
      key: "review_completed",
      label: "Review completed",
      reason:
        "Your shop review has been completed and your shop is now active.",
    },
    {
      key: "custom",
      label: "Custom reason",
      reason: "",
    },
  ],
  permit_approved: [
    {
      key: "application_approved",
      label: "Application approved",
      reason:
        "Your vendor application has been approved. Your shop is now active on OSYUSO.",
    },
    {
      key: "permit_verified",
      label: "Permit verified",
      reason:
        "Your business permit has been verified and your vendor account is approved.",
    },
    {
      key: "custom",
      label: "Custom note",
      reason: "",
    },
  ],
};

function Vendors() {
  const { showToast } = useToast();

  const [view, setView] = useState("vendors");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [cursor, setCursor] = useState(null);
  const [history, setHistory] = useState([]);

  const [confirmAction, setConfirmAction] = useState({
    open: false,
    type: "",
    row: null,
    status: "",
    reasonTemplate: "",
    reason: "",
  });

  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.append("view", view);
    q.append("limit", String(limit));

    if (search.trim()) q.append("search", search.trim());
    if (cursor) q.append("cursor", cursor);

    return q.toString();
  }, [view, limit, search, cursor]);

  const { data, loading, error, refetch } = useGetData(
    `admin/get-vendors.php?${query}`,
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

  const { submit: updateShopStatus, loading: updatingShop } = useFormSubmit(
    "admin/update-shop-status.php",
    () => {
      showToast({
        type: "success",
        message: "Shop status updated",
        duration: 3000,
      });
      closeConfirm();
      refetch();
    },
  );

  const { submit: updatePermitStatus, loading: updatingPermit } = useFormSubmit(
    "admin/update-permit-status.php",
    () => {
      showToast({
        type: "success",
        message: "Vendor request updated",
        duration: 3000,
      });
      closeConfirm();
      refetch();
    },
  );

  const isUpdating = updatingShop || updatingPermit;

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
    if (!path) return "#";
    if (path.startsWith("http")) return path;
    return ASSET_BASE_URL + path.replace(/^(\.\.\/|\/)+/, "");
  };

  const getStatusClass = (status) => {
    if (status === "active" || status === "approved") {
      return "bg-emerald-50 text-emerald-700";
    }

    if (status === "inactive" || status === "pending") {
      return "bg-amber-50 text-amber-700";
    }

    return "bg-red-50 text-red-700";
  };

  const resetPaging = () => {
    setCursor(null);
    setHistory([]);
  };

  const handleViewChange = (nextView) => {
    setView(nextView);
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

  const getReasonType = (type, status, row) => {
    if (type === "permit") {
      return status === "approved" ? "permit_approved" : "permit_rejected";
    }

    if (status === "banned") return "shop_banned";
    if (status === "inactive") return "shop_inactive";

    if (status === "active" && row?.shop_status === "banned") {
      return "shop_unban";
    }

    return "shop_active";
  };

  const getDefaultTemplate = (type, status, row) => {
    const reasonType = getReasonType(type, status, row);
    return (
      reasonTemplates[reasonType]?.[0] || {
        key: "",
        reason: "",
      }
    );
  };

  const askShopStatus = (row, status) => {
    const template = getDefaultTemplate("shop", status, row);

    setConfirmAction({
      open: true,
      type: "shop",
      row,
      status,
      reasonTemplate: template.key,
      reason: template.reason,
    });
  };

  const askPermitStatus = (row, status) => {
    const template = getDefaultTemplate("permit", status, row);

    setConfirmAction({
      open: true,
      type: "permit",
      row,
      status,
      reasonTemplate: template.key,
      reason: template.reason,
    });
  };

  const closeConfirm = () => {
    setConfirmAction({
      open: false,
      type: "",
      row: null,
      status: "",
      reasonTemplate: "",
      reason: "",
    });
  };

  const isUnbanAction =
    confirmAction.type === "shop" &&
    confirmAction.status === "active" &&
    confirmAction.row?.shop_status === "banned";

  const reasonType = getReasonType(
    confirmAction.type,
    confirmAction.status,
    confirmAction.row,
  );

  const currentReasonTemplates = reasonTemplates[reasonType] || [];

  const requiresReason =
    (confirmAction.type === "shop" &&
      (confirmAction.status === "banned" || isUnbanAction)) ||
    (confirmAction.type === "permit" && confirmAction.status === "rejected");

  const reasonIsInvalid =
    requiresReason && confirmAction.reason.trim().length < 8;

  const updateReason = (value) => {
    setConfirmAction((prev) => ({
      ...prev,
      reason: value,
      reasonTemplate: "custom",
    }));
  };

  const handleReasonTemplateChange = (value) => {
    const selected = currentReasonTemplates.find((item) => item.key === value);

    setConfirmAction((prev) => ({
      ...prev,
      reasonTemplate: value,
      reason: selected?.reason || "",
    }));
  };

  const confirmSubmit = () => {
    if (reasonIsInvalid) return;

    if (confirmAction.type === "shop") {
      updateShopStatus({
        shop_id: confirmAction.row?.shop_id,
        status: confirmAction.status,
        reason: confirmAction.reason.trim(),
        reason_template: confirmAction.reasonTemplate,
      });
      return;
    }

    if (confirmAction.type === "permit") {
      updatePermitStatus({
        permit_id: confirmAction.row?.permit_id,
        status: confirmAction.status,
        reason: confirmAction.reason.trim(),
        reason_template: confirmAction.reasonTemplate,
      });
    }
  };

  const vendorColumns = [
    {
      header: "Vendor",
      render: (row) => (
        <div className="min-w-[220px]">
          <p className="text-sm font-semibold text-slate-900">
            {row.fullname || "Vendor"}
          </p>
          <p className="truncate text-xs text-slate-500">
            {row.email || "No email"}
          </p>
        </div>
      ),
    },
    {
      header: "Shop",
      render: (row) => (
        <div className="min-w-[240px]">
          <p className="text-sm font-semibold text-slate-900">
            {row.shop_name || "No shop"}
          </p>
          <p className="line-clamp-1 text-xs text-slate-500">
            {row.shop_address || row.address || "No address"}
          </p>
        </div>
      ),
    },
    {
      header: "Permit",
      render: (row) => (
        <div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
              row.permit_status || "pending",
            )}`}
          >
            {row.permit_status || "No permit"}
          </span>
          {row.permit_number && (
            <p className="mt-1 text-xs text-slate-500">{row.permit_number}</p>
          )}
        </div>
      ),
    },
    {
      header: "Shop Status",
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
            row.shop_status || "inactive",
          )}`}
        >
          {row.shop_status || "inactive"}
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
          {row.shop_status !== "active" && (
            <button
              onClick={() => askShopStatus(row, "active")}
              disabled={updatingShop}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
              title={
                row.shop_status === "banned"
                  ? "Unban and activate shop"
                  : "Activate shop"
              }
            >
              <FiCheckCircle className="text-lg" />
            </button>
          )}

          {row.shop_status === "active" && (
            <button
              onClick={() => askShopStatus(row, "inactive")}
              disabled={updatingShop}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
              title="Set shop inactive"
            >
              <FiSlash className="text-lg" />
            </button>
          )}

          {row.shop_status !== "banned" && (
            <button
              onClick={() => askShopStatus(row, "banned")}
              disabled={updatingShop}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              title="Ban shop"
            >
              <FiXCircle className="text-lg" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const requestColumns = [
    {
      header: "Vendor",
      render: (row) => (
        <div className="min-w-[220px]">
          <p className="text-sm font-semibold text-slate-900">
            {row.fullname || "Vendor"}
          </p>
          <p className="truncate text-xs text-slate-500">
            {row.email || "No email"}
          </p>
        </div>
      ),
    },
    {
      header: "Shop",
      render: (row) => (
        <div className="min-w-[220px]">
          <p className="text-sm font-semibold text-slate-900">
            {row.shop_name || "No shop"}
          </p>
          <p className="line-clamp-1 text-xs text-slate-500">
            {row.shop_address || "No address"}
          </p>
        </div>
      ),
    },
    {
      header: "Permit No.",
      render: (row) => (
        <span className="text-sm font-semibold text-slate-900">
          {row.permit_number || "N/A"}
        </span>
      ),
    },
    {
      header: "Permit",
      render: (row) =>
        row.permit_image ? (
          <a
            href={fileUrl(row.permit_image)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            <FiEye />
            View
          </a>
        ) : (
          <span className="text-sm text-slate-400">No image</span>
        ),
    },
    {
      header: "Uploaded",
      render: (row) => (
        <span className="text-sm text-slate-500">
          {formatDate(row.uploaded_at)}
        </span>
      ),
    },
    {
      header: "Action",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => askPermitStatus(row, "approved")}
            disabled={updatingPermit}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
            title="Approve request"
          >
            <FiCheckCircle className="text-lg" />
          </button>

          <button
            onClick={() => askPermitStatus(row, "rejected")}
            disabled={updatingPermit}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            title="Reject request"
          >
            <FiXCircle className="text-lg" />
          </button>
        </div>
      ),
    },
  ];

  const columns = view === "requests" ? requestColumns : vendorColumns;

  const confirmTitle =
    confirmAction.type === "permit"
      ? confirmAction.status === "approved"
        ? "Approve Vendor Application?"
        : "Reject Vendor Application?"
      : confirmAction.status === "active"
        ? isUnbanAction
          ? "Unban and Activate Shop?"
          : "Activate Shop?"
        : confirmAction.status === "inactive"
          ? "Set Shop as Inactive?"
          : "Ban Shop?";

  const confirmMessage =
    confirmAction.type === "permit"
      ? confirmAction.status === "approved"
        ? `This will approve ${
            confirmAction.row?.fullname || "this vendor"
          }'s business permit and activate their shop.`
        : `This will reject ${
            confirmAction.row?.fullname || "this vendor"
          }'s business permit. A clear reason will be sent to the vendor.`
      : confirmAction.status === "active"
        ? isUnbanAction
          ? `This will unban ${
              confirmAction.row?.shop_name || "this shop"
            } and allow it to operate on the platform again. A clear reason will be sent to the vendor.`
          : `This will activate ${
              confirmAction.row?.shop_name || "this shop"
            } and allow it to operate on the platform.`
        : confirmAction.status === "inactive"
          ? `This will temporarily set ${
              confirmAction.row?.shop_name || "this shop"
            } as inactive.`
          : `This will ban ${
              confirmAction.row?.shop_name || "this shop"
            }. A clear reason will be sent to the vendor.`;

  const confirmText =
    confirmAction.status === "approved"
      ? "Confirm"
      : confirmAction.status === "active"
        ? isUnbanAction
          ? "Unban Shop"
          : "Confirm"
        : confirmAction.status === "inactive"
          ? "Set Inactive"
          : confirmAction.status === "banned"
            ? "Ban Shop"
            : "Reject";

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-secondary">
                <FaStore className="text-xl" />
              </span>

              <div>
                <h1 className="text-xl font-bold text-slate-950">Vendors</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Manage vendor shops and business permit approvals.
                </p>
              </div>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
              <button
                onClick={() => handleViewChange("vendors")}
                className={`rounded-lg px-4 py-2 transition ${
                  view === "vendors"
                    ? "bg-white text-secondary shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Vendors
              </button>

              <button
                onClick={() => handleViewChange("requests")}
                className={`rounded-lg px-4 py-2 transition ${
                  view === "requests"
                    ? "bg-white text-secondary shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Requests
              </button>
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
                Vendors
              </p>
              <p className="mt-2 text-xl font-bold text-slate-950">
                {summary.total_vendors || 0}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase text-emerald-500">
                Active Shops
              </p>
              <p className="mt-2 text-xl font-bold text-emerald-700">
                {summary.active_shops || 0}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase text-amber-500">
                Pending Requests
              </p>
              <p className="mt-2 text-xl font-bold text-amber-700">
                {summary.pending_permits || 0}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase text-red-400">
                Banned Shops
              </p>
              <p className="mt-2 text-xl font-bold text-red-700">
                {summary.banned_shops || 0}
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
                  placeholder="Search vendor, shop, email, or permit..."
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
                disabled={isUpdating}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <div className="px-5 py-4">
              <p className="text-sm leading-6 text-slate-600">
                {confirmMessage}
              </p>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Ready-made reason
                </label>

                <select
                  value={confirmAction.reasonTemplate}
                  onChange={(e) => handleReasonTemplateChange(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-secondary focus:bg-white"
                >
                  {currentReasonTemplates.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Reason {requiresReason ? "" : "(Optional)"}
                </label>

                <textarea
                  value={confirmAction.reason}
                  onChange={(e) => updateReason(e.target.value)}
                  rows={4}
                  placeholder={
                    requiresReason
                      ? "Write a clear reason that will be sent to the vendor..."
                      : "Add an optional note for this action..."
                  }
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-secondary focus:bg-white"
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
                disabled={isUpdating}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmSubmit}
                disabled={isUpdating || reasonIsInvalid}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  confirmAction.status === "banned" ||
                  confirmAction.status === "rejected"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-secondary hover:opacity-90"
                }`}
              >
                {isUpdating ? "Processing..." : confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vendors;
