import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { authAPI } from "../../api";

function AdminAuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 overflow-hidden">
            <img src="/logo.png" alt="Qwik Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        </div>
        <div className="card p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}

// ── Admin Login ───────────────────────────────────────────────
export function AdminLogin() {
  const { adminLogin } = useAuth();
  const [form,         setForm]         = useState({ email: "", password: "" });
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notFound,     setNotFound]     = useState(false);
  const [wrongPass,    setWrongPass]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    setWrongPass(false);
    try {
      await adminLogin(form);
      toast.success("Welcome, Super Admin!");
    } catch (err) {
      const raw = err.response?.data?.message || "Login failed";
      const msg = raw.toLowerCase();
      if (msg.includes("invalid admin credentials") || msg.includes("check your password")) {
        setWrongPass(true);
      } else if (msg.includes("no admin account") || msg.includes("not found")) {
        setNotFound(true);
      } else {
        toast.error(raw);
      }
    } finally { setLoading(false); }
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
          <div className="relative">
            <input className="input pr-10" type={showPassword ? "text" : "password"} placeholder="••••••••"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="flex justify-end">
          <Link to="/admin/forgot-password" className="text-sm text-amber-600 hover:underline">Forgot password?</Link>
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {notFound && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-semibold mb-1">⚠️ No account found</p>
          <p className="text-xs text-red-700">No admin account exists with this email.</p>
        </div>
      )}
      {wrongPass && (
        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800 font-semibold mb-1">❌ Incorrect password</p>
          <p className="text-xs text-orange-700 mb-2">Please try again or reset your password.</p>
          <Link to="/admin/forgot-password" className="text-xs text-orange-700 font-medium hover:underline">Reset password →</Link>
        </div>
      )}
      <p className="text-center text-sm text-gray-500 mt-4">
        First time? <Link to="/admin/register" className="text-amber-600 font-medium hover:underline">Register with invite code</Link>
      </p>
    </AdminAuthLayout>
  );
}

// ── Admin Register ─────────────────────────────────────────────
export function AdminRegister() {
  const navigate = useNavigate();
  const [form,         setForm]         = useState({ name: "", email: "", password: "", invite_code: "" });
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.adminRegister(form);
      toast.success("Admin account created! Please log in.");
      navigate("/admin/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <AdminAuthLayout title="Admin Registration" subtitle="You need a valid invite code to proceed">
      <form onSubmit={handleRegister} className="space-y-4">
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
          <div className="relative">
            <input className="input pr-10" type={showPassword ? "text" : "password"} placeholder="Min 6 characters"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Invite Code</label>
          <div className="relative">
            <input className="input font-mono tracking-widest pr-10"
              type={showInviteCode ? "text" : "password"} placeholder="XXXX_XXXX_XXXX"
              value={form.invite_code} onChange={(e) => setForm({ ...form, invite_code: e.target.value })} required />
            <button type="button" onClick={() => setShowInviteCode(!showInviteCode)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showInviteCode ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50">
          {loading ? "Creating..." : "Create Admin Account"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        Already registered? <Link to="/admin/login" className="text-amber-600 font-medium hover:underline">Sign in</Link>
      </p>
    </AdminAuthLayout>
  );
}

// ── Admin Forgot Password ──────────────────────────────────────
export function AdminForgotPassword() {
  const navigate = useNavigate();
  const [step,         setStep]         = useState(1);
  const [email,        setEmail]        = useState("");
  const [userId,       setUserId]       = useState(null);
  const [otp,          setOtp]          = useState("");
  const [newPassword,  setNewPassword]  = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.forgotPassword({ email });
      setUserId(data.data.user_id);
      setStep(2);
      toast.success("OTP sent to your email!");
    } catch (err) {
      toast.error(err.response?.data?.message || "No admin account found with this email");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const { data } = await authAPI.forgotPassword({ email });
      setUserId(data.data.user_id);
      toast.success("OTP resent!");
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown((c) => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
      }, 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    } finally { setResendLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.resetPassword({ user_id: userId, otp, new_password: newPassword });
      toast.success("Password reset! Please log in.");
      navigate("/admin/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally { setLoading(false); }
  };

  if (step === 2) return (
    <AdminAuthLayout title="Reset Password" subtitle="Enter the OTP and your new password">
      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">OTP</label>
          <input className="input text-center text-2xl tracking-[0.5em] font-bold" placeholder="------"
            maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <div className="relative">
            <input className="input pr-10" type={showPassword ? "text" : "password"} placeholder="Min 6 characters"
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading || otp.length < 6}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 rounded-lg disabled:opacity-50">
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500 mb-2">Didn't receive the OTP?</p>
        <button onClick={handleResend} disabled={resendLoading || resendCooldown > 0}
          className="text-sm text-amber-600 font-medium hover:underline disabled:opacity-50">
          {resendLoading ? "Sending..." : resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : "Resend OTP"}
        </button>
      </div>
    </AdminAuthLayout>
  );

  return (
    <AdminAuthLayout title="Forgot Password" subtitle="Enter your admin email to receive a reset OTP">
      <form onSubmit={handleRequestOTP} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
          <input className="input" type="email" placeholder="admin@qwik.in"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 rounded-lg disabled:opacity-50">
          {loading ? "Sending OTP..." : "Send Reset OTP"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        <Link to="/admin/login" className="text-amber-600 font-medium hover:underline">← Back to login</Link>
      </p>
    </AdminAuthLayout>
  );
}

// ── Admin Change Password (in-session) ───────────────────────
// FIX 4: Used inside the Admin Dashboard settings page
export function AdminChangePassword() {
  const [form,      setForm]      = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [loading,   setLoading]   = useState(false);
  const [showPw,    setShowPw]    = useState({ current: false, new: false, confirm: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }
    if (form.new_password.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await authAPI.changePassword({
        current_password: form.current_password,
        new_password:     form.new_password,
      });
      toast.success("Password changed successfully!");
      setForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally { setLoading(false); }
  };

  const PasswordField = ({ label, field }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input className="input pr-10" type={showPw[field] ? "text" : "password"}
          placeholder="••••••••" required value={form[field]}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
        <button type="button" onClick={() => setShowPw((s) => ({ ...s, [field]: !s[field] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {showPw[field] ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-2 mb-6">
        <Lock size={20} className="text-amber-600" />
        <h1 className="text-xl font-bold">Change Password</h1>
      </div>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <PasswordField label="Current Password" field="current_password" />
        <PasswordField label="New Password" field="new_password" />
        <PasswordField label="Confirm New Password" field="confirm_password" />
        <button type="submit" disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 rounded-lg disabled:opacity-50">
          {loading ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
