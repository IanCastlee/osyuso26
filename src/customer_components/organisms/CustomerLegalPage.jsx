import React, { useMemo } from "react";
import {
  FiArrowLeft,
  FiChevronRight,
  FiClock,
  FiFileText,
  FiShield,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import useGetData from "../../hooks/useGetData";

function CustomerLegalPage({ slug, fallbackTitle }) {
  const navigate = useNavigate();

  const { data, loading, error } = useGetData(
    `legal/get-public-legal-page.php?slug=${encodeURIComponent(slug)}`,
  );

  const page = useMemo(() => data?.data || data || {}, [data]);

  const sections = useMemo(() => {
    const content = String(page.content || "");
    const lines = content.split("\n");

    const result = [];
    let current = null;

    lines.forEach((rawLine) => {
      const line = rawLine.trim();

      if (!line) return;

      if (line.startsWith("## ")) {
        current = {
          title: line.replace("## ", "").trim(),
          body: [],
        };

        result.push(current);
        return;
      }

      if (!current) {
        current = {
          title: "Overview",
          body: [],
        };

        result.push(current);
      }

      current.body.push(line);
    });

    return result;
  }, [page.content]);

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

  const isPrivacy = slug === "privacy-policy";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-[120px]">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
            <div className="p-6 sm:p-8 lg:p-10">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <FiArrowLeft />
                Back
              </button>

              <div className="mt-8 flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-secondary">
                  {isPrivacy ? (
                    <FiShield className="text-2xl" />
                  ) : (
                    <FiFileText className="text-2xl" />
                  )}
                </span>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-secondary">
                    OSYUSO Legal
                  </p>

                  <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-4xl">
                    {page.title || fallbackTitle}
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                    Please read this page carefully. It explains important
                    information about using OSYUSO as a customer, vendor, or
                    marketplace user.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-orange-400 bg-orange-500 p-6 text-white sm:p-8 lg:border-l lg:border-t-0">
              <div className="flex h-full flex-col justify-between gap-8">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-white/75">
                    Document Info
                  </p>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-lg border border-white/25 bg-white/15 p-4">
                      <p className="text-xs font-semibold uppercase text-white/70">
                        Effective Date
                      </p>
                      <p className="mt-1 text-sm font-bold text-white">
                        {formatDate(page.effective_date)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-white/25 bg-white/15 p-4">
                      <p className="text-xs font-semibold uppercase text-white/70">
                        Version
                      </p>
                      <p className="mt-1 text-sm font-bold text-white">
                        {page.version || "1.0"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-white/25 bg-white/15 p-4">
                      <div className="flex items-center gap-2">
                        <FiClock />
                        <p className="text-sm font-bold text-white">
                          Last updated
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-white/85">
                        {formatDate(page.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs leading-5 text-white/75">
                  For questions about these policies, contact OSYUSO through the
                  official contact page.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden h-fit rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-6 lg:block">
            <p className="px-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              On this page
            </p>

            <div className="mt-3 space-y-1">
              {sections.map((section, index) => (
                <a
                  key={`${section.title}-${index}`}
                  href={`#section-${index}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-600 transition hover:bg-orange-50 hover:text-secondary"
                >
                  <FiChevronRight className="shrink-0 text-sm" />
                  <span className="line-clamp-1">{section.title}</span>
                </a>
              ))}
            </div>
          </aside>

          <main className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            {loading && (
              <div className="py-16 text-center text-sm font-medium text-slate-500">
                Loading legal content...
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && sections.length === 0 && (
              <div className="py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                  <FiFileText className="text-2xl" />
                </div>

                <h2 className="mt-4 text-sm font-bold text-slate-800">
                  No content available
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  This legal page is not yet published.
                </p>
              </div>
            )}

            {!loading && !error && sections.length > 0 && (
              <div className="space-y-8">
                {sections.map((section, index) => (
                  <section
                    key={`${section.title}-${index}`}
                    id={`section-${index}`}
                    className="scroll-mt-8"
                  >
                    <h2 className="text-xl font-black text-slate-950">
                      {section.title}
                    </h2>

                    <div className="mt-3 space-y-3">
                      {section.body.map((paragraph, paragraphIndex) => (
                        <p
                          key={`${section.title}-${paragraphIndex}`}
                          className="text-sm leading-7 text-slate-600 sm:text-base"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default CustomerLegalPage;
