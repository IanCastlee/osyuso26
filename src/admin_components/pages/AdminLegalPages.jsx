import React, { useEffect, useMemo, useState } from "react";
import { FiFileText, FiRefreshCw, FiSave } from "react-icons/fi";
import InputField from "../atoms/InputField";
import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";
import { useToast } from "../../context/ToastContext";

const pages = [
  { label: "Terms and Conditions", slug: "terms-and-conditions" },
  { label: "Privacy Policy", slug: "privacy-policy" },
];

const defaultForm = {
  title: "",
  version: "1.0",
  effective_date: "",
  content: "",
  is_published: 1,
};

function AdminLegalPages() {
  const { showToast } = useToast();

  const [activeSlug, setActiveSlug] = useState("terms-and-conditions");
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});

  const { data, loading, error, refetch } = useGetData(
    `legal/admin-get-legal-page.php?slug=${encodeURIComponent(activeSlug)}`,
  );

  console.log(data);

  const { submit: updateLegalPage, loading: saving } = useFormSubmit(
    "legal/admin-update-legal-page.php",
    () => {
      showToast({
        type: "success",
        message: "Legal page updated successfully",
        duration: 3000,
      });
      refetch();
    },
  );

  const page = useMemo(() => data?.data || data || {}, [data]);

  useEffect(() => {
    if (!page || Object.keys(page).length === 0) return;

    setForm({
      title: page.title || "",
      version: page.version || "1.0",
      effective_date: page.effective_date || "",
      content: page.content || "",
      is_published: Number(page.is_published ?? 1),
    });
  }, [page]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = "Title is required.";
    if (!form.version.trim()) nextErrors.version = "Version is required.";
    if (!form.effective_date) {
      nextErrors.effective_date = "Effective date is required.";
    }
    if (!form.content.trim() || form.content.trim().length < 30) {
      nextErrors.content = "Content must be at least 30 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    await updateLegalPage({
      slug: activeSlug,
      title: form.title.trim(),
      version: form.version.trim(),
      effective_date: form.effective_date,
      content: form.content.trim(),
      is_published: Number(form.is_published),
    });
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-secondary">
                <FiFileText className="text-xl" />
              </span>

              <div>
                <h1 className="text-xl font-bold text-slate-950">
                  Legal Pages
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Manage Terms and Conditions and Privacy Policy content.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={refetch}
              disabled={loading || saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="mt-5 flex rounded-lg bg-slate-100 p-1 text-sm font-semibold">
            {pages.map((item) => (
              <button
                key={item.slug}
                onClick={() => {
                  setActiveSlug(item.slug);
                  setErrors({});
                }}
                className={`flex-1 rounded-md px-4 py-2 transition ${
                  activeSlug === item.slug
                    ? "bg-white text-secondary shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
        </div>

        <form
          onSubmit={submitForm}
          className="grid gap-5 lg:grid-cols-[1fr_340px]"
        >
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <InputField
                  label="Page Title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Terms and Conditions"
                  icon={FiFileText}
                  error={errors.title}
                />
              </div>

              <InputField
                label="Version"
                name="version"
                value={form.version}
                onChange={handleChange}
                placeholder="1.0"
                error={errors.version}
              />

              <InputField
                label="Effective Date"
                name="effective_date"
                type="date"
                value={form.effective_date}
                onChange={handleChange}
                error={errors.effective_date}
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-primary">
                Content
              </label>

              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                rows={22}
                placeholder="Use ## for section headings..."
                className={`w-full resize-y rounded-lg border bg-white px-4 py-3 text-sm leading-7 text-slate-800 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/30 ${
                  errors.content ? "border-red-400" : "border-slate-200"
                }`}
              />

              {errors.content && (
                <p className="mt-2 text-xs text-red-500">{errors.content}</p>
              )}

              <p className="mt-2 text-xs text-slate-500">
                Tip: Use headings like{" "}
                <span className="font-semibold">## Introduction</span>.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  name="is_published"
                  checked={Number(form.is_published) === 1}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-secondary focus:ring-secondary"
                />
                Published
              </label>

              <button
                type="submit"
                disabled={saving || loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-secondary px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiSave />
                {saving ? "Updating..." : "Update Legal Page"}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-950">Preview Info</h2>

            <div className="mt-5 space-y-3">
              <div className="rounded-lg bg-orange-50 p-4">
                <p className="text-xs font-semibold uppercase text-orange-500">
                  Current Page
                </p>
                <p className="mt-1 text-lg font-bold text-secondary">
                  {pages.find((item) => item.slug === activeSlug)?.label}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Version
                </p>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  {form.version || "1.0"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-100 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Status
                </p>
                <p
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                    Number(form.is_published) === 1
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {Number(form.is_published) === 1 ? "Published" : "Draft"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-100 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Character Count
                </p>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  {form.content.length}
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminLegalPages;
