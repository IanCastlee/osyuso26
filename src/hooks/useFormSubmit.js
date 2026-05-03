import { useState } from "react";
import fetchInstance from "../utils/fetchInstance";

function useFormSubmit(url, onSuccess) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (formData, options = {}) => {
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

      if (res?.success === false) {
        throw res;
      }

      onSuccess?.(res);
      return res;
    } catch (err) {
      console.error("🚨 FULL ERROR:", err);

      console.log("📛 MESSAGE:", err?.message);
      console.log("🔥 BACKEND ERROR:", err?.error);

      setError(err?.message || "Unknown error");

      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading, error };
}

export default useFormSubmit;
