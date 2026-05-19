import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import fetchInstance from "../utils/fetchInstance";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const useUpdateStatus = (url, onSuccess) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
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

  const updateStatus = async (data) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetchInstance(url, {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (res?.success === false) {
        throw res;
      }

      onSuccess?.(res);
      return res;
    } catch (err) {
      if (err?.status === 401) {
        redirectToSignin();
        return;
      }

      const message = err?.message || "Something went wrong.";
      setError(message);
      console.error("useUpdateStatus error:", message);

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

  return { updateStatus, loading, error };
};

export default useUpdateStatus;
