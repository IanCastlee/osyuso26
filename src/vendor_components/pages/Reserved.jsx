import React, { useState } from "react";
import { FaBox } from "react-icons/fa";
import { IoMdTrash } from "react-icons/io";
import { FiEdit } from "react-icons/fi";
import AddVendorProduct_Form from "../molecules/AddVendorProduct_Form";
import useGetData from "../../hooks/useGetData";
import VendorTable from "../organisms/VendorTable";

function Reserved() {
  const [openForm, setOpenForm] = useState(false);

  // ================= PAGINATION STATE =================
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // ================= FETCH DATA =================
  const { data, loading, refetch } = useGetData(
    `product/get-products.php?page=${page}&limit=${limit}`,
  );

  const columns = [
    {
      header: "Image",
      render: (row) => (
        <img
          src={row.image || "https://via.placeholder.com/40"}
          className="w-10 h-10 object-cover rounded"
        />
      ),
    },
    {
      header: "Product Name",
      accessor: "name",
    },
    {
      header: "Price",
      accessor: "price",
      render: (row) => `₱${row.price}`,
    },
    {
      header: "Stock",
      accessor: "stock",
    },
    {
      header: "Action",
      align: "right",
      render: () => (
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded">
            <FiEdit />
          </button>
          <button className="px-3 py-1 bg-red-50 text-red-600 rounded">
            <IoMdTrash />
          </button>
        </div>
      ),
    },
  ];

  const products = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
      ? data
      : [];

  console.log("DATA : ", data);

  return (
    <div className="w-full min-h-full p-4 flex flex-col gap-4 bg-gray-100">
      {/* HEADER */}
      <div className="bg-white rounded-lg h-15 flex justify-between items-center px-6 shadow">
        <h1 className="flex items-center text-lg font-bold">
          <FaBox className="mr-2 text-secondary text-2xl" />
          Reservation
        </h1>

        <div className="flex items-center gap-2">
          {/* LIMIT SELECT */}
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="border px-2 py-1 text-xs rounded"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <button
            onClick={() => setOpenForm(true)}
            className="bg-green-500 text-white text-xs px-3 py-2 rounded"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow p-4">
        <VendorTable columns={columns} data={products} />
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        <span className="text-xs">
          Page {page} of {data?.meta?.total_pages || 1}
        </span>

        <button
          disabled={page === data?.meta?.total_pages}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* FORM MODAL */}
      {openForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow p-4 relative">
            <button
              onClick={() => setOpenForm(false)}
              className="absolute top-2 right-3"
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

export default Reserved;
