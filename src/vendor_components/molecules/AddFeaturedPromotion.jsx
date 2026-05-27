import React from "react";
import { FaBox, FaMoneyBill } from "react-icons/fa";
import { FiCalendar, FiImage, FiPackage, FiTag, FiX } from "react-icons/fi";

import offer1 from "../../assets/hero_images/offer1.png";
import addImage from "../../assets/icons/addimage.png";
import LoaderWithText from "../../reusable_components/LoaderWithText";
import InputField from "../atoms/InputField";
import useGetData from "../../hooks/useGetData";

function AddFeaturedPromotion({
  form,
  errors,
  preview,
  handleChange,
  handleImages,
  handleSubmit,
  submitLoading,
  isEditMode = false,
  editingPromotion = null,
  handleCancelEdit,
}) {
  const { data, loading } = useGetData("admin_setting/admin-setting.php");

  const PRICE_PER_HOUR = Number(data?.price_per_hour) || 20;

  const now = new Date();
  const localDateTime = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);

  const calculateHours = () => {
    if (!form.start_date || !form.expires_at) return 1;

    const start = new Date(form.start_date);
    const end = new Date(form.expires_at);
    const diffMs = end - start;

    if (diffMs <= 0) return 1;

    return Math.ceil(diffMs / (1000 * 60 * 60));
  };

  const totalHours = Number(editingPromotion?.total_hours || calculateHours());
  const totalPrice = Number(
    editingPromotion?.total_price || totalHours * PRICE_PER_HOUR,
  );
  const imageError = errors.image || errors.images;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-secondary">
            <FiTag className="text-xl" />
          </span>

          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {isEditMode
                ? "Revise Rejected Promotion"
                : "Create Featured Promotion"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isEditMode
                ? "Update the content and send it back for admin review. No new payment is required."
                : "Submit a product promotion for admin approval."}
            </p>
          </div>
        </div>

        {isEditMode && (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
            title="Cancel edit"
          >
            <FiX />
          </button>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]"
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-4 flex items-center gap-2">
              <FiPackage className="text-secondary" />
              <h3 className="text-sm font-semibold text-slate-950">
                Promotion Details
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {isEditMode ? (
                <ReadOnlyBox
                  label="Product ID"
                  value={`#${form.product_id || "-"}`}
                />
              ) : (
                <InputField
                  label="Product ID"
                  name="product_id"
                  type="number"
                  placeholder="Eg. 55"
                  value={form.product_id}
                  onChange={handleChange}
                  icon={FiPackage}
                  error={errors.product_id}
                />
              )}

              <InputField
                label="Tag"
                placeholder="Eg. Limited Offer"
                name="tag"
                value={form.tag}
                onChange={handleChange}
                icon={FaBox}
                error={errors.tag}
              />

              <div className="sm:col-span-2">
                <InputField
                  label="Title"
                  name="title"
                  placeholder="Promotion title"
                  value={form.title}
                  onChange={handleChange}
                  error={errors.title}
                />
              </div>

              <div className="sm:col-span-2">
                <InputField
                  label="Description"
                  name="description"
                  placeholder="Short promotion description"
                  value={form.description}
                  onChange={handleChange}
                  icon={FaMoneyBill}
                  error={errors.description}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-4 flex items-center gap-2">
              <FiCalendar className="text-secondary" />
              <h3 className="text-sm font-semibold text-slate-950">Schedule</h3>
            </div>

            {isEditMode && (
              <p className="mb-4 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-700">
                Schedule and duration are locked because this promotion is
                already paid. Once admin approves it, the paid duration will
                start from approval time.
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <DateField
                label="Start Date"
                name="start_date"
                value={form.start_date}
                min={localDateTime}
                onChange={handleChange}
                error={errors.start_date}
                disabled={isEditMode}
              />

              <DateField
                label="Expires At"
                name="expires_at"
                value={form.expires_at}
                min={form.start_date || localDateTime}
                onChange={handleChange}
                error={errors.expires_at}
                disabled={isEditMode}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-4 flex items-center gap-2">
              <FiImage className="text-secondary" />
              <h3 className="text-sm font-semibold text-slate-950">
                Banner Image
              </h3>
            </div>

            <input
              id="featured-banner-upload"
              type="file"
              accept="image/*"
              onChange={handleImages}
              className="hidden"
            />

            <label
              htmlFor="featured-banner-upload"
              className={`group relative flex h-44 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-white transition hover:border-secondary ${
                imageError ? "border-red-300" : "border-slate-300"
              }`}
            >
              {preview[0] ? (
                <>
                  <img
                    src={preview[0]}
                    alt="Preview"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 transition group-hover:opacity-100">
                    <span className="text-sm font-semibold text-white">
                      Change Image
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-center text-slate-400">
                  <img
                    src={addImage}
                    alt="Upload"
                    className="h-14 w-14 object-contain opacity-70"
                  />
                  <span className="mt-2 text-sm font-medium">
                    Click to upload banner
                  </span>
                  <span className="mt-1 text-xs">JPG, PNG, or WEBP</span>
                </div>
              )}
            </label>

            {imageError && (
              <p className="mt-2 text-xs font-medium text-red-500">
                {imageError}
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <div className="overflow-hidden rounded-2xl border border-orange-200 bg-orange-500 text-white shadow-sm">
            <div className="flex h-56">
              <div className="h-full w-[38%] overflow-hidden bg-orange-600">
                <img
                  src={preview[0] || offer1}
                  alt="Promotion"
                  className="h-full w-full scale-x-[-1] object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col justify-center gap-2 p-4">
                <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                  {form.tag || "Limited Offer"}
                </span>

                <h2 className="line-clamp-2 text-xl font-bold leading-tight">
                  {form.title || "Special Vendor Offer"}
                </h2>

                <p className="line-clamp-3 text-sm leading-snug text-white/90">
                  {form.description ||
                    "Promote your selected product and reach more buyers."}
                </p>

                <button
                  type="button"
                  className="mt-1 w-fit rounded-lg bg-white px-4 py-2 text-sm font-semibold text-orange-500"
                >
                  Shop Now
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm font-bold text-orange-700">
              Promotion Summary
            </p>

            <div className="mt-3 space-y-2 text-sm">
              <SummaryRow label="Product ID" value={form.product_id || "-"} />
              <SummaryRow
                label="Duration"
                value={`${totalHours} hour${totalHours > 1 ? "s" : ""}`}
              />
              <SummaryRow
                label="Rate"
                value={loading ? "Loading..." : `₱${PRICE_PER_HOUR} / hour`}
              />
              <SummaryRow
                label={isEditMode ? "Paid Cost" : "Estimated Cost"}
                value={`₱${totalPrice}`}
                bold
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={
              submitLoading ||
              (!isEditMode && (!form.start_date || !form.expires_at))
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitLoading ? (
              <LoaderWithText text="Submitting..." />
            ) : isEditMode ? (
              "Submit Revised Promotion"
            ) : (
              `Submit Promotion • ₱${totalPrice}`
            )}
          </button>
        </aside>
      </form>
    </div>
  );
}

function ReadOnlyBox({ label, value }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </label>

      <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-700">
        {value}
      </div>
    </div>
  );
}

function DateField({ label, name, value, min, onChange, error, disabled }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </label>

      <input
        type="datetime-local"
        name={name}
        value={value}
        min={min}
        onChange={onChange}
        disabled={disabled}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-secondary disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      />

      {error && (
        <p className="mt-1 text-xs font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}

function SummaryRow({ label, value, bold = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-orange-700/80">{label}</span>
      <span
        className={`text-right ${
          bold
            ? "text-lg font-bold text-orange-700"
            : "font-semibold text-orange-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default AddFeaturedPromotion;
