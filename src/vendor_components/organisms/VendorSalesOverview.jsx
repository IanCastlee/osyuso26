import React, { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FiShoppingCart, FiTrendingUp, FiPercent } from "react-icons/fi";
import useGetData from "../../hooks/useGetData";

function VendorSalesOverview() {
  const [active, setActive] = useState("Daily");

  const rangeMap = {
    Daily: "daily",
    Weekly: "weekly",
    Monthly: "monthly",
    Annual: "annual",
  };

  const { data, loading, error } = useGetData(
    `payout/get-vendor-sales-chart.php?range=${rangeMap[active]}`,
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
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-primary">Sales Overview</h2>
          <p className="text-xs text-gray-500">
            Based on paid vendor earnings.
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

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4">
          <span className="rounded-lg bg-green-100 p-2 text-green-700">
            <FiTrendingUp />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase text-green-600">
              Gross Sales
            </p>
            <p className="text-lg font-bold text-green-700">
              {formatMoney(summary.gross_sales)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4">
          <span className="rounded-lg bg-red-100 p-2 text-red-700">
            <FiPercent />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase text-red-500">
              Platform Fee
            </p>
            <p className="text-lg font-bold text-red-700">
              -{formatMoney(summary.platform_fee)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4">
          <span className="rounded-lg bg-blue-100 p-2 text-blue-700">
            <FiShoppingCart />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase text-blue-600">
              Orders
            </p>
            <p className="text-lg font-bold text-blue-700">
              {summary.orders_count || 0}
            </p>
          </div>
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
            No sales data yet.
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
                dataKey="net"
                name="Net Income"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default VendorSalesOverview;
