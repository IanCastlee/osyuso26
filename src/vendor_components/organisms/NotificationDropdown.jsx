import React, { useMemo, useState } from "react";
import { FiBell, FiCheckCircle } from "react-icons/fi";
import { IoMdNotificationsOutline } from "react-icons/io";
import { useNavigate } from "react-router-dom";

import useGetData from "../../hooks/useGetData";
import useFormSubmit from "../../hooks/useFormSubmit";

function NotificationDropdown({ onOpen, notificationPath = "/notifications" }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.append("limit", "5");
    return q.toString();
  }, []);

  const {
    data,
    loading,
    refetch: refetchNotifications,
  } = useGetData(`notification/get-notifications.php?${query}`);

  const payload = data?.data || data || {};
  const notifications = Array.isArray(payload?.rows) ? payload.rows : [];
  const unreadCount = Number(payload?.unread_count || 0);

  const { submit: markReadSubmit } = useFormSubmit(
    "notification/mark-read.php",
  );

  const { submit: markAllReadSubmit, loading: markAllLoading } = useFormSubmit(
    "notification/mark-all-read.php",
  );

  const toggleDropdown = () => {
    setOpen((value) => {
      const nextValue = !value;

      if (nextValue) {
        onOpen?.();
        refetchNotifications();
      }

      return nextValue;
    });
  };

  const markAsRead = async (id, isRead) => {
    if (Number(isRead) === 1) return;

    try {
      await markReadSubmit({ notification_id: id });
      refetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      await markAllReadSubmit({});
      refetchNotifications();
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
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-secondary/30"
        title="Notifications"
      >
        <FiBell className="text-lg" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-xl shadow-slate-900/10">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="font-bold text-slate-950">Notifications</p>
              <p className="text-xs text-slate-500">
                Latest marketplace updates
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markAllLoading}
                className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-secondary transition hover:bg-orange-100 disabled:opacity-50"
              >
                <FiCheckCircle />
                Read all
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                Loading notifications...
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => {
                const isRead = Number(notif.is_read) === 1;

                return (
                  <button
                    key={notif.id}
                    onClick={() => markAsRead(notif.id, notif.is_read)}
                    className="flex w-full gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-slate-50"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        isRead
                          ? "bg-slate-100 text-slate-400"
                          : "bg-orange-50 text-secondary"
                      }`}
                    >
                      <IoMdNotificationsOutline className="text-xl" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-sm font-semibold ${
                          isRead ? "text-slate-700" : "text-slate-950"
                        }`}
                      >
                        {notif.title}
                      </span>

                      <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-slate-500">
                        {notif.message}
                      </span>

                      <span className="mt-1 block text-[11px] font-medium text-slate-400">
                        {formatTime(notif.created_at)}
                      </span>
                    </span>

                    {!isRead && (
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-secondary" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <IoMdNotificationsOutline className="text-2xl" />
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-800">
                  No notifications
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  New updates will appear here.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setOpen(false);
              navigate(notificationPath);
            }}
            className="w-full border-t border-slate-100 px-4 py-3 text-center text-sm font-semibold text-secondary transition hover:bg-orange-50"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
