import React, { useState } from "react";
import { RxDashboard } from "react-icons/rx";
import { icons } from "../../constant/icons";

import { FiTrendingUp, FiShoppingCart, FiUsers, FiBox } from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import VendorSalesOverview from "../organisms/VendorSalesOverview";

function DashboardVendor() {
  const navigate = useNavigate();

  const [openUserMenu, setOpenUserMenu] = useState(false);

  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-full w-full flex-col gap-4 bg-gray-100 p-4">
      <div className="flex h-20 w-full items-center justify-between rounded-lg bg-white px-6 shadow">
        <h1 className="flex items-center text-lg font-bold">
          <RxDashboard className="mr-1 inline-block text-2xl" />
          DASHBOARD
        </h1>

        <div className="relative">
          <div className="flex items-center gap-1">
            <icons.HiMiniUserCircle className="text-2xl" />
            <button
              onClick={() => setOpenUserMenu(!openUserMenu)}
              className="flex items-center font-semibold hover:opacity-80"
            >
              {user?.fullname?.split(" ")[0] || "User"}{" "}
              <icons.MdKeyboardArrowDown />
            </button>
          </div>

          {openUserMenu && (
            <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-md bg-white text-black shadow-lg">
              <button
                onClick={() => {
                  navigate("/account");
                  setOpenUserMenu(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100"
              >
                My Account
              </button>

              <button
                onClick={() => {
                  logout();
                  navigate("/signin");
                }}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="rounded-lg bg-green-100 p-3 text-green-600">
            <FiTrendingUp className="text-lg" />
          </div>

          <div>
            <p className="text-[10px] text-gray-500 sm:text-xs">Total Sales</p>
            <h2 className="text-sm font-bold text-primary sm:text-lg">
              ₱120,000
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
            <FiShoppingCart className="text-lg" />
          </div>

          <div>
            <p className="text-[10px] text-gray-500 sm:text-xs">Orders</p>
            <h2 className="text-sm font-bold text-primary sm:text-lg">320</h2>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
            <FiUsers className="text-lg" />
          </div>

          <div>
            <p className="text-[10px] text-gray-500 sm:text-xs">Customers</p>
            <h2 className="text-sm font-bold text-primary sm:text-lg">150</h2>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="rounded-lg bg-orange-100 p-3 text-orange-600">
            <FiBox className="text-lg" />
          </div>

          <div>
            <p className="text-[10px] text-gray-500 sm:text-xs">Products</p>
            <h2 className="text-sm font-bold text-primary sm:text-lg">45</h2>
          </div>
        </div>
      </div>

      <VendorSalesOverview />
    </div>
  );
}

export default DashboardVendor;
