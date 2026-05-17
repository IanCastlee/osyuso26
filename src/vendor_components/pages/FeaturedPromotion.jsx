import React, { useEffect, useState, useMemo } from "react";
import { FaBox, FaMoneyBill } from "react-icons/fa";
import { IoMdTrash } from "react-icons/io";
import { FiEdit } from "react-icons/fi";

import AddVendorProduct_Form from "../molecules/AddVendorProduct_Form";
import VendorTable from "../organisms/VendorTable";

import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";

import noImage from "../../assets/assets_osyuso/no-image.png";

import LoaderWithText from "../../reusable_components/LoaderWithText";
import InputField from "../atoms/InputField";
import AddFeaturedPromotion from "../molecules/AddFeaturedPromotion";
import { useToast } from "../../context/ToastContext";

function FeaturedPromotion() {
  const [openForm, setOpenForm] = useState(false);
  const { showToast } = useToast();

  // ================= FORM =================
  const [form, setForm] = useState({
    tag: "",
    title: "",
    description: "",
    start_date: "",
    expires_at: "",
  });
  const [preview, setPreview] = useState([]);
  const [images, setImages] = useState([]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    return () => {
      preview.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [preview]);

  // ================= SUBMIT =================
  const { submit, loading: submitLoading } = useFormSubmit(
    "promotion/add-feature-promotion.php",
    () => {
      showToast({
        type: "success",
        message: "Promotion submitted to the admin. Please wait for approval.",
        duration: 5000,
      });

      setForm({
        tag: "",
        title: "",
        description: "",
      });

      setPreview([]);
      setImages([]);
    },
  );

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ================= HANDLE IMAGE =================
  const handleImages = (e) => {
    const files = Array.from(e.target.files);

    setImages(files);

    const imagePreview = files.map((file) => URL.createObjectURL(file));

    setPreview(imagePreview);
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    // ================= VALIDATION =================
    if (!form.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!form.start_date) {
      newErrors.start_date = "Start date is required";
    }

    if (!form.expires_at) {
      newErrors.expires_at = "Expiration date is required";
    }

    // ================= DATE VALIDATION =================
    if (form.start_date && form.expires_at) {
      const start = new Date(form.start_date);
      const end = new Date(form.expires_at);

      if (end <= start) {
        newErrors.expires_at = "Expiration must be greater than start date";
      }
    }

    setErrors(newErrors);

    // STOP
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // ================= SUBMIT =================
    const formData = new FormData();

    formData.append("tag", form.tag);
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("start_date", form.start_date);
    formData.append("expires_at", form.expires_at);

    if (images[0]) {
      formData.append("image", images[0]);
    }

    await submit(formData);
  };
  // ================= FILTERS =================
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);

  // cursor
  const [cursor, setCursor] = useState(null);

  // history
  const [history, setHistory] = useState([]);

  // ================= QUERY =================
  const query = useMemo(() => {
    const q = new URLSearchParams();

    q.append("limit", limit);

    if (search) q.append("search", search);

    if (cursor) q.append("cursor", cursor);

    return q.toString();
  }, [limit, search, cursor]);

  const { data } = useGetData(
    `promotion/get-featured-promotions_v.php?${query}`,
  );

  const promotions = data?.rows || [];

  const nextCursor = data?.next_cursor;

  console.log("NEXT : ", nextCursor);

  // ================= RESET =================
  useEffect(() => {
    setCursor(null);
    setHistory([]);
  }, [search, limit]);

  // ================= NEXT =================
  const handleNext = () => {
    if (!nextCursor) return;

    setHistory((prev) => [...prev, cursor]);

    setCursor(nextCursor);
  };

  // ================= PREV =================
  const handlePrev = () => {
    if (history.length === 0) return;

    const updated = [...history];

    const prev = updated.pop();

    setHistory(updated);

    setCursor(prev || null);
  };

  // ================= TABLE =================
  const columns = [
    {
      header: "#",
      accessor: "id",
    },
    {
      header: "Image",
      render: (row) => (
        <img
          src={row.image_path || noImage}
          className="w-12 h-12 object-cover rounded-lg"
        />
      ),
    },
    {
      header: "Tag",
      accessor: "tag",
    },
    {
      header: "Title",
      accessor: "title",
    },
    {
      header: "Start Date",
      render: (row) =>
        new Date(row.start_date).toLocaleString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
    },
    {
      header: "Expires",
      render: (row) =>
        new Date(row.expires_at).toLocaleString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
    },
    {
      header: "Status",
      render: (row) => (
        <span
          className={`
          px-3 py-1 rounded-full text-xs font-semibold
          ${
            row.status === "approved"
              ? "bg-green-100 text-green-600"
              : row.status === "rejected"
                ? "bg-red-100 text-red-600"
                : "bg-yellow-100 text-yellow-700"
          }
        `}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Action",
      render: () => (
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg">
            <FiEdit className="text-lg" />
          </button>

          <button className="px-3 py-1 bg-red-50 text-red-600 rounded-lg">
            <IoMdTrash className="text-lg" />
          </button>
        </div>
      ),
    },
  ];
  return (
    <div className="w-full min-h-full p-4 flex flex-col gap-4 bg-gray-100">
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow px-4 py-4 flex flex-col lg:flex-row justify-between gap-3">
        {/* TITLE */}
        <h1 className="flex items-center text-lg font-bold">
          <FaBox className="mr-2 text-secondary text-2xl" />
          FEATURED PROMOTION
        </h1>
      </div>

      {/* FORM */}
      <AddFeaturedPromotion
        form={form}
        errors={errors}
        preview={preview}
        handleChange={handleChange}
        handleImages={handleImages}
        handleSubmit={handleSubmit}
        submitLoading={submitLoading}
      />
      {/* TABLE */}
      <div className="bg-white rounded-xl shadow px-4 py-4">
        <VendorTable columns={columns} data={promotions} />
        {/* PAGINATION */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={handlePrev}
            disabled={history.length === 0}
            className="px-4 py-2 text-xs bg-gray-100 rounded-md disabled:opacity-40"
          >
            Prev
          </button>

          <button
            onClick={handleNext}
            disabled={!nextCursor}
            className="px-4 py-2 text-xs bg-secondary text-white rounded-md disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeaturedPromotion;
