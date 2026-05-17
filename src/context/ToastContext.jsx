import React, { createContext, useContext, useState, useRef } from "react";

import {
  IoIosCloseCircle,
  IoIosCheckmarkCircle,
  IoIosInformationCircle,
} from "react-icons/io";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  // ================= TIMEOUT REF =================
  const timeoutRef = useRef(null);

  // ================= SHOW TOAST =================
  const showToast = ({ type = "success", message = "", duration = 3000 }) => {
    // CLEAR PREVIOUS TIMEOUT
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // SHOW TOAST
    setToast({ type, message });

    // AUTO HIDE
    timeoutRef.current = setTimeout(() => {
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
      bg: "bg-green-500",
      iconBg: "bg-white/20 text-white",
    },

    error: {
      icon: <IoIosCloseCircle />,
      bg: "bg-red-500",
      iconBg: "bg-white/20 text-white",
    },

    info: {
      icon: <IoIosInformationCircle />,
      bg: "bg-blue-500",
      iconBg: "bg-white/20 text-white",
    },
  };

  const current = config[toast.type] || config.success;

  return (
    <div
      className="
        fixed
        top-4
        right-3
        sm:top-5
        sm:right-5
        z-50
        animate-fadeIn
      "
    >
      <div
        className={`
          flex
          items-center
          gap-2
          px-3
          py-2
          rounded-lg
          shadow-lg
          text-white
          ${current.bg}
          max-w-[90vw]
        `}
      >
        {/* ICON */}
        <div
          className={`
            w-8
            h-8
            flex
            items-center
            justify-center
            rounded-full
            ${current.iconBg}
            shrink-0
          `}
        >
          <span className="text-lg flex items-center justify-center">
            {current.icon}
          </span>
        </div>

        {/* MESSAGE */}
        <div className="text-xs sm:text-sm leading-tight break-words">
          {toast.message}
        </div>
      </div>
    </div>
  );
}
