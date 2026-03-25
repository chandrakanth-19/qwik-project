import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";  // 👈 added
import AuthLayout from "../../components/layout/AuthLayout";
import { authAPI } from "../../api";
import useAuthStore from "../../store/authStore";

const HALLS = ["Hall 1","Hall 2","Hall 3","Hall 4","Hall 5","Hall 6","Hall 7","Hall 8","Hall 9","Hall 10","Hall 11","Hall 12","Hall 13","Hall 14","Visitors"];



export default function Register() {
  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.setAuth);
  const [step, setStep]     = useState(
    sessionStorage.getItem("pending_reg_user_id") ? 2 : 1
  );
  const [userId, setUserId] = useState(
    sessionStorage.getItem("pending_reg_user_id") || null
  );
  const [pendingUser, setPendingUser] = useState(null); // store user info for auto-login
  const [otp, setOtp]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);  // 👈 added
  const [phoneError, setPhoneError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    role: "customer", hall_of_residence: "Hall 1", room_no: "",
    // Merchant extra fields (Fix 10)
    canteen_name: "", canteen_hall: "",
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.email) delete payload.email;
      if (!payload.phone) delete payload.phone;
      // Remove merchant-only fields if customer
      if (payload.role !== "merchant") {
        delete payload.canteen_name;
        delete payload.canteen_hall;
      }
      const { data } = await authAPI.register(payload);
      setUserId(data.data.user_id);
      // Save minimal info to auto-login after verify
      setPendingUser({ role: form.role, email: form.email, password: form.password });
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

  // FIX 9: After OTP verify → auto login, don't redirect to login page
  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.verifyOTP({ user_id: userId, otp });
      sessionStorage.removeItem("pending_reg_user_id");

      // FIX 9: server returns token + role on verifyOTP — use it to auto-login
      if (data.data?.token && data.data?.role) {
        // We need the full user object — fetch it or construct minimal version
        // For merchant: they can't login yet (pending admin approval) — show message
        if (data.data.role === "merchant") {
          toast.success("Account verified! Your account is pending admin approval. You'll be notified once approved.");
          navigate("/login");
        } else {
          // Auto-login for customers
          const user = data.data.user || { _id: userId, name: form.name, email: form.email, role: data.data.role };
          setAuth(user, data.data.token, data.data.role);
          toast.success("Account verified! Welcome to Qwik 🎉");
          navigate("/halls");
        }
      } else {
        toast.success("Account verified! Please log in.");
        navigate("/login");
      }
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
          {loading ? "Verifying..." : "Verify & Continue"}
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
            Phone <span className="text-gray-400 font-normal">(+91)</span>
          </label>
          <input className="input" type="tel" placeholder="9999999999"
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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

        {/* FIX 10: Merchant canteen request fields */}
        {form.role === "merchant" && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
            <p className="text-sm font-semibold text-purple-800">🏪 Canteen Access Request</p>
            <p className="text-xs text-purple-600">
              Tell us which canteen you want to manage. Admin will review and approve your request.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Canteen Name</label>
              <input className="input text-sm" placeholder="e.g. Hall 5 Canteen"
                value={form.canteen_name}
                onChange={(e) => setForm({ ...form, canteen_name: e.target.value })}
                required={form.role === "merchant"} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Canteen Location / Hall</label>
              <input className="input text-sm" placeholder="e.g. Hall 5, MT Canteen"
                value={form.canteen_hall}
                onChange={(e) => setForm({ ...form, canteen_hall: e.target.value })}
                required={form.role === "merchant"} />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            {/* 👇 replaced */}
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
