import React, { useMemo, useState } from "react";
import { RxDashboard } from "react-icons/rx";
import { icons } from "../../constant/icons";

import {
  FiBox,
  FiDollarSign,
  FiShoppingCart,
  FiTrendingUp,
  FiLogOut,
} from "react-icons/fi";
import { LuPhilippinePeso } from "react-icons/lu";
import { LuCircleUserRound } from "react-icons/lu";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import useGetData from "../../hooks/useGetData";
import NotificationDropdown from "../organisms/NotificationDropdown";

function DashboardAdmin() {
  const navigate = useNavigate();

  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [active, setActive] = useState("Daily");

  const { user, logout } = useAuth();

  const rangeMap = {
    Daily: "daily",
    Weekly: "weekly",
    Monthly: "monthly",
    Annual: "annual",
  };

  const { data, loading, error } = useGetData(
    `dashboard/get-admin-revenue-chart.php?range=${rangeMap[active]}`,
  );

  const payload = useMemo(() => {
    return (
      data || {
        summary: {},
        rows: [],
      }
    );
  }, [data]);

  const summary = payload.summary || {};
  const chartRows = payload.rows || [];

  const formatMoney = (value) => {
    return `₱${Number(value || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

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
            notificationPath="/admin/notifications"
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
                      navigate("/admin/admin-account");
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
            <p className="text-[10px] text-gray-500 sm:text-xs">Gross Sales</p>
            <h2 className="text-sm font-bold text-primary sm:text-lg">
              {formatMoney(summary.gross_sales)}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
            <LuPhilippinePeso className="text-lg" />
          </div>

          <div>
            <p className="text-[10px] text-gray-500 sm:text-xs">
              Platform Revenue
            </p>
            <h2 className="text-sm font-bold text-primary sm:text-lg">
              {formatMoney(summary.platform_revenue)}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
            <FiShoppingCart className="text-lg" />
          </div>

          <div>
            <p className="text-[10px] text-gray-500 sm:text-xs">Paid Orders</p>
            <h2 className="text-sm font-bold text-primary sm:text-lg">
              {summary.orders_count || 0}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="rounded-lg bg-orange-100 p-3 text-orange-600">
            <FiBox className="text-lg" />
          </div>

          <div>
            <p className="text-[10px] text-gray-500 sm:text-xs">Net Released</p>
            <h2 className="text-sm font-bold text-primary sm:text-lg">
              {formatMoney(summary.net_released)}
            </h2>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-primary">Revenue Overview</h2>
            <p className="text-xs text-gray-500">
              Gross sales, platform fees, and vendor payouts.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {["Daily", "Weekly", "Monthly", "Annual"].map((item) => (
              <button
                key={item}
                onClick={() => setActive(item)}
                className={`rounded-full px-3 py-1 transition ${
                  active === item
                    ? "bg-secondary text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="h-[300px] w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              Loading chart...
            </div>
          ) : chartRows.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              No revenue data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartRows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => formatMoney(value)} />

                <Line
                  type="monotone"
                  dataKey="gross"
                  name="Gross Sales"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />

                <Line
                  type="monotone"
                  dataKey="platform_fee"
                  name="Platform Revenue"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />

                <Line
                  type="monotone"
                  dataKey="net_released"
                  name="Net Released"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardAdmin;
