import React, { useState } from "react";
import { IoMdNotificationsOutline } from "react-icons/io";
import { FiCheckCircle } from "react-icons/fi";

const tabs = ["All", "Unread"];

function Notification() {
  const [activeTab, setActiveTab] = useState("All");

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Order Confirmed",
      message: "Your order for Pork Belly has been confirmed.",
      time: "2 mins ago",
      read: false,
    },
    {
      id: 2,
      title: "Out for Delivery",
      message: "Your Chicken order is on the way.",
      time: "1 hour ago",
      read: true,
    },
    {
      id: 3,
      title: "New Discount!",
      message: "Get 10% off on Meat products today only.",
      time: "Yesterday",
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered =
    activeTab === "Unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-gray-100 px-4 py-6 sm:px-6 md:px-10 lg:px-28">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-secondary">
                  <IoMdNotificationsOutline className="text-2xl" />
                </div>

                <div>
                  <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
                    Notifications
                  </h1>
                  <p className="mt-1 text-xs text-gray-500">
                    Stay updated with your orders and marketplace activity.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiCheckCircle />
              Mark all as read
            </button>
          </div>

          <div className="mt-5 flex gap-2 rounded-lg bg-gray-100 p-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 rounded-md px-4 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "bg-white text-secondary shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
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
          {filtered.map((notif) => (
            <button
              key={notif.id}
              onClick={() => markAsRead(notif.id)}
              className={`w-full rounded-xl bg-white p-4 text-left shadow-sm transition hover:shadow-md ${
                !notif.read ? "ring-1 ring-orange-100" : ""
              }`}
            >
              <div className="flex gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                    notif.read
                      ? "bg-gray-100 text-gray-400"
                      : "bg-orange-50 text-secondary"
                  }`}
                >
                  <IoMdNotificationsOutline className="text-2xl" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3
                      className={`text-sm font-semibold ${
                        notif.read ? "text-gray-700" : "text-gray-900"
                      }`}
                    >
                      {notif.title}
                    </h3>

                    {!notif.read && (
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-secondary" />
                    )}
                  </div>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    {notif.message}
                  </p>

                  <p className="mt-2 text-xs font-medium text-gray-400">
                    {notif.time}
                  </p>
                </div>
              </div>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-xl bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <IoMdNotificationsOutline className="text-3xl" />
              </div>

              <h2 className="mt-4 text-sm font-semibold text-gray-800">
                No notifications found
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                New updates will appear here once available.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notification;
