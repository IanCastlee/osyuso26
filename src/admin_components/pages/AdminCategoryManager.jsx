import React, { useMemo, useState } from "react";
import {
  FiEdit2,
  FiGrid,
  FiLayers,
  FiPlusCircle,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import AdminTable from "../organisms/AdminTable";
import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";
import { useToast } from "../../context/ToastContext";

function AdminCategoryManager() {
  const { showToast } = useToast();

  const [categorySearch, setCategorySearch] = useState("");
  const [subcategorySearch, setSubcategorySearch] = useState("");

  const [categoryForm, setCategoryForm] = useState({ id: "", name: "" });
  const [subcategoryForm, setSubcategoryForm] = useState({
    id: "",
    category_id: "",
    name: "",
  });

  const {
    data: categoryData,
    loading: categoryLoading,
    refetch: refetchCategories,
  } = useGetData("admin/get-categories.php");

  const {
    data: subcategoryData,
    loading: subcategoryLoading,
    refetch: refetchSubcategories,
  } = useGetData("admin/get-subcategories.php");

  const { submit: saveCategorySubmit, loading: savingCategory } = useFormSubmit(
    "admin/save-category.php",
  );

  const { submit: deleteCategorySubmit, loading: deletingCategory } =
    useFormSubmit("admin/delete-category.php");

  const { submit: saveSubcategorySubmit, loading: savingSubcategory } =
    useFormSubmit("admin/save-subcategory.php");

  const { submit: deleteSubcategorySubmit, loading: deletingSubcategory } =
    useFormSubmit("admin/delete-subcategory.php");

  const categories = useMemo(() => {
    const payload = categoryData?.data || categoryData || {};
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.categories)) return payload.categories;
    if (Array.isArray(payload.rows)) return payload.rows;
    return [];
  }, [categoryData]);

  const subcategories = useMemo(() => {
    const payload = subcategoryData?.data || subcategoryData || {};
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.subcategories)) return payload.subcategories;
    if (Array.isArray(payload.rows)) return payload.rows;
    return [];
  }, [subcategoryData]);

  const filteredCategories = useMemo(() => {
    const keyword = categorySearch.trim().toLowerCase();
    if (!keyword) return categories;

    return categories.filter((item) =>
      item.name?.toLowerCase().includes(keyword),
    );
  }, [categories, categorySearch]);

  const filteredSubcategories = useMemo(() => {
    const keyword = subcategorySearch.trim().toLowerCase();
    if (!keyword) return subcategories;

    return subcategories.filter(
      (item) =>
        item.name?.toLowerCase().includes(keyword) ||
        item.category_name?.toLowerCase().includes(keyword),
    );
  }, [subcategories, subcategorySearch]);

  const refreshAll = () => {
    refetchCategories();
    refetchSubcategories();
  };

  const resetCategoryForm = () => {
    setCategoryForm({ id: "", name: "" });
  };

  const resetSubcategoryForm = () => {
    setSubcategoryForm({ id: "", category_id: "", name: "" });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();

    if (!categoryForm.name.trim()) {
      showToast({
        type: "error",
        message: "Category name is required.",
        duration: 3000,
      });
      return;
    }

    try {
      await saveCategorySubmit({
        id: categoryForm.id,
        name: categoryForm.name.trim(),
      });

      showToast({
        type: "success",
        message: categoryForm.id ? "Category updated." : "Category added.",
        duration: 3000,
      });

      resetCategoryForm();
      refreshAll();
    } catch (err) {
      showToast({
        type: "error",
        message: err?.message || "Failed to save category.",
        duration: 4000,
      });
    }
  };

  const handleSaveSubcategory = async (e) => {
    e.preventDefault();

    if (!subcategoryForm.category_id) {
      showToast({
        type: "error",
        message: "Please select a category.",
        duration: 3000,
      });
      return;
    }

    if (!subcategoryForm.name.trim()) {
      showToast({
        type: "error",
        message: "Subcategory name is required.",
        duration: 3000,
      });
      return;
    }

    try {
      await saveSubcategorySubmit({
        id: subcategoryForm.id,
        category_id: subcategoryForm.category_id,
        name: subcategoryForm.name.trim(),
      });

      showToast({
        type: "success",
        message: subcategoryForm.id
          ? "Subcategory updated."
          : "Subcategory added.",
        duration: 3000,
      });

      resetSubcategoryForm();
      refreshAll();
    } catch (err) {
      showToast({
        type: "error",
        message: err?.message || "Failed to save subcategory.",
        duration: 4000,
      });
    }
  };

  const handleDeleteCategory = async (row) => {
    if (!window.confirm(`Delete category "${row.name}"?`)) return;

    try {
      await deleteCategorySubmit({ id: row.id });

      showToast({
        type: "success",
        message: "Category deleted.",
        duration: 3000,
      });

      if (Number(categoryForm.id) === Number(row.id)) resetCategoryForm();
      refreshAll();
    } catch (err) {
      showToast({
        type: "error",
        message: err?.message || "Failed to delete category.",
        duration: 4000,
      });
    }
  };

  const handleDeleteSubcategory = async (row) => {
    if (!window.confirm(`Delete subcategory "${row.name}"?`)) return;

    try {
      await deleteSubcategorySubmit({ id: row.id });

      showToast({
        type: "success",
        message: "Subcategory deleted.",
        duration: 3000,
      });

      if (Number(subcategoryForm.id) === Number(row.id)) resetSubcategoryForm();
      refreshAll();
    } catch (err) {
      showToast({
        type: "error",
        message: err?.message || "Failed to delete subcategory.",
        duration: 4000,
      });
    }
  };

  const categoryColumns = [
    {
      header: "Category",
      render: (row) => (
        <div>
          <p className="text-sm font-bold text-slate-950">{row.name}</p>
          <p className="text-xs text-slate-500">ID #{row.id}</p>
        </div>
      ),
    },
    {
      header: "Subcategories",
      render: (row) => (
        <span className="text-sm font-semibold text-slate-700">
          {row.subcategory_count || 0}
        </span>
      ),
    },
    {
      header: "Products",
      render: (row) => (
        <span className="text-sm font-semibold text-slate-700">
          {row.product_count || 0}
        </span>
      ),
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
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setCategoryForm({ id: row.id, name: row.name })}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            <FiEdit2 />
            Edit
          </button>

          <button
            type="button"
            disabled={deletingCategory}
            onClick={() => handleDeleteCategory(row)}
            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            <FiTrash2 />
            Delete
          </button>
        </div>
      ),
    },
  ];

  const subcategoryColumns = [
    {
      header: "Subcategory",
      render: (row) => (
        <div>
          <p className="text-sm font-bold text-slate-950">{row.name}</p>
          <p className="text-xs text-slate-500">ID #{row.id}</p>
        </div>
      ),
    },
    {
      header: "Category",
      render: (row) => (
        <span className="text-sm font-semibold text-slate-700">
          {row.category_name || "-"}
        </span>
      ),
    },
    {
      header: "Products",
      render: (row) => (
        <span className="text-sm font-semibold text-slate-700">
          {row.product_count || 0}
        </span>
      ),
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
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              setSubcategoryForm({
                id: row.id,
                category_id: row.category_id,
                name: row.name,
              })
            }
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            <FiEdit2 />
            Edit
          </button>

          <button
            type="button"
            disabled={deletingSubcategory}
            onClick={() => handleDeleteSubcategory(row)}
            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            <FiTrash2 />
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-secondary">
                <FiGrid className="text-xl" />
              </span>

              <div>
                <h1 className="text-xl font-bold text-slate-950">
                  Manage Categories
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Add, update, and organize marketplace categories.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={refreshAll}
              disabled={categoryLoading || subcategoryLoading}
              className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <FiRefreshCw
                className={
                  categoryLoading || subcategoryLoading ? "animate-spin" : ""
                }
              />
              Refresh
            </button>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <form
            onSubmit={handleSaveCategory}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiGrid className="text-secondary" />
                <h2 className="text-sm font-bold text-slate-950">
                  {categoryForm.id ? "Edit Category" : "Add Category"}
                </h2>
              </div>

              {categoryForm.id && (
                <button
                  type="button"
                  onClick={resetCategoryForm}
                  className="text-slate-400 hover:text-red-500"
                >
                  <FiX />
                </button>
              )}
            </div>

            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Category Name
            </label>

            <input
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Example: Fruits"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-secondary focus:bg-white"
            />

            <button
              type="submit"
              disabled={savingCategory}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 sm:w-auto"
            >
              {savingCategory ? (
                <FiRefreshCw className="animate-spin" />
              ) : (
                <FiSave />
              )}
              {categoryForm.id ? "Update Category" : "Add Category"}
            </button>
          </form>

          <form
            onSubmit={handleSaveSubcategory}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiLayers className="text-secondary" />
                <h2 className="text-sm font-bold text-slate-950">
                  {subcategoryForm.id ? "Edit Subcategory" : "Add Subcategory"}
                </h2>
              </div>

              {subcategoryForm.id && (
                <button
                  type="button"
                  onClick={resetSubcategoryForm}
                  className="text-slate-400 hover:text-red-500"
                >
                  <FiX />
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Category
                </label>

                <select
                  value={subcategoryForm.category_id}
                  onChange={(e) =>
                    setSubcategoryForm((prev) => ({
                      ...prev,
                      category_id: e.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-secondary focus:bg-white"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Subcategory Name
                </label>

                <input
                  value={subcategoryForm.name}
                  onChange={(e) =>
                    setSubcategoryForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Example: Banana"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-secondary focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSubcategory}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 sm:w-auto"
            >
              {savingSubcategory ? (
                <FiRefreshCw className="animate-spin" />
              ) : (
                <FiPlusCircle />
              )}
              {subcategoryForm.id ? "Update Subcategory" : "Add Subcategory"}
            </button>
          </form>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    Category List
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {filteredCategories.length} categories shown
                  </p>
                </div>

                <SearchBox
                  value={categorySearch}
                  onChange={setCategorySearch}
                  placeholder="Search category..."
                />
              </div>
            </div>

            <div className="overflow-x-auto p-4">
              <AdminTable
                columns={categoryColumns}
                data={filteredCategories}
                loading={categoryLoading}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    Subcategory List
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {filteredSubcategories.length} subcategories shown
                  </p>
                </div>

                <SearchBox
                  value={subcategorySearch}
                  onChange={setSubcategorySearch}
                  placeholder="Search subcategory..."
                />
              </div>
            </div>

            <div className="overflow-x-auto p-4">
              <AdminTable
                columns={subcategoryColumns}
                data={filteredSubcategories}
                loading={subcategoryLoading}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative w-full sm:w-64">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-secondary focus:bg-white"
      />
    </div>
  );
}

export default AdminCategoryManager;
