import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "../../components/layout/AuthLayout";
import { authAPI } from "../../api";
import { useAuth } from "../../hooks/useAuth";

const HALLS = ["Hall 1","Hall 2","Hall 3","Hall 4","Hall 5","Hall 6","Hall 7","Hall 8","Hall 9","Hall 10","Hall 11","Hall 12","Hall 13","Hall 14","Visitors"];

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep]     = useState(
    sessionStorage.getItem("pending_reg_user_id") ? 2 : 1
  );
  const [userId, setUserId] = useState(
    sessionStorage.getItem("pending_reg_user_id") || null
  );
  const [otp, setOtp]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", role: "customer", hall_of_residence: "Hall 1", room_no: "",
  });

  const validatePhone = (phone) => {
    if (!phone) {
      setPhoneError("Phone number cannot be empty");
      return false;
    }
    // strip spaces, dashes, +91 prefix for counting digits
    const digits = phone.replace(/[\s\-\+]/g, "").replace(/^91/, "");
    if (digits.length < 10) {
      setPhoneError("Phone number is less than 10 digits");
      return false;
    }
    if (digits.length > 10) {
      setPhoneError("Phone number is more than 10 digits");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // If no email, phone is required — validate it
    if (!form.email) {
      if (!validatePhone(form.phone)) return;
    }

    // If both email and phone provided, still validate phone
    if (form.phone && !validatePhone(form.phone)) return;

    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.email) delete payload.email;
      if (!payload.phone) delete payload.phone;
      const { data } = await authAPI.register(payload);
      setUserId(data.data.user_id);
      sessionStorage.setItem("pending_reg_user_id", data.data.user_id);
      setStep(2);
      toast.success("OTP sent! Check your email or phone.");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      if (msg.toLowerCase().includes("already exists")) {
        toast.error("Account already exists. If you registered before, check your email for OTP or request a new one from the login page.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.verifyOTP({ user_id: userId, otp });
      sessionStorage.removeItem("pending_reg_user_id");
      toast.success("Account verified! Logging you in...");
      await login({ email: form.email, password: form.password });
      toast.success("Welcome to Qwik! 🎉");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) return (
    <AuthLayout title="Verify your account" subtitle="Enter the OTP we sent you">
      <form onSubmit={handleVerify} className="space-y-4">
        <input
          className="input text-center text-2xl tracking-[0.5em] font-bold"
          placeholder="------"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          required
        />
        <button type="submit" disabled={loading || otp.length < 6} className="btn-primary w-full">
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
    </AuthLayout>
  );

  return (
    <AuthLayout title="Create account" subtitle="Join Qwik — IITK Digital Canteen">
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input className="input" placeholder="Your name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select className="input" value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="customer">Student / Visitor</option>
            <option value="merchant">Canteen Merchant</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            IITK Email <span className="text-gray-400 font-normal">(students)</span>
          </label>
          <input className="input" type="email" placeholder="you@iitk.ac.in"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone <span className="text-gray-400 font-normal">(visitors — OTP via SMS)</span>
          </label>
          <input
  className={`input ${phoneError ? "border-red-500 focus:ring-red-500" : ""}`}
  type="tel"
  placeholder="9999999999"
  value={form.phone}
  onChange={(e) => {
    const digits = e.target.value.replace(/\D/g, ""); // only numbers
    if (digits.length > 10) {
      setPhoneError("Phone number cannot be larger than 10 digits");
      return; // stop typing after 10 digits
    }
    setForm({ ...form, phone: digits });
    if (phoneError) validatePhone(digits);
  }}
/>
          {/* Error message shown below the input */}
          {phoneError && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              ⚠️ {phoneError}
            </p>
          )}
        </div>

        {form.role === "customer" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hall of Residence</label>
              <select className="input" value={form.hall_of_residence}
                onChange={(e) => setForm({ ...form, hall_of_residence: e.target.value })}>
                {HALLS.map((h) => <option key={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
              <input className="input" placeholder="e.g. 101, A-204" value={form.room_no}
                onChange={(e) => setForm({ ...form, room_no: e.target.value })} />
            </div>
          </>
        )}

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

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        Already have an account?{" "}
        <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}