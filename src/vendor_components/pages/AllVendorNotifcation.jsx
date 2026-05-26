import React, { useMemo, useState } from "react";
import { IoMdNotificationsOutline } from "react-icons/io";
import { FiCheckCircle, FiChevronLeft, FiChevronRight } from "react-icons/fi";

import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";

const tabs = ["All", "Unread"];

function AllVendorNotifcation() {
  const [activeTab, setActiveTab] = useState("All");
  const [cursor, setCursor] = useState(null);
  const [history, setHistory] = useState([]);

  const query = useMemo(() => {
    const q = new URLSearchParams();

    q.append("limit", "20");

    if (cursor) q.append("cursor", cursor);
    if (activeTab === "Unread") q.append("unread", "1");

    return q.toString();
  }, [cursor, activeTab]);

  const { data, loading, refetch } = useGetData(
    `notification/get-notifications.php?${query}`,
  );

  const payload = data?.data || data || {};

  const notifications = Array.isArray(payload?.rows) ? payload.rows : [];
  const unreadCount = Number(payload?.unread_count || 0);
  const hasMore = Boolean(payload?.has_more);
  const nextCursor = payload?.next_cursor || null;

  const { submit: markReadSubmit } = useFormSubmit(
    "notification/mark-read.php",
  );

  const { submit: markAllReadSubmit, loading: markAllLoading } = useFormSubmit(
    "notification/mark-all-read.php",
  );

  const canGoNext = Boolean(hasMore && nextCursor);
  const canGoPrev = history.length > 0;

  const resetPage = (tab) => {
    setActiveTab(tab);
    setCursor(null);
    setHistory([]);
  };

  const handleNext = () => {
    if (!canGoNext) return;

    setHistory((prev) => [...prev, cursor]);
    setCursor(nextCursor);
  };

  const handlePrev = () => {
    if (!canGoPrev) return;

    const updated = [...history];
    const prevCursor = updated.pop();

    setHistory(updated);
    setCursor(prevCursor || null);
  };

  const markAsRead = async (id, isRead) => {
    if (Number(isRead) === 1) return;

    try {
      await markReadSubmit({ notification_id: id });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      await markAllReadSubmit({});
      setCursor(null);
      setHistory([]);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (value) => {
    if (!value) return "";

    const date = new Date(String(value).replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-slate-50 px-4 py-6 sm:px-6 md:px-10 lg:px-28">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-secondary">
                  <IoMdNotificationsOutline className="text-2xl" />
                </div>

                <div>
                  <h1 className="text-xl font-bold text-slate-950 md:text-2xl">
                    Notifications
                  </h1>
                  <p className="mt-1 text-xs text-slate-500">
                    Stay updated with your orders and marketplace activity.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0 || markAllLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiCheckCircle />
              {markAllLoading ? "Updating..." : "Mark all as read"}
            </button>
          </div>

          <div className="mt-5 flex gap-2 rounded-xl bg-slate-100 p-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;

              return (
                <button
                  key={tab}
                  onClick={() => resetPage(tab)}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-bold transition ${
                    isActive
                      ? "bg-white text-secondary shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab}
                  {tab === "Unread" && unreadCount > 0 && (
                    <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              Loading notifications...
            </div>
          ) : (
            notifications.map((notif) => {
              const isRead = Number(notif.is_read) === 1;

              return (
                <button
                  key={notif.id}
                  onClick={() => markAsRead(notif.id, notif.is_read)}
                  className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-orange-200 hover:shadow-md ${
                    !isRead
                      ? "border-orange-100 ring-1 ring-orange-50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        isRead
                          ? "bg-slate-100 text-slate-400"
                          : "bg-orange-50 text-secondary"
                      }`}
                    >
                      <IoMdNotificationsOutline className="text-2xl" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3
                          className={`text-sm font-bold ${
                            isRead ? "text-slate-700" : "text-slate-950"
                          }`}
                        >
                          {notif.title}
                        </h3>

                        {!isRead && (
                          <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-secondary" />
                        )}
                      </div>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {notif.message}
                      </p>

                      <p className="mt-2 text-xs font-medium text-slate-400">
                        {formatTime(notif.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}

          {!loading && notifications.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <IoMdNotificationsOutline className="text-3xl" />
              </div>

              <h2 className="mt-4 text-sm font-bold text-slate-800">
                No notifications found
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                New updates will appear here once available.
              </p>
            </div>
          )}
        </div>

        {!loading && notifications.length > 0 && (
          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-slate-500">Page {history.length + 1}</p>

            <div className="flex gap-2">
              <button
                onClick={handlePrev}
                disabled={!canGoPrev}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiChevronLeft />
                Prev
              </button>

              <button
                onClick={handleNext}
                disabled={!canGoNext}
                className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AllVendorNotifcation;
