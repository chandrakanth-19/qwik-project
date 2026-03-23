import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../../components/layout/AuthLayout";
import { useAuth } from "../../hooks/useAuth";
import { authAPI } from "../../api";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm]           = useState({ email: "", password: "" });
  const [loading, setLoading]     = useState(false);
  const [unverified, setUnverified] = useState(false); // NEW
  const [userId, setUserId]       = useState(null);    // NEW
  const [otpSent, setOtpSent]     = useState(false);   // NEW
  const [otp, setOtp]             = useState("");       // NEW
  const [verifying, setVerifying] = useState(false);   // NEW

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setUnverified(false); // reset before each attempt
  try {
    await login(form);
    toast.success("Welcome back!");
  } 
catch (err) {
  const msg = err.response?.data?.message || err.message || "Login failed";
  if (msg.toLowerCase().includes("verify")) {
    setUnverified(true);
  } else if (msg.toLowerCase().includes("admin login page")) {
    toast.error("invalid  credentials");
  } else if (msg.toLowerCase().includes("invalid credentials") || err.response?.status === 401) {
    toast.error("Account not found or wrong password. You may not have registered yet, or your account may have been deleted by admin.");
  } else if (msg.toLowerCase().includes("blocked")) {
  toast.error("Your account has been blocked by admin. Please contact support.");
}
   else {
    toast.error(msg);
  }
} 
  finally {
    setLoading(false); // this runs but doesn't touch unverified state
  }
};

  // Resend OTP for unverified account
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

  // Verify OTP inline on login page
  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifying(true);
    try {
      await authAPI.verifyOTP({ user_id: userId, otp });
      toast.success("Account verified! Please log in now.");
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
          <input className="input" type="email" placeholder="you@iitk.ac.in"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input className="input" type="password" placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required />
        </div>
        <div className="flex justify-end">
          <Link to="/forgot-password"
            className="text-sm text-brand-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* This stays visible as long as unverified === true */}
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

      {/* OTP input after resend */}
      {otpSent && (
        <form onSubmit={handleVerify}
          className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
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
          <button type="submit" disabled={verifying || otp.length < 6}
            className="w-full btn-primary">
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
    </AuthLayout>
  );
}