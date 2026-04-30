import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBox, FaCog, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { PiShoppingCartSimpleFill } from "react-icons/pi";
import { icons } from "../../constant/icons";

function SidebarAdmin() {
  const navigate = useNavigate();

  // ✅ SEPARATE STATES
  const [openVendor, setOpenVendor] = useState(false);
  const [openCustomer, setOpenCustomer] = useState(false);

  const go = (path) => {
    navigate(path);
  };

  return (
    <div className="w-[260px] h-screen bg-secondary text-white flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="h-[70px] flex flex-col justify-center items-center px-4 mb-5 border-b border-white/10">
        <h2
          onClick={() => navigate("/")}
          className="flex items-center font-bold text-xl tracking-wide cursor-pointer"
        >
          OSY <PiShoppingCartSimpleFill /> SO
        </h2>
        <span className="text-xs text-gray-200">Admin Panel</span>
      </div>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {/* DASHBOARD */}
        <button
          onClick={() => go("/vendor")}
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition"
        >
          <FaBox className="text-sm" />
          Dashboard
        </button>

        {/* ===================== VENDOR ===================== */}
        <button
          onClick={() => setOpenVendor(!openVendor)}
          className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/10 transition"
        >
          <div className="flex items-center gap-2">
            <icons.BiSolidShoppingBags className="text-lg" />
            Vendor
          </div>

          {openVendor ? <FaChevronDown /> : <FaChevronRight />}
        </button>

        <div
          className={`flex flex-col pl-6 overflow-hidden transition-all duration-300 ${
            openVendor ? "max-h-40 mt-1" : "max-h-0"
          }`}
        >
          <button
            onClick={() => go("/admin/active-vendors")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10"
          >
            Active Vendor
          </button>

          <button
            onClick={() => go("/vendor/inactive")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10"
          >
            Not Active Vendor
          </button>
        </div>

        {/* ===================== CUSTOMER ===================== */}
        <button
          onClick={() => setOpenCustomer(!openCustomer)}
          className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/10 transition"
        >
          <div className="flex items-center gap-2">
            <icons.HiUserGroup className="text-lg" />
            Customer
          </div>

          {openCustomer ? <FaChevronDown /> : <FaChevronRight />}
        </button>

        <div
          className={`flex flex-col pl-6 overflow-hidden transition-all duration-300 ${
            openCustomer ? "max-h-40 mt-1" : "max-h-0"
          }`}
        >
          <button
            onClick={() => go("/customer/active")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10"
          >
            Active Customers
          </button>

          <button
            onClick={() => go("/customer/inactive")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10"
          >
            Not Active Customers
          </button>
        </div>

        {/* SALES */}
        <button
          onClick={() => go("/vendor/sales")}
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition"
        >
          <icons.FiTrendingUp />
          Sales
        </button>

        {/* PRODUCTS */}
        <button
          onClick={() => go("/vendor/products")}
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition"
        >
          <FaBox />
          Products
        </button>

        {/* SETTINGS */}
        <button
          onClick={() => go("/vendor/settings")}
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition"
        >
          <FaCog />
          Settings
        </button>
      </div>

      {/* FOOTER */}
      <div className="p-3 text-center text-xs text-white/60 border-t border-white/10">
        © OSYUSO Admin
      </div>
    </div>
  );
}

export default SidebarAdmin;
