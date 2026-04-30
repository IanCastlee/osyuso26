import React from "react";
import { IoMdTrash } from "react-icons/io";
import { FiEdit } from "react-icons/fi";
import { icons } from "../../constant/icons";
import Table from "../organisms/Table";

function ActiveVendor() {
  const columns = [
    {
      header: (
        <div className="flex items-center gap-2 text-gray-600">
          <icons.CiShop className="text-lg" />
          <span>Shop Name</span>
        </div>
      ),
      accessor: "shop",
    },
    {
      header: (
        <div className="flex items-center gap-2 text-gray-600">
          <icons.CiUser className="text-lg" />
          <span>Owner</span>
        </div>
      ),
      accessor: "owner",
    },
    {
      header: (
        <div className="flex items-center gap-2 text-gray-600">
          <icons.CiLocationOn className="text-lg" />
          <span>Location</span>
        </div>
      ),
      accessor: "location",
    },
    {
      header: (
        <div className="flex items-center gap-2 text-gray-600">
          <icons.CiCircleInfo className="text-lg" />
          <span>Status</span>
        </div>
      ),
      accessor: "status",
      render: (row) => (
        <span
          className={`text-xs px-3 py-1 rounded-full font-medium ${
            row.status === "Active"
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-500"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: (
        <div className="flex items-center justify-end gap-2 text-gray-600">
          <icons.CiCalendar className="text-lg" />
          <span>Joined</span>
        </div>
      ),
      accessor: "joined",
      align: "right",
    },
    {
      header: (
        <div className="flex items-center justify-end gap-2 text-gray-600">
          <icons.CiSettings className="text-lg" />
          <span>Action</span>
        </div>
      ),
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button className="p-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
            <FiEdit className="text-sm" />
          </button>

          <button className="p-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition">
            <IoMdTrash className="text-sm" />
          </button>
        </div>
      ),
    },
  ];
  const data = [
    {
      shop: "Juan Meat Shop",
      owner: "Juan Dela Cruz",
      location: "Bulusan, Sorsogon",
      status: "Active",
      joined: "Jan 2024",
    },
    {
      shop: "Fresh Catch Seafood",
      owner: "Maria Santos",
      location: "Irosin, Sorsogon",
      status: "Active",
      joined: "Mar 2024",
    },
    {
      shop: "Green Farm Veggies",
      owner: "Pedro Reyes",
      location: "Juban, Sorsogon",
      status: "Active",
      joined: "Feb 2024",
    },
  ];

  return (
    <div className="w-full min-h-full p-4 flex flex-col gap-4 bg-gray-100">
      {/* HEADER */}
      <div className="bg-white rounded-lg w-full h-15 flex justify-between items-center px-6 shadow">
        <h1 className="flex items-center text-lg font-bold">
          <icons.BiSolidShoppingBags className="mr-1 text-2xl text-secondary" />
          Active Vendors
        </h1>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search vendor..."
            className="border border-gray-200 rounded-md px-3 py-2 text-xs outline-none focus:border-secondary transition w-[180px]"
          />

          <button className="bg-green-500 text-white text-xs px-3 py-2 rounded-md hover:bg-green-600 transition">
            + Add Vendor
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow p-4">
        <Table columns={columns} data={data} />
      </div>
    </div>
  );
}

export default ActiveVendor;
