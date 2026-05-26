import React, { useState } from "react";
import { RxDashboard } from "react-icons/rx";
import { icons } from "../../constant/icons";

import {
  FiTrendingUp,
  FiShoppingCart,
  FiUsers,
  FiBox,
  FiLogOut,
} from "react-icons/fi";
import { LuCircleUserRound } from "react-icons/lu";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

import VendorSalesOverview from "../organisms/VendorSalesOverview";
import NotificationDropdown from "../organisms/NotificationDropdown";

function DashboardVendor() {
  const navigate = useNavigate();

  const [openUserMenu, setOpenUserMenu] = useState(false);

  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-full w-full flex-col gap-4 bg-gray-100 p-4">
      <div className="flex h-20 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-6 shadow-sm">
        <h1 className="flex items-center text-lg font-bold text-slate-950">
          <RxDashboard className="mr-2 inline-block text-2xl text-secondary" />
          DASHBOARD
        </h1>

        <div className="flex items-center gap-3">
          <NotificationDropdown
            onOpen={() => setOpenUserMenu(false)}
            notificationPath="/vendor/notifications"
          />

          <div className="relative">
            <button
              onClick={() => setOpenUserMenu((value) => !value)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-secondary/30"
            >
              <icons.HiMiniUserCircle className="text-3xl text-slate-500" />

              <span className="max-w-32 truncate text-sm font-semibold">
                {user?.fullname?.split(" ")[0] || "User"}
              </span>

              <icons.MdKeyboardArrowDown
                className={`text-lg transition ${
                  openUserMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {openUserMenu && (
              <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-xl shadow-slate-900/10">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Signed in as
                  </p>

                  <p className="mt-1 truncate text-sm font-bold text-slate-900">
                    {user?.fullname || "User"}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {user?.email || "No email"}
                  </p>
                </div>

                <div className="p-1.5">
                  <button
                    onClick={() => {
                      navigate("/account");
                      setOpenUserMenu(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <LuCircleUserRound className="text-lg" />
                    </span>

                    <span>
                      <span className="block text-sm font-semibold">
                        My Account
                      </span>
                      <span className="block text-xs text-slate-500">
                        View profile settings
                      </span>
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      navigate("/signin");
                    }}
                    className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                      <FiLogOut className="text-lg" />
                    </span>

                    <span>
                      <span className="block text-sm font-semibold">
                        Logout
                      </span>
                      <span className="block text-xs text-red-400">
                        End current session
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
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
