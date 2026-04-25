const BASE_URL = "http://localhost/OSYUSO_R/backend/";

// GET TOKEN (same logic as yours)
const getToken = () => {
  const authData = sessionStorage.getItem("auth-storage");

  if (!authData) return null;

  const parsed = JSON.parse(authData);
  return parsed?.state?.token || parsed?.token || null;
};

// MAIN FETCH WRAPPER
const fetchInstance = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(BASE_URL + endpoint, {
    ...options,
    headers,
  });

  // HANDLE STATUS LIKE INTERCEPTOR
  if (response.status === 401) {
    sessionStorage.removeItem("auth-storage");
    window.location.href = "/signin";
    return;
  }

  if (response.status === 403) {
    sessionStorage.removeItem("auth-storage");
    window.location.href = "/";
    return;
  }

  // parse JSON safely
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw data || { message: "Request failed" };
  }

  return data;
};

export default fetchInstance;
