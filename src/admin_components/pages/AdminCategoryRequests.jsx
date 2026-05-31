import React, { useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import AdminTable from "../organisms/AdminTable";
import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";
import { useToast } from "../../context/ToastContext";

function AdminCategoryRequests() {
  const { showToast } = useToast();

  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [reviewTarget, setReviewTarget] = useState(null);
  const [adminNote, setAdminNote] = useState("");

  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.append("status", status);
    return q.toString();
  }, [status]);

  const { data, loading, refetch } = useGetData(
    `admin/get-category-requests.php?${query}`,
  );

  const { submit: reviewSubmit, loading: reviewing } = useFormSubmit(
    "admin/review-category-request.php",
  );

  const requests = useMemo(() => {
    const payload = data?.data || data || {};
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.requests)) return payload.requests;
    if (Array.isArray(payload.rows)) return payload.rows;
    return [];
  }, [data]);

  const filteredRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return requests;

    return requests.filter(
      (item) =>
        item.category_name?.toLowerCase().includes(keyword) ||
        item.subcategory_name?.toLowerCase().includes(keyword) ||
        item.vendor_name?.toLowerCase().includes(keyword) ||
        item.vendor_email?.toLowerCase().includes(keyword),
    );
  }, [requests, search]);

  const openReview = (row, action) => {
    setReviewTarget({ ...row, action });
    setAdminNote("");
  };

  const closeReview = () => {
    setReviewTarget(null);
    setAdminNote("");
  };

  const submitReview = async () => {
    if (!reviewTarget) return;

    try {
      await reviewSubmit({
        id: reviewTarget.id,
        action: reviewTarget.action,
        admin_note: adminNote.trim(),
      });

      showToast({
        type: "success",
        message:
          reviewTarget.action === "approved"
            ? "Request approved."
            : "Request rejected.",
        duration: 3000,
      });

      closeReview();
      refetch();
    } catch (err) {
      showToast({
        type: "error",
        message: err?.message || "Failed to review request.",
        duration: 4000,
      });
    }
  };

  const columns = [
    {
      header: "Vendor",
      render: (row) => (
        <div>
          <p className="text-sm font-bold text-slate-950">
            {row.vendor_name || "Vendor"}
          </p>
          <p className="text-xs text-slate-500">{row.vendor_email || "-"}</p>
        </div>
      ),
    },
    {
      header: "Request",
      render: (row) => (
        <div className="min-w-[220px]">
          <p className="text-sm font-bold text-slate-950">
            {row.category_name}
          </p>
          <p className="text-xs text-slate-500">
            Subcategory: {row.subcategory_name}
          </p>
        </div>
      ),
    },
    {
      header: "Reason",
      render: (row) => (
        <p className="line-clamp-2 min-w-[220px] text-xs text-slate-500">
          {row.reason || "-"}
        </p>
      ),
    },
    {
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Created",
      render: (row) => (
        <span className="text-xs text-slate-500">{row.created_at || "-"}</span>
      ),
    },
    {
      header: "Action",
      align: "right",
      render: (row) => {
        if (row.status !== "pending") {
          return (
            <span className="text-xs font-semibold text-slate-400">
              Reviewed
            </span>
          );
        }

        return (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => openReview(row, "approved")}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
            >
              <FiCheckCircle />
              Approve
            </button>

            <button
              type="button"
              onClick={() => openReview(row, "rejected")}
              className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
            >
              <FiXCircle />
              Reject
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="min-h-full bg-slate-50 p-4 sm:p-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-secondary">
                  <FiClock className="text-xl" />
                </span>

                <div>
                  <h1 className="text-xl font-bold text-slate-950">
                    Category Requests
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Review vendor requests for new categories and subcategories.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={refetch}
                disabled={loading}
                className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <FiRefreshCw className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-2 overflow-x-auto">
                {["pending", "approved", "rejected", "all"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setStatus(item)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold capitalize transition ${
                      status === item
                        ? "bg-secondary text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-secondary"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="relative w-full lg:w-72">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search requests..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-secondary focus:bg-white"
                />
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto p-4">
              <AdminTable
                columns={columns}
                data={filteredRequests}
                loading={loading}
              />
            </div>
          </section>
        </div>
      </div>

      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {reviewTarget.action === "approved"
                    ? "Approve Request"
                    : "Reject Request"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {reviewTarget.category_name} / {reviewTarget.subcategory_name}
                </p>
              </div>

              <button
                type="button"
                onClick={closeReview}
                className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500"
              >
                <FiX />
              </button>
            </div>

            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Admin Note
            </label>

            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={4}
              placeholder={
                reviewTarget.action === "approved"
                  ? "Optional message for vendor..."
                  : "Tell the vendor why it was rejected..."
              }
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-secondary focus:bg-white"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeReview}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={reviewing}
                onClick={submitReview}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50 ${
                  reviewTarget.action === "approved"
                    ? "bg-emerald-600"
                    : "bg-red-600"
                }`}
              >
                {reviewing ? (
                  <FiRefreshCw className="animate-spin" />
                ) : reviewTarget.action === "approved" ? (
                  <FiCheckCircle />
                ) : (
                  <FiXCircle />
                )}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatusBadge({ status }) {
  const style =
    status === "approved"
      ? "bg-emerald-50 text-emerald-700"
      : status === "rejected"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${style}`}
    >
      {status}
    </span>
  );
}

export default AdminCategoryRequests;
