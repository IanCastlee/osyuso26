import React, { useEffect, useMemo, useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiEdit,
  FiPlusCircle,
  FiRefreshCw,
  FiSearch,
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
  const [editingPromotion, setEditingPromotion] = useState(null);

  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [cursor, setCursor] = useState(null);
  const [history, setHistory] = useState([]);

  const isEditMode = Boolean(editingPromotion);

  useEffect(() => {
    return () => {
      preview.forEach((url) => {
        if (String(url).startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [preview]);

  const { submit: createPromotion, loading: createLoading } = useFormSubmit(
    "promotion/add-feature-promotion.php",
  );

  const { submit: updateRejectedPromotion, loading: updateLoading } =
    useFormSubmit("promotion/update-rejected-promotion.php", () => {
      showToast({
        type: "success",
        message: "Promotion updated and sent for admin review.",
        duration: 4000,
      });

      resetForm();
      refetch();
    });

  const submitLoading = createLoading || updateLoading;

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
    if (Array.isArray(data?.data?.rows)) return data.data.rows;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }, [data]);

  const nextCursor =
    data?.next_cursor || data?.data?.next_cursor || promotions.at(-1)?.id;

  const hasMore = Boolean(data?.has_more ?? data?.data?.has_more ?? false);

  useEffect(() => {
    setCursor(null);
    setHistory([]);
  }, [search, limit]);

  const toDateTimeLocal = (value) => {
    if (!value) return "";
    return String(value).replace(" ", "T").slice(0, 16);
  };

  const resetForm = () => {
    preview.forEach((url) => {
      if (String(url).startsWith("blob:")) URL.revokeObjectURL(url);
    });

    setForm(emptyForm);
    setPreview([]);
    setImages([]);
    setErrors({});
    setEditingPromotion(null);
  };

  const handleEdit = (row) => {
    if (row.status !== "rejected" || row.payment_status !== "paid") {
      showToast({
        type: "error",
        message: "Only paid rejected promotions can be revised.",
        duration: 3500,
      });
      return;
    }

    setEditingPromotion(row);
    setForm({
      product_id: String(row.product_id || ""),
      tag: row.tag || "",
      title: row.title || "",
      description: row.description || "",
      start_date: toDateTimeLocal(row.start_date),
      expires_at: toDateTimeLocal(row.expires_at),
    });
    setPreview(row.image_path ? [row.image_path] : []);
    setImages([]);
    setErrors({});

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

    preview.forEach((url) => {
      if (String(url).startsWith("blob:")) URL.revokeObjectURL(url);
    });

    setImages(files);
    setPreview(files.map((file) => URL.createObjectURL(file)));

    setErrors((prev) => ({
      ...prev,
      image: "",
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!isEditMode && !form.product_id) {
      newErrors.product_id = "Product ID is required";
    }

    if (!form.title.trim()) newErrors.title = "Title is required";

    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!isEditMode) {
      if (!form.start_date) newErrors.start_date = "Start date is required";
      if (!form.expires_at)
        newErrors.expires_at = "Expiration date is required";

      if (form.start_date && form.expires_at) {
        const start = new Date(form.start_date);
        const end = new Date(form.expires_at);

        if (end <= start) {
          newErrors.expires_at = "Expiration must be greater than start date";
        }
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

    formData.append("tag", form.tag);
    formData.append("title", form.title.trim());
    formData.append("description", form.description.trim());

    if (images[0]) {
      formData.append("image", images[0]);
    }

    try {
      if (isEditMode) {
        formData.append("promotion_id", editingPromotion.id);
        await updateRejectedPromotion(formData);
        return;
      }

      formData.append("product_id", form.product_id);
      formData.append("start_date", form.start_date);
      formData.append("expires_at", form.expires_at);

      const res = await createPromotion(formData);

      const checkoutUrl =
        res?.data?.checkout_url ||
        res?.checkout_url ||
        res?.data?.xendit_checkout_url ||
        res?.xendit_checkout_url;

      if (!checkoutUrl) {
        throw new Error("Payment link was not returned by the server.");
      }

      window.location.assign(checkoutUrl);
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

  const formatPeso = (value) =>
    `₱${Number(value || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleRefresh = () => {
    setCursor(null);
    setHistory([]);
    refetch();
  };

  const getStatusClass = (status) => {
    if (status === "active" || status === "approved" || status === "paid") {
      return "bg-emerald-50 text-emerald-700";
    }

    if (status === "rejected" || status === "failed" || status === "expired") {
      return "bg-red-50 text-red-700";
    }

    return "bg-amber-50 text-amber-700";
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
      header: "Cost",
      render: (row) => (
        <span className="text-sm font-bold text-slate-800">
          {formatPeso(row.total_price)}
        </span>
      ),
    },
    {
      header: "Payment",
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
            row.payment_status,
          )}`}
        >
          {row.payment_status || "unpaid"}
        </span>
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
          {row.status || "pending"}
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
      header: "Action",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          {row.status === "pending_payment" && row.xendit_checkout_url && (
            <button
              type="button"
              onClick={() => window.location.assign(row.xendit_checkout_url)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-secondary transition hover:bg-orange-100"
              title="Continue payment"
            >
              <FiCreditCard className="text-lg" />
            </button>
          )}

          {row.status === "rejected" && row.payment_status === "paid" && (
            <button
              type="button"
              onClick={() => handleEdit(row)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100"
              title="Revise rejected promotion"
            >
              <FiEdit className="text-lg" />
            </button>
          )}
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
          isEditMode={isEditMode}
          editingPromotion={editingPromotion}
          handleCancelEdit={resetForm}
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
              className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
