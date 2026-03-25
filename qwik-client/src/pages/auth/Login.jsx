import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";  // 👈 added
import AuthLayout from "../../components/layout/AuthLayout";
import { useAuth } from "../../hooks/useAuth";
import { authAPI } from "../../api";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm]                   = useState({ email: "", password: "" });
  const [loading, setLoading]             = useState(false);
  const [showPassword, setShowPassword] = useState(false);  // 👈 added
  const [unverified, setUnverified]       = useState(false);   // Fix 8: no flash
  const [blocked, setBlocked]             = useState(false);   // Fix 6
  const [notFound, setNotFound]           = useState(false);   // Fix 5
  const [wrongPassword, setWrongPassword]   = useState(false);   // Fix 3
  const [pendingApproval, setPendingApproval] = useState(false); // Fix 10: merchant pending
  const [userId, setUserId]               = useState(null);
  const [otpSent, setOtpSent]             = useState(false);
  const [otp, setOtp]                     = useState("");
  const [verifying, setVerifying]         = useState(false);

  const resetBanners = () => {
    setUnverified(false);
    setBlocked(false);
    setNotFound(false);
    setWrongPassword(false);
    setPendingApproval(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetBanners();
    setLoading(true);

    try {
      await login(form);
      // Fix 4: /auth/login rejects admin role server-side → won't reach here for admins
      toast.success("Welcome back!");
    } catch (err) {
      const raw = err.response?.data?.message || "Login failed";
      const msg = raw.toLowerCase();

      if (msg.includes("pending_admin_approval")) {
        // Fix 10: merchant approved email OTP but admin hasn't approved canteen yet
        setPendingApproval(true);
      } else if (msg.includes("blocked")) {
        // Fix 6
        setBlocked(true);
      } else if (msg.includes("verify") || msg.includes("verified")) {
        // Fix 8: set state BEFORE loading=false to avoid 1-frame flash
        setUnverified(true);
      } else if (msg.includes("invalid credentials") || msg.includes("check your password")) {
        // Fix 3: wrong password
        setWrongPassword(true);
      } else if (
        msg.includes("no account") ||
        msg.includes("not found") ||
        msg.includes("admin login page")
      ) {
        // Fix 5: show register prompt
        setNotFound(true);
      } else {
        toast.error(raw);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const { data } = await authAPI.forgotVerificationOTP({ email: form.email });
      setUserId(data.data.user_id);
      setOtpSent(true);
      toast.success("OTP sent! Check your email.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP.");
    } finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifying(true);
    try {
      await authAPI.verifyOTP({ user_id: userId, otp });
      toast.success("Account verified! You can now log in.");
      setUnverified(false);
      setOtpSent(false);
      setOtp("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP.");
    } finally { setVerifying(false); }
  };

  return (
    <AuthLayout title="Welcome to Qwik" subtitle="IITK Digital Canteen">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            className="input" type="email" placeholder="you@iitk.ac.in"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          {/* 👇 replaced */}
          <div className="relative">
            <input className="input pr-10" type={showPassword ? "text" : "password"} placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-brand-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* ── Fix 10: Merchant pending admin approval ── */}
      {pendingApproval && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-semibold mb-1">⏳ Pending Admin Approval</p>
          <p className="text-xs text-blue-700">
            Your account is verified, but the admin hasn't approved your canteen request yet.
            You'll be able to log in once approved. Please check back later.
          </p>
        </div>
      )}


      {/* ── Fix 3: Wrong password ── */}
      {wrongPassword && (
        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800 font-semibold mb-1">❌ Incorrect password</p>
          <p className="text-xs text-orange-700">
            The password you entered is incorrect. Please try again or reset your password.
          </p>
          <Link to="/forgot-password" className="inline-block mt-2 text-xs text-orange-700 font-medium hover:underline">
            Forgot password?
          </Link>
        </div>
      )}

      {/* ── Fix 5: Account not found ── */}
      {notFound && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-semibold mb-1">⚠️ Account not found</p>
          <p className="text-xs text-red-700 mb-3">
            You may not have registered yet, or your account may have been deleted by the admin.
            Please register to create a new account.
          </p>
          <Link
            to="/register"
            className="block w-full text-center bg-red-500 hover:bg-red-600 text-white text-sm py-2 rounded-lg"
          >
            Register Now
          </Link>
        </div>
      )}

      {/* ── Fix 6: Blocked ── */}
      {blocked && (
        <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-lg">
          <p className="text-sm text-red-800 font-semibold mb-1">🚫 Account Blocked</p>
          <p className="text-xs text-red-700">
            Your account has been blocked by the admin. Please contact support if you believe this is a mistake.
          </p>
        </div>
      )}

      {/* ── Fix 8: Unverified — rendered as stable DOM, no flash ── */}
      {unverified && !otpSent && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium mb-2">
            ⚠️ Your account is not verified yet
          </p>
          <p className="text-xs text-yellow-700 mb-3">
            Click below to receive a new OTP on your email.
          </p>
          <button
            onClick={handleResendOTP}
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? "Sending OTP..." : "Send Verification OTP"}
          </button>
        </div>
      )}

      {/* OTP entry after resend */}
      {otpSent && (
        <form
          onSubmit={handleVerify}
          className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg space-y-3"
        >
          <p className="text-sm text-green-800 font-medium">
            ✅ OTP sent! Enter it below to verify your account.
          </p>
          <input
            className="input text-center text-xl tracking-[0.5em] font-bold"
            placeholder="------"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            required
          />
          <button
            type="submit"
            disabled={verifying || otp.length < 6}
            className="w-full btn-primary"
          >
            {verifying ? "Verifying..." : "Verify Account"}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-gray-500 mt-4">
        Don't have an account?{" "}
        <Link to="/register" className="text-brand-600 font-medium hover:underline">
          Register
        </Link>
      </p>
      <p className="text-center text-sm text-gray-500 mt-1">
        Admin?{" "}
        <Link to="/admin/login" className="text-amber-600 font-medium hover:underline">
          Admin login →
        </Link>
      </p>
    </AuthLayout>
  );
}
