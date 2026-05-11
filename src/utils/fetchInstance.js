// //const BASE_URL = "http://localhost/OSYUSO26/backend/";
// const BASE_URL = "https://osyuso.kesug.com/backend/";

// const getToken = () => {
//   const authData = sessionStorage.getItem("auth-storage");
//   if (!authData) return null;

//   const parsed = JSON.parse(authData);
//   return parsed?.state?.token || parsed?.token || null;
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
//       message: "NETWORK ERROR",
//       error: networkErr.message,
//     };
//   }

//   let data;

//   try {
//     data = JSON.parse(rawText);
//   } catch (e) {
//     // 🔥 THIS IS KEY: shows PHP fatal error
//     throw {
//       success: false,
//       message: "INVALID JSON FROM BACKEND",
//       error: rawText,
//     };
//   }

//   if (!response.ok) {
//     throw data;
//   }

//   return data;
// };

// export default fetchInstance;

///////////////////////////////////////////////

//const BASE_URL = "http://localhost/OSYUSO26/backend/";
const BASE_URL = "https://osyuso.kesug.com/backend/";

const getToken = () => {
  const authData = sessionStorage.getItem("auth-storage");

  if (!authData) return null;

  const parsed = JSON.parse(authData);

  return parsed?.state?.token || parsed?.token || null;
};

const fetchInstance = async (endpoint, options = {}) => {
  const token = getToken();

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  // ✅ CUSTOM TOKEN HEADER
  if (token) {
    headers.AuthToken = token;
  }

  let response;
  let rawText;

  try {
    response = await fetch(BASE_URL + endpoint, {
      ...options,
      headers,
    });

    rawText = await response.text();
  } catch (networkErr) {
    throw {
      success: false,
      message: "NETWORK ERROR",
      error: networkErr.message,
    };
  }

  let data;

  try {
    data = JSON.parse(rawText);
  } catch (e) {
    throw {
      success: false,
      message: "INVALID JSON FROM BACKEND",
      error: rawText,
    };
  }

  if (!response.ok) {
    throw data;
  }

  return data;
};

export default fetchInstance;
