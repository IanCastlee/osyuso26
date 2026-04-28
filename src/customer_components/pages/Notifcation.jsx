import React, { useState } from "react";
import { IoMdNotificationsOutline } from "react-icons/io";

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

  const filtered =
    activeTab === "Unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  return (
    <div className="w-full bg-gray-100 min-h-[calc(100vh-4rem)] px-6 md:px-28 py-8">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-primary">Notifications</h1>

        {/* MARK ALL */}
        <button
          onClick={() =>
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
          }
          className="text-sm text-secondary hover:underline"
        >
          Mark all as read
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 text-sm font-medium transition-all ${
              activeTab === tab
                ? "text-secondary border-b-2 border-secondary"
                : "text-gray-500 hover:text-secondary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="flex flex-col gap-3">
        {filtered.map((notif) => (
          <div
            key={notif.id}
            onClick={() => markAsRead(notif.id)}
            className={`cursor-pointer bg-primary rounded-xs shadow-xs hover:shadow-xs transition p-4 flex gap-4 items-start border-l-4 ${
              notif.read ? "border-gray-200" : "border-secondary"
            }`}
          >
            {/* ICON */}
            <div className="text-secondary text-2xl mt-1">
              <IoMdNotificationsOutline />
            </div>

            {/* CONTENT */}
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-primary">{notif.title}</h3>

                {!notif.read && (
                  <span className="w-2 h-2 bg-secondary rounded-full"></span>
                )}
              </div>

              <p className="text-sm text-gray-600 mt-1">{notif.message}</p>

              <p className="text-xs text-gray-400 mt-2">{notif.time}</p>
            </div>
          </div>
        ))}

        {/* EMPTY STATE */}
        {filtered.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            No notifications found
          </div>
        )}
      </div>
    </div>
  );
}

export default Notification;
