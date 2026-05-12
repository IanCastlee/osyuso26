import React, { useEffect, useState } from "react";
import InputField from "../atoms/InputField";
import { FaBox, FaMoneyBill } from "react-icons/fa";
import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";
import LoaderWithText from "../../reusable_components/LoaderWithText";
import SelectField from "../../reusable_components/SelectField";
import { useToast } from "../../context/ToastContext";

function AddVendorProduct_Form() {
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category_id: "",
    subcategory_id: "",
    unit_type: "",
    images: [],
  });

  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState([]);

  // ================= API =================
  const { data: categories } = useGetData("product/get-categories.php");

  const { data: subcategories, refetch: fetchSubcategories } = useGetData(
    form.category_id
      ? `product/get-subcategories_v.php?category_id=${form.category_id}`
      : null,
    {},
    false,
  );

  const { submit, loading } = useFormSubmit(
    "product/add-products.php",
    (res) => {
      // SUCCESS TOAST
      showToast({
        type: "success",
        message: "Product Added!",
        duration: 3000,
      });

      //  CLEAR FORM AFTER SUCCESS
      setForm({
        name: "",
        description: "",
        price: "",
        stock: "",
        category_id: "",
        subcategory_id: "",
        unit_type: "",
        images: [],
      });

      setPreview([]);
    },
  );

  // ================= CATEGORY CHANGE =================
  useEffect(() => {
    if (form.category_id) {
      fetchSubcategories();

      setForm((prev) => ({
        ...prev,
        subcategory_id: "",
      }));
    }
  }, [form.category_id]);

  // ================= INPUT =================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ================= MULTI IMAGE =================
  const handleImages = (e) => {
    const files = Array.from(e.target.files);

    setForm((prev) => ({
      ...prev,
      images: files,
    }));

    // preview images
    const previews = files.map((file) => URL.createObjectURL(file));
    setPreview(previews);
  };

  // ================= VALIDATION =================
  const validate = () => {
    let err = {};

    if (!form.name) err.name = "Required";
    if (!form.price) err.price = "Required";
    if (!form.stock) err.stock = "Required";
    if (!form.category_id) err.category_id = "Required";
    if (!form.subcategory_id) err.subcategory_id = "Required";
    if (!form.unit_type) err.unit_type = "Required";
    if (form.images.length === 0) err.images = "Upload at least 1 image";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // CHECK INTERNET CONNECTION
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

    // normal fields
    data.append("name", form.name);
    data.append("description", form.description);
    data.append("price", form.price);
    data.append("stock", form.stock);
    data.append("category_id", form.category_id);
    data.append("subcategory_id", form.subcategory_id);
    data.append("unit_type", form.unit_type);

    // multiple images
    form.images.forEach((file) => {
      data.append("images[]", file);
    });

    try {
      await submit(data);
    } catch (err) {
      console.error(err);

      //  HANDLE NETWORK ERRORS DURING REQUEST
      if (!navigator.onLine) {
        showToast({
          type: "error",
          message: "No internet connection. Please check your network.",
          duration: 5000,
        });
      } else {
        showToast({
          type: "error",
          message: err?.message || "Something went wrong",

          duration: 5000,
        });
      }
      console.er;
    }
  };
  return (
    <div className="w-full max-w-5xl mx-auto bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-5">Add Product</h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* LEFT */}
        <div className="space-y-4">
          <InputField
            label="Product Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            icon={FaBox}
            error={errors.name}
          />

          <InputField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            error={errors.description}
          />

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
            type="number"
            value={form.stock}
            onChange={handleChange}
            error={errors.stock}
          />
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          {/* CATEGORY */}
          <SelectField
            label="Category"
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            options={
              categories?.map((c) => ({
                value: c.id,
                label: c.name,
              })) || []
            }
            error={errors.category_id}
          />

          {/* SUBCATEGORY */}
          <SelectField
            label="Subcategory"
            name="subcategory_id"
            value={form.subcategory_id}
            onChange={handleChange}
            disabled={!form.category_id}
            options={
              subcategories?.map((s) => ({
                value: s.id,
                label: s.name,
              })) || []
            }
            error={errors.subcategory_id}
          />

          {/* UNIT TYPE */}
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

          {/* MULTI IMAGE UPLOAD */}
          <div>
            <label className="text-sm font-medium">Product Images</label>

            <input
              type="file"
              multiple
              onChange={handleImages}
              className="w-full border p-2 rounded-md mt-1"
            />

            {errors.images && (
              <p className="text-xs text-red-500">{errors.images}</p>
            )}

            {/* PREVIEW */}
            <div className="flex gap-2 mt-2 flex-wrap">
              {preview.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  className="w-16 h-16 object-cover rounded-md border"
                />
              ))}
            </div>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary text-white py-2 rounded-md font-semibold flex items-center justify-center gap-2"
          >
            {loading ? <LoaderWithText text="Uploading..." /> : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddVendorProduct_Form;
