// const BASE_URL = "http://localhost/OSYUSO26/backend/";
// //const BASE_URL = "https://osyuso.com/backend/";

// const getToken = () => {
//   const authData = sessionStorage.getItem("auth-storage");
//   if (!authData) return null;

//   try {
//     const parsed = JSON.parse(authData);
//     return parsed?.state?.token || parsed?.token || null;
//   } catch {
//     return null;
//   }
// };

// const fetchInstance = async (endpoint, options = {}) => {
//   const token = getToken();
//   const isFormData = options.body instanceof FormData;

//   const headers = {
//     ...(isFormData ? {} : { "Content-Type": "application/json" }),
//     ...(options.headers || {}),
//   };

//   if (token) {
//     headers.Authorization = `Bearer ${token}`;
//   }

//   let response;
//   let rawText;

//   try {
//     response = await fetch(BASE_URL + endpoint, {
//       ...options,
//       headers,
//     });

//     rawText = await response.text();
//   } catch (networkErr) {
//     throw {
//       success: false,
//       status: 0,
//       message: "NETWORK ERROR",
//       error: networkErr.message,
//     };
//   }

//   let data = null;

//   try {
//     data = rawText ? JSON.parse(rawText) : null;
//   } catch {
//     throw {
//       success: false,
//       status: response.status,
//       message: "INVALID JSON FROM BACKEND",
//       error: rawText,
//     };
//   }

//   if (!response.ok) {
//     throw {
//       ...(data || {}),
//       success: false,
//       status: response.status,
//       message: data?.message || response.statusText || "Request failed",
//     };
//   }

//   return {
//     ...(data || {}),
//     status: response.status,
//   };
// };

// export default fetchInstance;

/////////////////////////////
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
      message: "NETWORK ERROR",
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
      message: data?.message || response.statusText || "Request failed",
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
      message: "INVALID JSON FROM BACKEND",
      error: rawText,
    };
  }
};

export default fetchInstance;
