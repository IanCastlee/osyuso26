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

function SidebarVendor() {
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
          onClick={() => navigate("/")}
          className="flex items-center font-bold text-xl md:text-[24px] tracking-wide cursor-pointer"
        >
          OSY <PiShoppingCartSimpleFill /> SO
        </h2>
        <span className="text-sm text-gray-100">Vendor Panel</span>
      </div>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {/* HOME */}
        <button
          onClick={() => go("/vendor")}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition min-w-0"
        >
          <FaBox />
          <span className="truncate">Dashboard</span>
        </button>
        {/* PRODUCTS */}
        <button
          onClick={() => go("/vendor/vendor-products")}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition min-w-0"
        >
          <FaBox />
          <span className="truncate">Products</span>
        </button>

        {/* DASHBOARD / RESERVATION */}
        <button
          onClick={() => setOpenReservation(!openReservation)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/10 transition min-w-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FaClipboardList />
            <span className="truncate">Reservation</span>
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
            onClick={() => go("/vendor/reserved")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition min-w-0"
          >
            <span className="truncate">Reserved</span>
          </button>

          <button
            onClick={() => go("/vendor/reservation-log")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition min-w-0"
          >
            <span className="truncate">Order History</span>
          </button>
        </div>

        {/* FEATURED PROMOTION */}

        <button
          onClick={() => setOpenReservation(!openReservation)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/10 transition min-w-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FaClipboardList />
            <span className="truncate">Featured Promotion</span>
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
            onClick={() => go("/vendor/featured-promotion")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition min-w-0"
          >
            <span className="truncate">Manage Promotions</span>
          </button>

          <button
            onClick={() => go("/vendor/featured-promotion-logs")}
            className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition min-w-0"
          >
            <span className="truncate">Promotion Logs</span>
          </button>
        </div>

        {/* SETTINGS */}
        <button
          onClick={() => go("/vendor/market-settings")}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition min-w-0"
        >
          <FaCog />
          <span className="truncate">Market Settings</span>
        </button>
      </div>

      {/* FOOTER */}
      <div className="p-3 text-center text-xs text-white/60 border-t border-white/10">
        © OSYUSO Vendor
      </div>
    </div>
  );
}

export default SidebarVendor;
