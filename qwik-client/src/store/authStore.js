import { create } from "zustand";

const useAuthStore = create((set) => ({
  user:  JSON.parse(localStorage.getItem("qwik_user") || "null"),
  token: localStorage.getItem("qwik_token") || null,
  role:  localStorage.getItem("qwik_role")  || null,

  setAuth: (user, token, role) => {
    localStorage.setItem("qwik_user",  JSON.stringify(user));
    localStorage.setItem("qwik_token", token);
    localStorage.setItem("qwik_role",  role);
    set({ user, token, role });
  },

  clearAuth: () => {
    localStorage.removeItem("qwik_user");
    localStorage.removeItem("qwik_token");
    localStorage.removeItem("qwik_role");
    set({ user: null, token: null, role: null });
  },
}));

export default useAuthStore;
