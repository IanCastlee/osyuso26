import React, { useState } from "react";
import { RxDashboard } from "react-icons/rx";
import { LuCircleUserRound } from "react-icons/lu";
import { icons } from "../../constant/icons";

import { FiTrendingUp, FiShoppingCart, FiUsers, FiBox } from "react-icons/fi";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function DashboardAdmin() {
  const navigate = useNavigate();

  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [active, setActive] = useState("Daily");

  //  AUTH
  const { user, logout } = useAuth();

  // Dummy Data
  const dataMap = {
    Daily: [
      { name: "Mon", income: 1200 },
      { name: "Tue", income: 1800 },
      { name: "Wed", income: 900 },
      { name: "Thu", income: 2000 },
      { name: "Fri", income: 2400 },
      { name: "Sat", income: 3000 },
      { name: "Sun", income: 2800 },
    ],
    Weekly: [
      { name: "Week 1", income: 12000 },
      { name: "Week 2", income: 15000 },
      { name: "Week 3", income: 10000 },
      { name: "Week 4", income: 18000 },
    ],
    Monthly: [
      { name: "Jan", income: 40000 },
      { name: "Feb", income: 30000 },
      { name: "Mar", income: 50000 },
      { name: "Apr", income: 45000 },
    ],
    Annual: [
      { name: "2021", income: 400000 },
      { name: "2022", income: 520000 },
      { name: "2023", income: 610000 },
      { name: "2024", income: 720000 },
    ],
  };

  const data = dataMap[active];

  return (
    <div className="w-full min-h-full p-4 flex flex-col gap-4 bg-gray-100">
      <div className="bg-white rounded-lg w-full h-20 flex justify-between items-center px-6 shadow">
        <h1 className="flex items-center text-lg font-bold">
          <RxDashboard className="inline-block mr-1 text-2xl" />
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
            <div className="absolute right-0 mt-2 w-44 bg-white text-black rounded-md shadow-lg overflow-hidden z-50">
              <button
                onClick={() => {
                  navigate("/account");
                  setOpenUserMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                My Account
              </button>

              <button
                onClick={() => {
                  logout();
                  navigate("/signin");
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      {/* CARDS */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* CARD */}
        <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-3">
          <div className="p-3 rounded-lg bg-green-100 text-green-600">
            <FiTrendingUp className="text-lg" />
          </div>

          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Total Sales</p>
            <h2 className="text-sm sm:text-lg font-bold text-primary">
              ₱120,000
            </h2>
          </div>
        </div>

        {/* CARD */}
        <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
            <FiShoppingCart className="text-lg" />
          </div>

          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Orders</p>
            <h2 className="text-sm sm:text-lg font-bold text-primary">320</h2>
          </div>
        </div>

        {/* CARD */}
        <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-3">
          <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
            <FiUsers className="text-lg" />
          </div>

          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Customers</p>
            <h2 className="text-sm sm:text-lg font-bold text-primary">150</h2>
          </div>
        </div>

        {/* CARD */}
        <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-3">
          <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
            <FiBox className="text-lg" />
          </div>

          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Products</p>
            <h2 className="text-sm sm:text-lg font-bold text-primary">45</h2>
          </div>
        </div>
      </div>

      {/* GRAPH */}
      <div className="bg-white p-4 rounded-lg shadow">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-primary">Income Overview</h2>

          {/* FILTER BUTTONS */}
          <div className="flex gap-2 text-xs">
            {["Daily", "Weekly", "Monthly", "Annual"].map((item) => (
              <button
                key={item}
                onClick={() => setActive(item)}
                className={`px-3 py-1 rounded-full transition ${
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

        {/* CHART */}
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="income"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default DashboardAdmin;
