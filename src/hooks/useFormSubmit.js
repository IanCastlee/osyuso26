import { useState } from "react";
import fetchInstance from "../utils/fetchInstance";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

function useFormSubmit(url, onSuccess) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { showToast } = useToast();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const submit = async (formData, options = {}) => {
    // 🛑 prevent double submit
    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      const isFormData = formData instanceof FormData;

      const res = await fetchInstance(url, {
        method: "POST",
        body: isFormData ? formData : JSON.stringify(formData),
        headers: isFormData ? {} : { "Content-Type": "application/json" },
        ...options,
      });

      console.log("📡 RAW RESPONSE FROM API:", res);

      const message = res?.message || "Unknown response";

      // ================= AUTH CHECK (TRY) =================
      if (
        message.includes("No token") ||
        message.includes("Invalid or expired token")
      ) {
        showToast({
          type: "error",
          message: "Session expired. Please login again.",
          duration: 3000,
        });

        logout();
        return;
      }

      // ================= BACKEND ERROR =================
      if (res?.success === false) {
        throw res;
      }

      // ================= SUCCESS =================
      onSuccess?.(res);
      return res;
    } catch (err) {
      console.error("🚨 FULL ERROR:", err);

      // 🔥 FIX: get correct message source
      const message =
        err?.response?.data?.message || err?.message || "Something went wrong";

      setError(message);

      // ================= AUTH CHECK (CATCH) =================
      if (
        message.includes("No token") ||
        message.includes("Invalid or expired token")
      ) {
        showToast({
          type: "error",
          message: "Session expired. Please login again.",
          duration: 3000,
        });
        navigate("/signin");
        return;
      }

      // ================= NORMAL ERROR =================
      showToast({
        type: "error",
        message,
        duration: 3000,
      });

      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading, error };
}

export default useFormSubmit;
