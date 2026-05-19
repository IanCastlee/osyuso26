import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import fetchInstance from "../utils/fetchInstance";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

function useFormSubmit(url, onSuccess) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const redirectToSignin = () => {
    sessionStorage.removeItem("auth-storage");

    logout?.();

    showToast({
      type: "error",
      message: "Session expired. Please login again.",
      duration: 3000,
    });

    navigate("/signin", {
      replace: true,
      state: {
        from: location.pathname,
      },
    });
  };

  const submit = async (formData, options = {}) => {
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

      if (res?.success === false) {
        throw res;
      }

      onSuccess?.(res);
      return res;
    } catch (err) {
      console.error("FULL ERROR:", err);

      if (err?.status === 401) {
        redirectToSignin();
        return;
      }

      const message =
        err?.response?.data?.message || err?.message || "Something went wrong";

      setError(message);

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
