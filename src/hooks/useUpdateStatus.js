import { useState } from "react";
import fetchInstance from "../utils/fetchInstance";

const useUpdateStatus = (url, onSuccess) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateStatus = async (data) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetchInstance(url, {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (res?.success === false) {
        throw new Error(res.message || "Failed to update status.");
      }

      onSuccess?.(res);
      return res;
    } catch (err) {
      const message = err?.message || "Something went wrong.";
      setError(message);
      console.error("useUpdateStatus error:", message);
    } finally {
      setLoading(false);
    }
  };

  return { updateStatus, loading, error };
};

export default useUpdateStatus;
