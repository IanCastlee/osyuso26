import React, { useState } from "react";

function Table({ columns, data, rowsPerPage = 5 }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(data.length / rowsPerPage);

  const startIndex = (page - 1) * rowsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + rowsPerPage);

  const nextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          {/* HEADER */}
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="px-4 py-2 border-b border-gray-200">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-gray-50 transition border-b border-gray-100"
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-4 py-2 border-r border-gray-100 last:border-r-0 ${
                      col.align === "right" ? "text-right" : ""
                    }`}
                  >
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-500">
          Page {page} of {totalPages}
        </p>

        <div className="flex gap-2">
          <button
            onClick={prevPage}
            disabled={page === 1}
            className="px-3 py-1 text-xs rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
          >
            Prev
          </button>

          <button
            onClick={nextPage}
            disabled={page === totalPages}
            className="px-3 py-1 text-xs rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default Table;
