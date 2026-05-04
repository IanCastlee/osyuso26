import React, { useEffect, useState } from "react";
import InputField from "../atoms/InputField";
import { FaBox, FaMoneyBill } from "react-icons/fa";
import useGetData from "../../hooks/useGetData";
import LoaderWithText from "../../reusable_components/LoaderWithText";

function AddVendorProduct_Form() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category_id: "",
    subcategory_id: "",
    unit_type: "", // ✅ NEW FIELD
    image: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ================= FETCH CATEGORIES =================
  const { data: categories } = useGetData("product/get-categories.php");

  // ================= FETCH SUBCATEGORIES =================
  const { data: subcategories, refetch: fetchSubcategories } = useGetData(
    form.category_id
      ? `product/get-subcategories.php?category_id=${form.category_id}`
      : null,
    {},
    false,
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

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e) => {
    setForm({ ...form, image: e.target.files[0] });
  };

  // ================= VALIDATION =================
  const validate = () => {
    let newErrors = {};

    if (!form.name) newErrors.name = "Product name required";
    if (!form.price) newErrors.price = "Price required";
    if (!form.stock) newErrors.stock = "Stock required";
    if (!form.category_id) newErrors.category_id = "Select category";
    if (!form.subcategory_id) newErrors.subcategory_id = "Select subcategory";
    if (!form.unit_type) newErrors.unit_type = "Select unit type";
    if (!form.image) newErrors.image = "Image required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================= SUBMIT =================
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      data.append(key, value);
    });

    setTimeout(() => {
      console.log("SUBMIT DATA:", Object.fromEntries(data));
      setLoading(false);

      // optional reset
      // setForm({
      //   name: "",
      //   description: "",
      //   price: "",
      //   stock: "",
      //   category_id: "",
      //   subcategory_id: "",
      //   unit_type: "",
      //   image: null,
      // });
    }, 1200);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-bold text-primary mb-6">Add Product</h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* LEFT SIDE */}
        <div className="space-y-4">
          <InputField
            label="Product Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter product name"
            icon={FaBox}
            error={errors.name}
          />

          <InputField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Enter description"
            error={errors.description}
          />

          <InputField
            label="Price"
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            placeholder="Enter price"
            icon={FaMoneyBill}
            error={errors.price}
          />

          <InputField
            label="Stock"
            name="stock"
            type="number"
            value={form.stock}
            onChange={handleChange}
            placeholder="Enter stock"
            error={errors.stock}
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-4">
          {/* CATEGORY */}
          <div>
            <label className="text-sm font-medium text-primary">Category</label>

            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="w-full border p-2 rounded-md text-sm mt-1"
            >
              <option value="">Select category</option>

              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {errors.category_id && (
              <span className="text-xs text-red-500">{errors.category_id}</span>
            )}
          </div>

          {/* SUBCATEGORY */}
          <div>
            <label className="text-sm font-medium text-primary">
              Subcategory
            </label>

            <select
              name="subcategory_id"
              value={form.subcategory_id}
              onChange={handleChange}
              className="w-full border p-2 rounded-md text-sm mt-1"
              disabled={!form.category_id}
            >
              <option value="">Select subcategory</option>

              {subcategories?.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>

            {errors.subcategory_id && (
              <span className="text-xs text-red-500">
                {errors.subcategory_id}
              </span>
            )}
          </div>

          {/* UNIT TYPE (NEW) */}
          <div>
            <label className="text-sm font-medium text-primary">
              Unit Type
            </label>

            <select
              name="unit_type"
              value={form.unit_type}
              onChange={handleChange}
              className="w-full border p-2 rounded-md text-sm mt-1"
            >
              <option value="">Select unit type</option>
              <option value="pcs">Per Piece (pcs)</option>
              <option value="kg">Per Kilogram (kg)</option>
            </select>

            {errors.unit_type && (
              <span className="text-xs text-red-500">{errors.unit_type}</span>
            )}
          </div>

          {/* IMAGE */}
          <div>
            <label className="text-sm font-medium text-primary">
              Product Image
            </label>

            <input
              type="file"
              onChange={handleFile}
              className="w-full border p-2 rounded-md mt-1"
            />

            {errors.image && (
              <span className="text-xs text-red-500">{errors.image}</span>
            )}
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary text-white py-2 rounded-md font-semibold mt-2 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <LoaderWithText text="Adding Product..." />
            ) : (
              "Add Product"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddVendorProduct_Form;
