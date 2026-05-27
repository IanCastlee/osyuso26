import React, { useMemo, useState } from "react";
import { RxDashboard } from "react-icons/rx";
import { icons } from "../../constant/icons";

import {
  FiBox,
  FiDollarSign,
  FiShoppingCart,
  FiTrendingUp,
} from "react-icons/fi";
import { LuPhilippinePeso } from "react-icons/lu";

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
      <div className="flex h-20 w-full items-center justify-between rounded-lg bg-white px-6 shadow">
        <h1 className="flex items-center text-lg font-bold">
          <RxDashboard className="mr-1 inline-block text-2xl" />
          ADMIN DASHBOARD
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
