import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Shield, Eye, EyeOff } from "lucide-react";  // 👈 added Eye, EyeOff
import { useAuth } from "../../hooks/useAuth";
import { authAPI } from "../../api";

function AdminAuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500 rounded-2xl mb-4">
            <Shield className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        </div>
        <div className="card p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}

export function AdminLogin() {
  const { adminLogin } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);  // 👈 added

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminLogin(form);
      toast.success("Welcome, Super Admin!");
    } 
    catch (err) {
  const msg = err.response?.data?.message || "Login failed";
  if (err.response?.status === 401 || msg.toLowerCase().includes("invalid")) {
    toast.error("No admin account found with these credentials.");
  } else {
    toast.error(msg);
  }
} finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthLayout title="Super Admin Login" subtitle="Restricted access — authorized personnel only">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
          <input className="input" type="email" placeholder="admin@qwik.in" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          {/* 👇 replaced */}
          <div className="relative">
            <input className="input pr-10" type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        First time?{" "}
        <Link to="/admin/register" className="text-amber-600 font-medium hover:underline">Register with invite code</Link>
      </p>
    </AdminAuthLayout>
  );
}

export function AdminRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", invite_code: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);  // 👈 added

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.adminRegister(form);
      toast.success("Admin account created! Please log in.");
      navigate("/admin/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthLayout title="Admin Registration" subtitle="You need a valid invite code to proceed">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input className="input" placeholder="Admin name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input className="input" type="email" placeholder="admin@qwik.in" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          {/* 👇 replaced */}
          <div className="relative">
            <input className="input pr-10" type={showPassword ? "text" : "password"} placeholder="Min 6 characters" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Invite Code</label>
          <input className="input font-mono tracking-widest" placeholder="XXXX_XXXX_XXXX" value={form.invite_code}
            onChange={(e) => setForm({ ...form, invite_code: e.target.value })} required />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50">
          {loading ? "Creating..." : "Create Admin Account"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        Already registered?{" "}
        <Link to="/admin/login" className="text-amber-600 font-medium hover:underline">Sign in</Link>
      </p>
    </AdminAuthLayout>
  );
}