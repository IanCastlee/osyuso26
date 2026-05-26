import React, { useMemo } from "react";
import { FiFileText } from "react-icons/fi";
import useGetData from "../../hooks/useGetData";

function LegalPage({ slug, fallbackTitle }) {
  const { data, loading, error } = useGetData(
    `legal/get-public-legal-page.php?slug=${encodeURIComponent(slug)}`,
  );

  const page = useMemo(() => data?.data || data || {}, [data]);

  const lines = String(page.content || "")
    .split("\n")
    .map((line) => line.trimEnd());

  const formatDate = (value) => {
    if (!value) return "Not set";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4 border-b border-slate-100 pb-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-secondary">
              <FiFileText className="text-2xl" />
            </span>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-secondary">
                OSYUSO Legal
              </p>

              <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
                {page.title || fallbackTitle}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Effective Date: {formatDate(page.effective_date)} · Version{" "}
                {page.version || "1.0"}
              </p>
            </div>
          </div>

          {loading && (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading legal page...
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="mt-8 space-y-4">
              {lines.map((line, index) => {
                if (!line) return <div key={index} className="h-2" />;

                if (line.startsWith("## ")) {
                  return (
                    <h2
                      key={index}
                      className="pt-4 text-lg font-bold text-slate-950"
                    >
                      {line.replace("## ", "")}
                    </h2>
                  );
                }

                return (
                  <p key={index} className="text-sm leading-7 text-slate-600">
                    {line}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LegalPage;
