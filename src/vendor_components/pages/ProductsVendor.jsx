import React, { useEffect, useState, useMemo } from "react";
import { FaBox } from "react-icons/fa";
import { IoMdTrash } from "react-icons/io";
import { FiEdit } from "react-icons/fi";

import AddVendorProduct_Form from "../molecules/AddVendorProduct_Form";
import VendorTable from "../organisms/VendorTable";
import useGetData from "../../hooks/useGetData";
import noImage from "../../assets/assets_osyuso/no-image.png";
import { icons } from "../../constant/icons";

function ProductsVendor() {
  const [openForm, setOpenForm] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);

  // cursor (LAST SEEN ID)
  const [cursor, setCursor] = useState(null);

  // pagination history stack (for PREV)
  const [history, setHistory] = useState([]);

  // build query (PRODUCTION SAFE)
  const query = useMemo(() => {
    const q = new URLSearchParams();

    q.append("limit", limit);

    if (search) q.append("search", search);

    if (cursor) q.append("cursor", cursor);

    return q.toString();
  }, [limit, search, cursor]);

  const { data, loading } = useGetData(`product/get-products.php?${query}`);

  const products = data?.rows || [];
  const hasMore = data?.has_more;
  const nextCursor = data?.next_cursor;

  // ================= LAST SEEN DEBUG =================
  const lastSeen = products?.at(-1)?.id;

  // ================= SEARCH RESET =================
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

  console.log(data);

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
          src={row.image || noImage}
          className="w-8 h-8 object-cover rounded"
        />
      ),
    },
    {
      header: "Product Name",
      accessor: "name",
    },
    {
      header: "Price",
      render: (row) => `₱${row.price}`,
    },
    {
      header: "Stock",
      accessor: "stock",
    },
    {
      header: "Action",
      render: () => (
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded">
            <FiEdit className="text-lg" />
          </button>
          <button className="px-3 py-1  bg-red-50 text-red-600 rounded">
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
          Products
        </h1>

        {/* ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* SEARCH */}
          <div className="flex flex-col">
            <span className="text-secondary text-[10px] italic">
              Search Product Name :
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="border border-gray-200 px-3 py-2 text-xs rounded-lg"
            />
          </div>

          {/* LIMIT */}
          <div className="flex flex-col">
            <span className="text-secondary text-[10px] italic">
              Rows Count
            </span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="border border-gray-200 px-3 py-2 text-xs rounded-lg"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* ADD BUTTON */}
          <div className="flex flex-col">
            <span className="text-secondary text-[10px] italic">:</span>
            <button
              onClick={() => setOpenForm(true)}
              className="bg-green-500 hover:bg-green-600 text-white text-xs px-4 py-2 rounded-lg transition"
            >
              + Add Product
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow p-4">
        <VendorTable columns={columns} data={products} loading={loading} />
      </div>

      {/* PAGINATION */}
      <div className="flex justify-end gap-10 items-center">
        <button
          onClick={handlePrev}
          disabled={history.length === 0}
          className="flex items-center px-4 py-1 text-xs border rounded disabled:opacity-40"
        >
          <icons.MdOutlineChevronLeft /> Prev
        </button>

        <button
          onClick={handleNext}
          disabled={!hasMore}
          className="flex items-center px-4 py-1 text-xs border rounded disabled:opacity-40"
        >
          Next <icons.MdOutlineChevronRight />
        </button>
      </div>

      {/* MODAL */}
      {openForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-full max-w-2xl p-4 rounded-xl relative">
            <button
              onClick={() => setOpenForm(false)}
              className="absolute top-3 right-3 z-10 bg-white text-black rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-gray-200"
            >
              ✕
            </button>

            <AddVendorProduct_Form />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductsVendor;
