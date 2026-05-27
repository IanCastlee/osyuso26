// import { useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import fetchInstance from "../utils/fetchInstance";

// function useGetData(url, options = {}, autoFetch = true) {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(autoFetch);
//   const [error, setError] = useState(null);

//   const redirectToSignin = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");

//     navigate("/signin", {
//       replace: true,
//       state: {
//         from: location.pathname,
//       },
//     });
//   };

//   const fetchData = async () => {
//     try {
//       setLoading(true);

//       const res = await fetchInstance(url, {
//         method: "GET",
//         ...options,
//       });

//       if (res?.status === 401) {
//         redirectToSignin();
//         return;
//       }

//       // if (res?.success === false) {
//       //   throw new Error(res.message || "API error");
//       // }

//       if (res?.success === false) {
//         console.log("API ERROR RESPONSE:", res);
//         throw new Error(res?.data?.error || res.message || "API error");
//       }
//       setData(res.data ?? res);
//       setError(null);
//     } catch (err) {
//       if (err?.status === 401) {
//         redirectToSignin();
//         return;
//       }

//       const message = err?.message || "Network or server error";
//       setError(message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (!url) return;
//     if (autoFetch) fetchData();
//   }, [url]);

//   return { data, loading, error, refetch: fetchData };
// }

// export default useGetData;
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import fetchInstance from "../utils/fetchInstance";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

function useGetData(url, options = {}, autoFetch = true) {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { logout } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

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

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await fetchInstance(url, {
        method: "GET",
        ...options,
      });

      if (res?.success === false) {
        throw res;
      }

      setData(res?.data ?? res);
      setError(null);
    } catch (err) {
      console.error("GET ERROR:", err);

      const message = err?.message || "Network or server error";

      if (err?.status === 401 || err?.status === 403) {
        redirectToSignin(
          err?.status === 403
            ? "You do not have permission to access that page. Please sign in with the correct account."
            : message,
        );
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!url) return;
    if (autoFetch) fetchData();
  }, [url]);

  return { data, loading, error, refetch: fetchData };
}

export default useGetData;
