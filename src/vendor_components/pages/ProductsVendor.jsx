import React, { useState } from "react";
import { FaBox } from "react-icons/fa";
import Table from "../organisms/Table";
import { IoMdTrash } from "react-icons/io";
import { FiEdit } from "react-icons/fi";
import AddVendorProduct_Form from "../molecules/AddVendorProduct_Form";

function ProductsVendor() {
  const [openForm, setOpenForm] = useState(false);
  const columns = [
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
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 text-xs rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
            <FiEdit className="text-lg" />
          </button>
          <button className="px-3 py-1 text-xs rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition">
            <IoMdTrash className="text-lg" />
          </button>
        </div>
      ),
    },
  ];

  const data = [
    { name: "Pork Belly", price: 280, stock: 20 },
    { name: "Chicken Breast", price: 220, stock: 15 },
    { name: "Beef Steak", price: 350, stock: 10 },
  ];

  return (
    <div className="w-full min-h-full p-4 flex flex-col gap-4 bg-gray-100">
      {/* HEADER */}
      <div className="bg-white rounded-lg w-full h-15 flex justify-between items-center px-6 shadow">
        {/* TITLE */}
        <h1 className="flex items-center text-lg font-bold">
          <FaBox className="mr-1 text-2xl text-secondary" />
          Products
        </h1>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-2">
          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search product..."
            className="border border-gray-200 rounded-md px-3 py-2 text-xs outline-none focus:border-secondary transition w-[180px]"
          />

          {/* ADD BUTTON */}
          <button
            onClick={() => setOpenForm(true)}
            className="bg-green-500 text-white text-xs px-3 py-2 rounded-md hover:bg-green-600 transition"
          >
            + Add Product
          </button>
        </div>
      </div>
      {/* TABLE */}
      <div className="bg-white rounded-lg shadow p-4">
        <Table columns={columns} data={data} />
      </div>

      {/* //ADD PRODUCT FORM */}
      {openForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-4 relative">
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setOpenForm(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-red-500"
            >
              ✕
            </button>

            {/* FORM */}
            <AddVendorProduct_Form />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductsVendor;
