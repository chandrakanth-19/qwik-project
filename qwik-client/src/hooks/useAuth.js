import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api";
import useAuthStore from "../store/authStore";
import useCartStore from "../store/cartStore";
import toast from "react-hot-toast";

// ── useAuth ──────────────────────────────────────────────────
export function useAuth() {
  const { user, token, role, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

const login = useCallback(async (credentials) => {
  const { data } = await authAPI.login(credentials);

  // Block admin from logging in via regular login page
  if (data.data.role === "admin") {
    throw new Error("Please use the admin login page at /admin/login");
  }

  setAuth(data.data.user, data.data.token, data.data.role);
  if (data.data.role === "merchant") navigate("/merchant/dashboard");
  else navigate("/home");
}, [setAuth, navigate]);

  const adminLogin = useCallback(async (credentials) => {
    const { data } = await authAPI.adminLogin(credentials);
    setAuth(data.data.user, data.data.token, data.data.role);
    navigate("/admin/dashboard");
  }, [setAuth, navigate]);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch (_) {}
    clearAuth();
    useCartStore.getState().clearCart();
    navigate("/login");
  }, [clearAuth, navigate]);

  return { user, token, role, login, adminLogin, logout, isAuthenticated: !!token };
}
