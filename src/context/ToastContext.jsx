import React, { createContext, useContext, useState } from "react";

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

  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };

  return (
    <div className="fixed top-5 right-5 z-50 animate-fadeIn">
      <div
        className={`${colors[toast.type]} text-white px-4 py-2 rounded-md shadow-md text-sm`}
      >
        {toast.message}
      </div>
    </div>
  );
}
