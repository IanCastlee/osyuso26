import { useState, useEffect } from "react";
import fetchInstance from "../utils/fetchInstance";

function useGetData(url, options = {}, autoFetch = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await fetchInstance(url, {
        method: "GET",
        ...options,
      });

      if (res?.success === false) {
        throw new Error(res.message || "API error");
      }

      setData(res.data ?? res);
      setError(null);
    } catch (err) {
      const message = err?.message || "Network or server error";

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
