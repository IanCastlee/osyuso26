import React, { useEffect, useMemo, useState } from "react";
import { FaBox, FaMoneyBill } from "react-icons/fa";
import {
  FiAlertCircle,
  FiImage,
  FiPackage,
  FiPercent,
  FiRefreshCw,
  FiSend,
  FiTag,
  FiX,
} from "react-icons/fi";

import InputField from "../atoms/InputField";
import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";
import LoaderWithText from "../../reusable_components/LoaderWithText";
import SelectField from "../../reusable_components/SelectField";
import addImage from "../../assets/icons/addimage.png";
import { useToast } from "../../context/ToastContext";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category_id: "",
  subcategory_id: "",
  unit_type: "",
  sale_type: "none",
  sale_value: "",
  sale_starts_at: "",
  sale_ends_at: "",
  images: [],
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  return String(value).replace(" ", "T").slice(0, 16);
};

function AddVendorProduct_Form({
  mode = "add",
  initialData = null,
  onSuccess,
}) {
  const { showToast } = useToast();
  const isEdit = mode === "edit";

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState([]);
  const [openCategoryRequest, setOpenCategoryRequest] = useState(false);

  const endpoint = isEdit
    ? "product/update-product.php"
    : "product/add-products.php";

  const { data: categories } = useGetData("product/get-categories_v.php");

  const { data: subcategories, refetch: fetchSubcategories } = useGetData(
    form.category_id
      ? `product/get-subcategories_v.php?category_id=${form.category_id}`
      : null,
    {},
    false,
  );

  const categoryList = useMemo(() => {
    if (Array.isArray(categories)) return categories;
    if (Array.isArray(categories?.data)) return categories.data;
    return [];
  }, [categories]);

  const subcategoryList = useMemo(() => {
    if (Array.isArray(subcategories)) return subcategories;
    if (Array.isArray(subcategories?.data)) return subcategories.data;
    return [];
  }, [subcategories]);

  const originalPrice = Number(form.price || 0);
  const saleValue = Number(form.sale_value || 0);

  const finalPrice = useMemo(() => {
    if (form.sale_type === "percent") {
      return Math.max(0, originalPrice - originalPrice * (saleValue / 100));
    }

    if (form.sale_type === "fixed") {
      return Math.max(0, originalPrice - saleValue);
    }

    return originalPrice;
  }, [form.sale_type, originalPrice, saleValue]);

  const { submit, loading } = useFormSubmit(endpoint, (res) => {
    showToast({
      type: "success",
      message: isEdit
        ? "Product updated successfully!"
        : "Product added successfully!",
      duration: 3000,
    });

    if (!isEdit) {
      preview.forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });

      setForm(EMPTY_FORM);
      setPreview([]);
      setErrors({});
    }

    onSuccess?.(res);
  });

  const { submit: requestCategorySubmit, loading: requestingCategory } =
    useFormSubmit("category/request-category.php");

  useEffect(() => {
    if (!isEdit || !initialData) {
      setForm(EMPTY_FORM);
      setPreview([]);
      setErrors({});
      return;
    }

    const existingImage = initialData.image || initialData.image_path || "";

    setForm({
      name: initialData.name || "",
      description: initialData.description || "",
      price: initialData.price || "",
      stock: initialData.stock || "",
      category_id: initialData.category_id || "",
      subcategory_id: initialData.subcategory_id || "",
      unit_type: initialData.unit_type || "",
      sale_type: initialData.sale_type || "none",
      sale_value:
        initialData.sale_type && initialData.sale_type !== "none"
          ? initialData.sale_value || ""
          : "",
      sale_starts_at: toDateTimeLocal(initialData.sale_starts_at),
      sale_ends_at: toDateTimeLocal(initialData.sale_ends_at),
      images: [],
    });

    setPreview(existingImage ? [existingImage] : []);
    setErrors({});
  }, [isEdit, initialData]);

  useEffect(() => {
    if (!form.category_id) return;

    fetchSubcategories();

    setForm((prev) => {
      const isInitialEditCategory =
        isEdit &&
        initialData &&
        String(prev.category_id) === String(initialData.category_id || "") &&
        String(prev.subcategory_id || "") ===
          String(initialData.subcategory_id || "");

      if (isInitialEditCategory) return prev;

      return {
        ...prev,
        subcategory_id: "",
      };
    });
  }, [form.category_id]);

  useEffect(() => {
    return () => {
      preview.forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [preview]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      if (name === "sale_type" && value === "none") {
        return {
          ...prev,
          sale_type: "none",
          sale_value: "",
          sale_starts_at: "",
          sale_ends_at: "",
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    preview.forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    });

    setForm((prev) => ({
      ...prev,
      images: files,
    }));

    setPreview(files.map((file) => URL.createObjectURL(file)));

    setErrors((prev) => ({
      ...prev,
      images: "",
    }));
  };

  const removeImage = (index) => {
    const nextImages = form.images.filter((_, i) => i !== index);
    const nextPreview = preview.filter((_, i) => i !== index);

    if (preview[index]?.startsWith("blob:")) {
      URL.revokeObjectURL(preview[index]);
    }

    setForm((prev) => ({
      ...prev,
      images: nextImages,
    }));

    setPreview(nextPreview);
  };

  const validate = () => {
    const err = {};

    if (!form.name.trim()) err.name = "Product name is required";
    if (!form.price) err.price = "Price is required";
    if (Number(form.price) < 0) err.price = "Price cannot be negative";
    if (form.stock === "") err.stock = "Stock is required";
    if (Number(form.stock) < 0) err.stock = "Stock cannot be negative";
    if (!form.category_id) err.category_id = "Category is required";
    if (!form.subcategory_id) err.subcategory_id = "Subcategory is required";
    if (!form.unit_type) err.unit_type = "Unit type is required";

    if (form.sale_type !== "none") {
      if (!form.sale_value || Number(form.sale_value) <= 0) {
        err.sale_value = "Sale value is required";
      }

      if (form.sale_type === "percent" && Number(form.sale_value) > 100) {
        err.sale_value = "Percent discount cannot be more than 100";
      }

      if (
        form.sale_type === "fixed" &&
        Number(form.sale_value) > Number(form.price)
      ) {
        err.sale_value = "Discount cannot be greater than product price";
      }

      if (form.sale_starts_at && form.sale_ends_at) {
        const start = new Date(form.sale_starts_at);
        const end = new Date(form.sale_ends_at);

        if (end <= start) {
          err.sale_ends_at = "Sale end must be after sale start";
        }
      }
    }

    if (!isEdit && form.images.length === 0) {
      err.images = "Upload at least 1 image";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
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

    const data = new FormData();

    if (isEdit) {
      data.append("product_id", initialData.id);
    }

    data.append("name", form.name.trim());
    data.append("description", form.description.trim());
    data.append("price", form.price);
    data.append("stock", form.stock);
    data.append("category_id", form.category_id);
    data.append("subcategory_id", form.subcategory_id);
    data.append("unit_type", form.unit_type);
    data.append("sale_type", form.sale_type);
    data.append("sale_value", form.sale_type === "none" ? 0 : form.sale_value);
    data.append("sale_starts_at", form.sale_starts_at || "");
    data.append("sale_ends_at", form.sale_ends_at || "");

    form.images.forEach((file) => {
      data.append("images[]", file);
    });

    try {
      await submit(data);
    } catch (err) {
      showToast({
        type: "error",
        message: err?.message || "Failed to save product.",
        duration: 4000,
      });
    }
  };

  const handleCategoryRequest = async (payload) => {
    try {
      await requestCategorySubmit(payload);

      showToast({
        type: "success",
        message: "Category request sent to admin.",
        duration: 4000,
      });

      setOpenCategoryRequest(false);
    } catch (err) {
      showToast({
        type: "error",
        message: err?.message || "Failed to send category request.",
        duration: 4000,
      });
    }
  };

  const existingPreviewOnly =
    isEdit && preview.length > 0 && form.images.length === 0;

  return (
    <div className="w-full">
      <div className="mb-5 border-b border-slate-100 pb-4 pr-10">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-secondary">
            <FiPackage className="text-xl" />
          </span>

          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {isEdit ? "Edit Product" : "Add Product"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isEdit
                ? "Update product details, pricing, inventory, and sale settings."
                : "Create a new item for your shop inventory."}
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]"
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <FiTag className="text-secondary" />
              <h3 className="text-sm font-semibold text-slate-950">
                Product Details
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <InputField
                  label="Product Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  icon={FaBox}
                  error={errors.name}
                />
              </div>

              <div className="sm:col-span-2">
                <InputField
                  label="Description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  error={errors.description}
                />
              </div>

              <InputField
                label="Price"
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                icon={FaMoneyBill}
                error={errors.price}
              />

              <InputField
                label="Stock"
                name="stock"
                type="decimal"
                value={form.stock}
                onChange={handleChange}
                error={errors.stock}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <FiPercent className="text-secondary" />
              <h3 className="text-sm font-semibold text-slate-950">
                Sale Settings
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Sale Type"
                name="sale_type"
                value={form.sale_type}
                onChange={handleChange}
                options={[
                  { value: "none", label: "No Sale" },
                  { value: "percent", label: "Percent Off" },
                  { value: "fixed", label: "Fixed Amount Off" },
                ]}
                error={errors.sale_type}
              />

              {form.sale_type !== "none" && (
                <InputField
                  label={
                    form.sale_type === "percent"
                      ? "Discount Percent"
                      : "Discount Amount"
                  }
                  name="sale_value"
                  type="number"
                  value={form.sale_value}
                  onChange={handleChange}
                  error={errors.sale_value}
                />
              )}

              {form.sale_type !== "none" && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Sale Starts
                    </label>

                    <input
                      type="datetime-local"
                      name="sale_starts_at"
                      value={form.sale_starts_at}
                      onChange={handleChange}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-secondary focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Sale Ends
                    </label>

                    <input
                      type="datetime-local"
                      name="sale_ends_at"
                      value={form.sale_ends_at}
                      onChange={handleChange}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-secondary focus:bg-white"
                    />

                    {errors.sale_ends_at && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.sale_ends_at}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2 rounded-xl border border-orange-100 bg-orange-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                      Sale Preview
                    </p>

                    <div className="mt-2 flex items-end gap-3">
                      <span className="text-sm text-slate-400 line-through">
                        ₱{originalPrice.toFixed(2)}
                      </span>

                      <span className="text-2xl font-bold text-orange-500">
                        ₱{finalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <FiPackage className="text-secondary" />
              <h3 className="text-sm font-semibold text-slate-950">
                Category and Selling Unit
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Category"
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                options={categoryList.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                error={errors.category_id}
              />

              <SelectField
                label="Subcategory"
                name="subcategory_id"
                value={form.subcategory_id}
                onChange={handleChange}
                disabled={!form.category_id}
                options={subcategoryList.map((s) => ({
                  value: s.id,
                  label: s.name,
                }))}
                error={errors.subcategory_id}
              />

              <div className="sm:col-span-2 rounded-xl border border-orange-100 bg-orange-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <FiAlertCircle className="mt-0.5 shrink-0 text-orange-500" />

                    <div>
                      <p className="text-sm font-bold text-orange-700">
                        Can't find the right category?
                      </p>

                      <p className="mt-1 text-xs leading-5 text-orange-700/80">
                        Send a request to admin. Once approved, you can use it
                        for your product.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpenCategoryRequest(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
                  >
                    <FiSend />
                    Request
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <SelectField
                  label="Unit Type"
                  name="unit_type"
                  value={form.unit_type}
                  onChange={handleChange}
                  options={[
                    { value: "pcs", label: "Per Piece" },
                    { value: "kg", label: "Per Kilogram" },
                  ]}
                  error={errors.unit_type}
                />
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <FiImage className="text-secondary" />
              <h3 className="text-sm font-semibold text-slate-950">
                Product Images
              </h3>
            </div>

            <input
              id="product-images-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleImages}
              className="hidden"
            />

            <label
              htmlFor="product-images-upload"
              className={`flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-slate-50 p-5 text-center transition hover:border-secondary hover:bg-orange-50/40 ${
                errors.images ? "border-red-300" : "border-slate-300"
              }`}
            >
              <img
                src={addImage}
                alt="Upload"
                className="h-12 w-12 object-contain opacity-70"
              />

              <p className="mt-3 text-sm font-semibold text-slate-800">
                {isEdit ? "Upload new product photos" : "Upload product photos"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {isEdit
                  ? "Optional. New upload will become the latest product image."
                  : "JPG, PNG, or WEBP. You can select multiple images."}
              </p>
            </label>

            {errors.images && (
              <p className="mt-2 text-xs font-medium text-red-500">
                {errors.images}
              </p>
            )}

            {preview.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {preview.map((img, index) => (
                  <div
                    key={`${img}-${index}`}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                  >
                    <img
                      src={img}
                      alt={`Product preview ${index + 1}`}
                      className="h-full w-full object-cover"
                    />

                    {!existingPreviewOnly && (
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-red-50 hover:text-red-600"
                        title="Remove image"
                      >
                        <FiX />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <LoaderWithText text={isEdit ? "Updating..." : "Uploading..."} />
            ) : isEdit ? (
              "Update Product"
            ) : (
              "Add Product"
            )}
          </button>
        </aside>
      </form>

      <CategoryRequestModal
        open={openCategoryRequest}
        categories={categoryList}
        defaultCategoryId={form.category_id}
        loading={requestingCategory}
        onClose={() => setOpenCategoryRequest(false)}
        onSubmit={handleCategoryRequest}
      />
    </div>
  );
}

function CategoryRequestModal({
  open,
  categories,
  defaultCategoryId,
  loading,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState({
    category_id: "",
    category_name: "",
    subcategory_name: "",
    reason: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;

    setForm({
      category_id: defaultCategoryId || "",
      category_name: "",
      subcategory_name: "",
      reason: "",
    });

    setErrors({});
  }, [open, defaultCategoryId]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "category_id" && value ? { category_name: "" } : {}),
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const err = {};

    if (!form.category_id && !form.category_name.trim()) {
      err.category_name = "Select existing category or enter new category";
    }

    if (!form.subcategory_name.trim()) {
      err.subcategory_name = "Subcategory name is required";
    }

    setErrors(err);

    if (Object.keys(err).length > 0) return;

    await onSubmit({
      category_id: form.category_id,
      category_name: form.category_name.trim(),
      subcategory_name: form.subcategory_name.trim(),
      reason: form.reason.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Request Category
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Admin will review this before it becomes available.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500"
          >
            <FiX />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Existing Category
            </label>

            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-secondary focus:bg-white"
            >
              <option value="">Request a new category</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {!form.category_id && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                New Category Name
              </label>

              <input
                name="category_name"
                value={form.category_name}
                onChange={handleChange}
                placeholder="Example: Native Delicacies"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-secondary focus:bg-white"
              />

              {errors.category_name && (
                <p className="mt-1 text-xs font-medium text-red-500">
                  {errors.category_name}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Requested Subcategory
            </label>

            <input
              name="subcategory_name"
              value={form.subcategory_name}
              onChange={handleChange}
              placeholder="Example: Kakanin"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-secondary focus:bg-white"
            />

            {errors.subcategory_name && (
              <p className="mt-1 text-xs font-medium text-red-500">
                {errors.subcategory_name}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Reason / Example Product
            </label>

            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder="Example: I want to add puto, kutsinta, and bibingka."
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-secondary focus:bg-white"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <FiRefreshCw className="animate-spin" /> : <FiSend />}
            Send Request
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddVendorProduct_Form;
