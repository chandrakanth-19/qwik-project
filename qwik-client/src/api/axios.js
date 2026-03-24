// import axios from "axios";

// // const api = axios.create({
// //   baseURL: import.meta.env.VITE_API_URL
// //     ? `${import.meta.env.VITE_API_URL}/api`
// //     : "/api",
// // });

// const api = axios.create({ baseURL: "/api" });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("qwik_token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// api.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     if (err.response?.status === 401) {
//       localStorage.clear();
//       window.location.href = "/login";
//     }
//     return Promise.reject(err);
//   }
// );

// export default api;


import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("qwik_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    if (err.response?.status === 404) {
      toast.error(err.response?.data?.message || "Not found.");
    }
    if (err.response?.status === 500) {
      toast.error("Server error. Please try again.");
    }
    return Promise.reject(err);
  }
);

export default api;