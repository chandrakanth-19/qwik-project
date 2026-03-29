import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "../../components/layout/AuthLayout";
import { authAPI } from "../../api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep]         = useState(1);
  const [userId, setUserId]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [email, setEmail]       = useState("");
  const [otp, setOtp]           = useState("");
  const [newPwd, setNewPwd]     = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.forgotPassword({ email });
      setUserId(data.data.user_id);
      setStep(2);
      toast.success("OTP sent to your email");
    } catch (err) {
      toast.error(err.response?.data?.message || "Email not found");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const { data } = await authAPI.forgotPassword({ email });
      setUserId(data.data.user_id);
      toast.success("OTP resent to your email");
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    } finally { setResendLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.resetPassword({ user_id: userId, otp, new_password: newPwd });
      toast.success("Password reset! Please log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally { setLoading(false); }
  };

  if (step === 1) return (
    <AuthLayout title="Forgot Password" subtitle="We'll send an OTP to your email">
      <form onSubmit={handleSend} className="space-y-4">
        <input className="input" type="email" placeholder="you@iitk.ac.in"
          value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Sending..." : "Send OTP"}
        </button>
      </form>
    </AuthLayout>
  );

  return (
    <AuthLayout title="Reset Password" subtitle="Enter the OTP and your new password">
      <form onSubmit={handleReset} className="space-y-4">
        <input className="input text-center tracking-[0.4em] font-bold text-xl"
          placeholder="OTP" maxLength={6} value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} required />
        <div className="relative">
          <input className="input pr-10" type={showPassword ? "text" : "password"} placeholder="New password (min 6 chars)"
            value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required minLength={6} />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <button type="submit" disabled={loading || otp.length < 6} className="btn-primary w-full">
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      {/* Resend OTP */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500 mb-2">Didn't receive the OTP?</p>
        <button
          onClick={handleResend}
          disabled={resendLoading || resendCooldown > 0}
          className="text-sm text-brand-600 font-medium hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {resendLoading ? "Sending..." : resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : "Resend OTP"}
        </button>
      </div>
    </AuthLayout>
  );
}
