import React, { useEffect, useMemo, useState } from "react";
import { IoMdTrash } from "react-icons/io";
import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit,
  FiPlusCircle,
  FiSearch,
  FiRefreshCw,
  FiStar,
} from "react-icons/fi";

import VendorTable from "../organisms/VendorTable";
import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";
import noImage from "../../assets/assets_osyuso/no-image.png";
import AddFeaturedPromotion from "../molecules/AddFeaturedPromotion";
import { useToast } from "../../context/ToastContext";

function FeaturedPromotion() {
  const { showToast } = useToast();

  const emptyForm = {
    product_id: "",
    tag: "",
    title: "",
    description: "",
    start_date: "",
    expires_at: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState([]);
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});

  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [cursor, setCursor] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    return () => {
      preview.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [preview]);

  const { submit, loading: submitLoading } = useFormSubmit(
    "promotion/add-feature-promotion.php",
    () => {
      showToast({
        type: "success",
        message: "Promotion submitted to the admin. Please wait for approval.",
        duration: 5000,
      });

      preview.forEach((url) => URL.revokeObjectURL(url));
      setForm(emptyForm);
      setPreview([]);
      setImages([]);
      setErrors({});
    },
  );

  const query = useMemo(() => {
    const q = new URLSearchParams();

    q.append("limit", String(limit));
    if (search.trim()) q.append("search", search.trim());
    if (cursor) q.append("cursor", cursor);

    return q.toString();
  }, [limit, search, cursor]);

  const { data, loading, refetch } = useGetData(
    `promotion/get-featured-promotions_v.php?${query}`,
  );

  const promotions = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.rows)) return data.rows;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }, [data]);

  const nextCursor =
    data?.next_cursor || data?.data?.next_cursor || promotions.at(-1)?.id;

  const hasMore = Boolean(data?.has_more ?? data?.data?.has_more ?? nextCursor);

  useEffect(() => {
    setCursor(null);
    setHistory([]);
  }, [search, limit]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files || []);

    preview.forEach((url) => URL.revokeObjectURL(url));

    setImages(files);
    setPreview(files.map((file) => URL.createObjectURL(file)));

    setErrors((prev) => ({
      ...prev,
      image: "",
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.product_id) newErrors.product_id = "Product ID is required";
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!form.start_date) newErrors.start_date = "Start date is required";
    if (!form.expires_at) newErrors.expires_at = "Expiration date is required";

    if (form.start_date && form.expires_at) {
      const start = new Date(form.start_date);
      const end = new Date(form.expires_at);

      if (end <= start) {
        newErrors.expires_at = "Expiration must be greater than start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!navigator.onLine) {
      showToast({
        type: "error",
        message: "No internet connection. Please check your network.",
        duration: 5000,
      });
      return;
    }

    if (!validate()) return;

    const formData = new FormData();

    formData.append("product_id", form.product_id);
    formData.append("tag", form.tag);
    formData.append("title", form.title.trim());
    formData.append("description", form.description.trim());
    formData.append("start_date", form.start_date);
    formData.append("expires_at", form.expires_at);

    if (images[0]) {
      formData.append("image", images[0]);
    }

    try {
      await submit(formData);
    } catch (err) {
      showToast({
        type: "error",
        message: err?.message || "Failed to submit promotion",
        duration: 5000,
      });
    }
  };

  const handleNext = () => {
    if (!nextCursor) return;

    setHistory((prev) => [...prev, cursor]);
    setCursor(nextCursor);
  };

  const handlePrev = () => {
    if (history.length === 0) return;

    const updated = [...history];
    const prev = updated.pop();

    setHistory(updated);
    setCursor(prev || null);
  };

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

  const handleRefresh = () => {
    setCursor(null);
    setHistory([]);
    refetch();
  };

  const columns = [
    {
      header: "Promotion",
      render: (row) => (
        <div className="flex min-w-[260px] items-center gap-3">
          <img
            src={row.image_path || noImage}
            alt={row.title}
            className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover"
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">
              {row.title}
            </p>
            <p className="line-clamp-1 text-xs text-slate-500">
              {row.description || "No description"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Product ID",
      render: (row) => (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          #{row.product_id || "-"}
        </span>
      ),
    },
    {
      header: "Tag",
      render: (row) => (
        <span className="text-sm font-medium text-slate-700">
          {row.tag || "-"}
        </span>
      ),
    },
    {
      header: "Start Date",
      render: (row) => (
        <span className="text-sm text-slate-500">
          {formatDate(row.start_date)}
        </span>
      ),
    },
    {
      header: "Expires",
      render: (row) => (
        <span className="text-sm text-slate-500">
          {formatDate(row.expires_at)}
        </span>
      ),
    },
    {
      header: "Status",
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
            row.status === "approved"
              ? "bg-emerald-50 text-emerald-700"
              : row.status === "rejected"
                ? "bg-red-50 text-red-700"
                : "bg-amber-50 text-amber-700"
          }`}
        >
          {row.status || "pending"}
        </span>
      ),
    },
    {
      header: "Action",
      align: "right",
      render: () => (
        <div className="flex justify-end gap-2">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100"
            title="Edit promotion"
          >
            <FiEdit className="text-lg" />
          </button>

          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100"
            title="Delete promotion"
          >
            <IoMdTrash className="text-lg" />
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
                <FiStar className="text-xl" />
              </span>

              <div>
                <h1 className="text-xl font-bold text-slate-950">
                  Featured Promotion
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Submit products for featured placement and monitor approval.
                </p>
              </div>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
              <FiPlusCircle className="text-secondary" />
              <span className="font-semibold text-slate-950">
                {promotions.length}
              </span>
              promotions shown
            </div>
          </div>
        </div>

        <AddFeaturedPromotion
          form={form}
          errors={errors}
          preview={preview}
          handleChange={handleChange}
          handleImages={handleImages}
          handleSubmit={handleSubmit}
          submitLoading={submitLoading}
        />

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Promotion Requests
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Latest promotion submissions from your shop.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_140px] lg:w-[460px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search promotions..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-secondary focus:bg-white"
                />
              </div>

              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-secondary focus:bg-white"
              >
                <option value={10}>10 rows</option>
                <option value={20}>20 rows</option>
                <option value={50}>50 rows</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold ml-5 text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw
                className={`text-green-600 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Refreshing..." : "Refresh Table"}
            </button>
          </div>

          <div className="overflow-x-auto p-4">
            <VendorTable
              columns={columns}
              data={promotions}
              loading={loading}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">Page {history.length + 1}</p>

            <div className="flex justify-end gap-2">
              <button
                onClick={handlePrev}
                disabled={history.length === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiChevronLeft />
                Prev
              </button>

              <button
                onClick={handleNext}
                disabled={!hasMore || !nextCursor}
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

export default FeaturedPromotion;
