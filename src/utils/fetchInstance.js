//const BASE_URL = "http://localhost/OSYUSO26/backend/";
const BASE_URL = "https://osyuso.com/backend/";

const getToken = () => {
  const authData = sessionStorage.getItem("auth-storage");
  if (!authData) return null;

  try {
    const parsed = JSON.parse(authData);
    return parsed?.state?.token || parsed?.token || null;
  } catch {
    return null;
  }
};

const getErrorMessage = (data, fallback = "Request failed") => {
  return (
    data?.message ||
    data?.data?.message ||
    data?.data?.error ||
    data?.error ||
    fallback
  );
};

const fetchInstance = async (endpoint, options = {}) => {
  const { responseType, ...fetchOptions } = options;

  const token = getToken();
  const isFormData = fetchOptions.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(fetchOptions.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(BASE_URL + endpoint, {
      ...fetchOptions,
      headers,
    });
  } catch (networkErr) {
    throw {
      success: false,
      status: 0,
      message: "Network error. Please check your internet connection.",
      error: networkErr.message,
    };
  }

  if (!response.ok) {
    const rawText = await response.text();

    let data = {};
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      data = { message: rawText };
    }

    throw {
      ...data,
      success: false,
      status: response.status,
      message: getErrorMessage(data, response.statusText || "Request failed"),
    };
  }

  if (responseType === "blob") {
    return await response.blob();
  }

  if (responseType === "text") {
    return await response.text();
  }

  const rawText = await response.text();

  try {
    return rawText ? JSON.parse(rawText) : null;
  } catch {
    throw {
      success: false,
      status: response.status,
      message: "Invalid response from backend.",
      error: rawText,
    };
  }
};

export default fetchInstance;
