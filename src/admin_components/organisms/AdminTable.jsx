import React from "react";

function AdminTable({ columns = [], data = [], loading = false }) {
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 ${
                    col.align === "right" ? "text-right" : ""
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 6 }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((_, colIndex) => (
                    <td key={colIndex} className="px-4 py-4">
                      <div className="h-4 w-full max-w-28 animate-pulse rounded bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : safeData.length > 0 ? (
              safeData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className="transition hover:bg-slate-50"
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-4 py-3 align-middle text-sm text-slate-700 ${
                        col.align === "right" ? "text-right" : ""
                      }`}
                    >
                      {col.render
                        ? col.render(row, rowIndex)
                        : row[col.accessor] || "-"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-14">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                      <span className="text-lg font-bold text-slate-400">
                        !
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-800">
                      No data found
                    </p>

                    <p className="mt-1 max-w-sm text-sm text-slate-500">
                      Try adjusting your search or add a data.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminTable;
