import { create } from "zustand";

// Feature 5: read from localStorage (remember me) OR sessionStorage (session only)
const _get = (key) =>
  localStorage.getItem(key) || sessionStorage.getItem(key) || null;

const useAuthStore = create((set) => ({
  user:  JSON.parse(_get("qwik_user") || "null"),
  token: _get("qwik_token"),
  role:  _get("qwik_role"),

  // Feature 5: rememberMe=true → localStorage (survives refresh+close)
  //            rememberMe=false → sessionStorage (clears when tab closes)
  setAuth: (user, token, role, rememberMe = true) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    // Clear both first to avoid stale data in the other
    ["qwik_user", "qwik_token", "qwik_role"].forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    storage.setItem("qwik_user",  JSON.stringify(user));
    storage.setItem("qwik_token", token);
    storage.setItem("qwik_role",  role);
    set({ user, token, role });
  },

  clearAuth: () => {
    ["qwik_user", "qwik_token", "qwik_role"].forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    set({ user: null, token: null, role: null });
  },
}));

export default useAuthStore;
