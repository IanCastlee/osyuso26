import React, { useEffect, useMemo, useState } from "react";
import { FaBox, FaSearch } from "react-icons/fa";

import VendorTable from "../organisms/VendorTable";

import useGetData from "../../hooks/useGetData";

import noImage from "../../assets/assets_osyuso/no-image.png";
import { FiRefreshCw } from "react-icons/fi";

function FeaturedPromotionLogs() {
  // ================= FILTER =================
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);

  // ================= PAGINATION =================
  const [cursor, setCursor] = useState(null);
  const [history, setHistory] = useState([]);

  // ================= QUERY =================
  const query = useMemo(() => {
    const q = new URLSearchParams();

    q.append("limit", limit);

    if (search) {
      q.append("search", search);
    }

    if (cursor) {
      q.append("cursor", cursor);
    }

    return q.toString();
  }, [limit, search, cursor]);

  // ================= FETCH =================
  const { data, loading, refetch } = useGetData(
    `promotion/get-featured-promotions-logs_v.php?${query}`,
  );

  // ================= DATA =================
  const promotions = data?.rows || [];
  const nextCursor = data?.next_cursor;

  // ================= RESET =================
  useEffect(() => {
    setCursor(null);
    setHistory([]);
  }, [search, limit]);

  // ================= NEXT =================
  const handleNext = () => {
    if (!nextCursor) return;

    setHistory((prev) => [...prev, cursor]);

    setCursor(nextCursor);
  };

  // ================= PREV =================
  const handlePrev = () => {
    if (history.length === 0) return;

    const updated = [...history];

    const prev = updated.pop();

    setHistory(updated);

    setCursor(prev || null);
  };

  const handleRefresh = () => {
    setCursor(null);
    setHistory([]);
    refetch();
  };

  // ================= TABLE =================
  const columns = [
    {
      header: "#",
      accessor: "id",
    },
    {
      header: "Image",
      render: (row) => (
        <img
          src={row.image_path || noImage}
          alt="promotion"
          className="w-12 h-12 object-cover rounded-lg"
        />
      ),
    },
    {
      header: "Product ID",
      render: (row) => (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          #{row.product_id || "-"}
        </span>
      ),
    },
    {
      header: "Tag",
      accessor: "tag",
    },
    {
      header: "Title",
      accessor: "title",
    },
    {
      header: "Start Date",
      render: (row) =>
        new Date(row.start_date).toLocaleString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
    },
    {
      header: "Expires",
      render: (row) =>
        new Date(row.expires_at).toLocaleString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
    },
    {
      header: "Status",
      render: (row) => (
        <span
          className={`
            px-3 py-1 rounded-full text-xs font-semibold capitalize
            ${
              row.status === "approved"
                ? "bg-green-100 text-green-600"
                : row.status === "rejected"
                  ? "bg-red-100 text-red-600"
                  : "bg-yellow-100 text-yellow-700"
            }
          `}
        >
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="w-full min-h-full p-4 flex flex-col gap-4 bg-gray-100">
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow px-4 py-4 flex flex-col lg:flex-row justify-between gap-4">
        {/* TITLE */}
        <h1 className="flex items-center text-lg font-bold">
          <FaBox className="mr-2 text-secondary text-2xl" />
          FEATURED PROMOTION LOGS
        </h1>

        {/* FILTERS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* SEARCH */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search promotion..."
              className="
                border border-gray-200
                pl-8 pr-3 py-2
                text-xs
                rounded-lg
                outline-none
                focus:ring-2
                focus:ring-orange-300
              "
            />
          </div>

          {/* LIMIT */}
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="
              border border-gray-200
              px-3 py-2
              text-xs
              rounded-lg
              outline-none
              focus:ring-2
              focus:ring-orange-300
            "
          >
            <option value={1}>1 Rows</option>
            <option value={10}>10 Rows</option>
            <option value={20}>20 Rows</option>
            <option value={50}>50 Rows</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold ml-5 text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiRefreshCw
            className={`text-green-600 ${loading ? "animate-spin" : ""}`}
          />
          {loading ? "Refreshing..." : "Refresh Table"}
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow px-4 py-4">
        <VendorTable columns={columns} data={promotions} loading={loading} />

        {/* EMPTY */}
        {!loading && promotions.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-400">
            No promotions found.
          </div>
        )}

        {/* PAGINATION */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={handlePrev}
            disabled={history.length === 0}
            className="
              px-4 py-2
              text-xs
              bg-gray-100
              rounded-md
              disabled:opacity-40
            "
          >
            Prev
          </button>

          <button
            onClick={handleNext}
            disabled={!nextCursor}
            className="
              px-4 py-2
              text-xs
              bg-secondary
              text-white
              rounded-md
              disabled:opacity-40
            "
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeaturedPromotionLogs;
