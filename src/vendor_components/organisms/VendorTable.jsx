import React from "react";

function VendorTable({ columns = [], data = [] }) {
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
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
            {safeData.length > 0 ? (
              safeData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className="hover:bg-gray-50 transition border-b border-gray-100"
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-4 py-1 border-r text-xs border-gray-100 last:border-r-0 ${
                        col.align === "right" ? "text-right" : ""
                      }`}
                    >
                      {col.render
                        ? col.render(row, rowIndex)
                        : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-6 text-gray-400"
                >
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VendorTable;
