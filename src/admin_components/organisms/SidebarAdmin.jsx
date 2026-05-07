import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBox,
  FaCog,
  FaClipboardList,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import { PiShoppingCartSimpleFill } from "react-icons/pi";

function SidebarAdmin() {
  const navigate = useNavigate();

  const [openReservation, setOpenReservation] = useState(false);

  const go = (path) => {
    navigate(path);
  };

  return (
    <div className="w-[260px] h-screen bg-secondary text-white flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="h-[70px] flex flex-col justify-center  items-center px-4 mb-5  border-b border-white/10">
        <h2
          onClick={() => navigate("/admin")}
          className="flex items-center font-bold text-xl md:text-[24px] tracking-wide cursor-pointer"
        >
          OSY <PiShoppingCartSimpleFill /> SO
        </h2>
        <span className="text-sm text-gray-100">Admin Panel</span>
      </div>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {/* HOME */}
        <button
          onClick={() => go("/admin")}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition min-w-0"
        >
          <FaBox />
          <span className="truncate">Dashboard</span>
        </button>

        {/* _______________________________________SHOP______________________________________________ */}
        <button
          onClick={() => setOpenReservation(!openReservation)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/10 transition min-w-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FaClipboardList />
            <span className="truncate">Shop</span>
          </div>

          {openReservation ? <FaChevronDown /> : <FaChevronRight />}
        </button>

        {/* SUB MENU */}
        <div
          className={`flex flex-col pl-6 overflow-hidden transition-all duration-300 min-w-0 ${
            openReservation ? "max-h-40 mt-1" : "max-h-0"
          }`}
        >
          <button
            onClick={() => go("/admin/active-shop")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition min-w-0"
          >
            <span className="truncate">Active Shop</span>
          </button>

          <button
            onClick={() => go("/admin/not-active-shop")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition min-w-0"
          >
            <span className="truncate">Not Active Shop</span>
          </button>
        </div>

        {/* _______________________________________CUSTOMER______________________________________________ */}
        <button
          // onClick={() => setOpenReservation(!openReservation)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/10 transition min-w-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FaClipboardList />
            <span className="truncate">Customer</span>
          </div>

          {openReservation ? <FaChevronDown /> : <FaChevronRight />}
        </button>

        {/* SUB MENU */}
        <div
          className={`flex flex-col pl-6 overflow-hidden transition-all duration-300 min-w-0 ${
            openReservation ? "max-h-0 mt-1" : "max-h-0"
          }`}
        >
          <button
            onClick={() => go("/admin/verified-account")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition min-w-0"
          >
            <span className="truncate">Verified Account</span>
          </button>

          <button
            onClick={() => go("/admin/not-verified-account")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition min-w-0"
          >
            <span className="truncate">Not Verified Account</span>
          </button>

          <button
            onClick={() => go("/admin/not-active-account")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition min-w-0"
          >
            <span className="truncate">Not Active Account</span>
          </button>
        </div>

        {/* _______________________________________CATEGORIES______________________________________________ */}
        <button
          // onClick={() => setOpenReservation(!openReservation)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/10 transition min-w-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FaClipboardList />
            <span className="truncate">Categories</span>
          </div>

          {openReservation ? <FaChevronDown /> : <FaChevronRight />}
        </button>

        {/* SUB MENU */}
        <div
          className={`flex flex-col pl-6 overflow-hidden transition-all duration-300 min-w-0 ${
            openReservation ? "max-h-0 mt-1" : "max-h-0"
          }`}
        >
          <button
            onClick={() => go("/admin/main-categories")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition min-w-0"
          >
            <span className="truncate">Main Categories</span>
          </button>

          <button
            onClick={() => go("/admin/sub-categories")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition min-w-0"
          >
            <span className="truncate">Sub Categories</span>
          </button>
        </div>

        {/* _______________________________________SALES______________________________________________ */}
        <button
          onClick={() => setOpenReservation(!openReservation)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/10 transition min-w-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FaClipboardList />
            <span className="truncate">Sales</span>
          </div>

          {openReservation ? <FaChevronDown /> : <FaChevronRight />}
        </button>

        {/* SUB MENU */}
        <div
          className={`flex flex-col pl-6 overflow-hidden transition-all duration-300 min-w-0 ${
            openReservation ? "max-h-40 mt-1" : "max-h-0"
          }`}
        >
          <button
            onClick={() => go("/admin/todays-sales")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition min-w-0"
          >
            <span className="truncate">Today's Sales</span>
          </button>

          <button
            onClick={() => go("/admin/sales-log")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition min-w-0"
          >
            <span className="truncate">Sales Log</span>
          </button>
        </div>

        {/* _______________________________________PAYOUT______________________________________________ */}
        <button
          onClick={() => setOpenReservation(!openReservation)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/10 transition min-w-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FaClipboardList />
            <span className="truncate">Payout</span>
          </div>

          {openReservation ? <FaChevronDown /> : <FaChevronRight />}
        </button>

        {/* SUB MENU */}
        <div
          className={`flex flex-col pl-6 overflow-hidden transition-all duration-300 min-w-0 ${
            openReservation ? "max-h-40 mt-1" : "max-h-0"
          }`}
        >
          <button
            onClick={() => go("/admin/payout")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition min-w-0"
          >
            <span className="truncate">Payout</span>
          </button>

          <button
            onClick={() => go("/admin/payout-log")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition min-w-0"
          >
            <span className="truncate">Payout History</span>
          </button>
        </div>

        {/* _______________________________________PRODOCT MANAGEMENT______________________________________________ */}
        <button
          onClick={() => setOpenReservation(!openReservation)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/10 transition min-w-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FaClipboardList />
            <span className="truncate">About Product</span>
          </div>

          {openReservation ? <FaChevronDown /> : <FaChevronRight />}
        </button>

        {/* SUB MENU */}
        <div
          className={`flex flex-col pl-6 overflow-hidden transition-all duration-300 min-w-0 ${
            openReservation ? "max-h-40 mt-1" : "max-h-0"
          }`}
        >
          <button
            onClick={() => go("/admin/products")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition min-w-0"
          >
            <span className="truncate">Products</span>
          </button>

          <button
            onClick={() => go("/admin/special-offer")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition min-w-0"
          >
            <span className="truncate">Special Offer</span>
          </button>

          <button
            onClick={() => go("/admin/new-arrival")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition min-w-0"
          >
            <span className="truncate">New Arrival</span>
          </button>
        </div>

        {/* SETTINGS */}
        <button
          onClick={() => go("/vendor/settings")}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition min-w-0"
        >
          <FaCog />
          <span className="truncate">Settings</span>
        </button>
      </div>

      {/* FOOTER */}
      <div className="p-3 text-center text-xs text-white/60 border-t border-white/10">
        © OSYUSO Vendor
      </div>
    </div>
  );
}

export default SidebarAdmin;
