// import { useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import fetchInstance from "../utils/fetchInstance";
// import { useToast } from "../context/ToastContext";
// import { useAuth } from "../context/AuthContext";

// function useFormSubmit(url, onSuccess) {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const { showToast } = useToast();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { logout } = useAuth();

//   const redirectToSignin = () => {
//     sessionStorage.removeItem("auth-storage");

//     logout?.();

//     showToast({
//       type: "error",
//       message: "Session expired. Please login again.",
//       duration: 3000,
//     });

//     navigate("/signin", {
//       replace: true,
//       state: {
//         from: location.pathname,
//       },
//     });
//   };

//   const submit = async (formData, options = {}) => {
//     if (loading) return;

//     try {
//       setLoading(true);
//       setError(null);

//       const isFormData = formData instanceof FormData;

//       const res = await fetchInstance(url, {
//         method: "POST",
//         body: isFormData ? formData : JSON.stringify(formData),
//         headers: isFormData ? {} : { "Content-Type": "application/json" },
//         ...options,
//       });

//       if (res?.success === false) {
//         throw res;
//       }

//       onSuccess?.(res);
//       return res;
//     } catch (err) {
//       console.error("FULL ERROR:", err);

//       if (err?.status === 401) {
//         redirectToSignin();
//         return;
//       }

//       const message =
//         err?.response?.data?.message || err?.message || "Something went wrong";

//       setError(message);

//       showToast({
//         type: "error",
//         message,
//         duration: 3000,
//       });

//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   return { submit, loading, error };
// }

// export default useFormSubmit;

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

  const isAccountBlockedError = (err) => {
    const message = String(err?.message || "").toLowerCase();

    return (
      err?.status === 403 &&
      (message.includes("restricted") ||
        message.includes("inactive") ||
        message.includes("banned") ||
        message.includes("account no longer exists"))
    );
  };

  const redirectToSignin = (
    message = "Session expired. Please login again.",
  ) => {
    sessionStorage.removeItem("auth-storage");
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    logout?.();

    showToast({
      type: "error",
      message,
      duration: 4000,
    });

    navigate("/signin", {
      replace: true,
      state: {
        from: location.pathname,
        message,
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
      console.error("POST ERROR:", err);

      const message = err?.message || "Something went wrong";

      if (err?.status === 401 || err?.status === 403) {
        redirectToSignin(
          err?.status === 403
            ? "You do not have permission to perform this action. Please sign in with the correct account."
            : message,
        );
        return;
      }

      if (isAccountBlockedError(err)) {
        redirectToSignin(message);
        return;
      }

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
