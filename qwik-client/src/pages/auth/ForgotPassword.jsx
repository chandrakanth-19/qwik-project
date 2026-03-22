import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../../components/layout/AuthLayout";
import { authAPI } from "../../api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(1);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail]   = useState("");
  const [otp, setOtp]       = useState("");
  const [newPwd, setNewPwd] = useState("");

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
        <input className="input" type="password" placeholder="New password (min 6 chars)"
          value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required minLength={6} />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </AuthLayout>
  );
}
