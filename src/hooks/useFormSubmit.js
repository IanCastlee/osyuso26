import { useState } from "react";
import fetchInstance from "../utils/fetchInstance";

function useFormSubmit(url, onSuccess) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (formData, options = {}) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetchInstance(url, {
        method: "POST",
        body: JSON.stringify(formData),
        ...options,
      });

      // backend validation (same logic as yours)
      if (res?.success === false) {
        throw new Error(res.message || "Request failed");
      }

      onSuccess?.(res);
      return res;
    } catch (err) {
      const message = err?.message || "Something went wrong during submission.";

      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading, error };
}

export default useFormSubmit;
