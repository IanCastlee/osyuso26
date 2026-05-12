import React, { createContext, useContext, useState } from "react";
import { IoIosCloseCircle, IoIosCheckmarkCircle } from "react-icons/io";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = ({ type = "success", message = "", duration = 3000 }) => {
    setToast({ type, message });

    setTimeout(() => {
      setToast(null);
    }, duration);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toast={toast} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/* ================= TOAST UI ================= */

function ToastContainer({ toast }) {
  if (!toast) return null;

  const config = {
    success: {
      icon: <IoIosCheckmarkCircle />,
      iconBg: "bg-green-100 text-green-600",
    },
    error: {
      icon: <IoIosCloseCircle />,
      iconBg: "bg-red-100 text-red-600",
    },
    info: {
      icon: <IoIosCheckmarkCircle />,
      iconBg: "bg-blue-100 text-blue-600",
    },
  };

  const current = config[toast.type] || config.success;

  return (
    <div className="fixed top-4 right-3 sm:top-5 sm:right-5 z-50 animate-fadeIn">
      <div
        className="
          flex items-center gap-2 sm:gap-3
          bg-white
          shadow-lg
          rounded-xl
          px-3 py-2 sm:px-4 sm:py-3
          min-w-[200px] sm:min-w-[260px]
          max-w-[90vw]
        "
      >
        {/* ICON */}
        <div
          className={`
            w-7 h-7 sm:w-9 sm:h-9
            flex items-center justify-center
            rounded-full
            ${current.iconBg}
            text-base sm:text-lg
            shrink-0
          `}
        >
          {current.icon}
        </div>

        {/* MESSAGE */}
        <div className="text-xs sm:text-sm text-gray-700 font-medium leading-snug">
          {toast.message}
        </div>
      </div>
    </div>
  );
}
