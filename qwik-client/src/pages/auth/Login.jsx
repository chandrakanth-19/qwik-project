// import { useState } from "react";
// import { Link } from "react-router-dom";
// import toast from "react-hot-toast";
// import { Eye, EyeOff } from "lucide-react";  // 👈 added
// import AuthLayout from "../../components/layout/AuthLayout";
// import { useAuth } from "../../hooks/useAuth";
// import { authAPI } from "../../api";

// export default function Login() {
//   const { login } = useAuth();
//   const [form, setForm]           = useState({ email: "", password: "" });
//   const [loading, setLoading]     = useState(false);
//   const [showPassword, setShowPassword] = useState(false);  // 👈 added
//   const [unverified, setUnverified] = useState(false);
//   const [userId, setUserId]       = useState(null);
//   const [otpSent, setOtpSent]     = useState(false);
//   const [otp, setOtp]             = useState("");
//   const [verifying, setVerifying] = useState(false);

// const handleSubmit = async (e) => {
//   e.preventDefault();
//   setLoading(true);
//   setUnverified(false);
//   try {
//     await login(form);
//     toast.success("Welcome back!");
//   } 
// catch (err) {
//   const msg = err.response?.data?.message || err.message || "Login failed";
//   if (msg.toLowerCase().includes("verify")) {
//     setUnverified(true);
//   } else if (msg.toLowerCase().includes("admin login page")) {
//     toast.error("invalid  credentials");
//   } else if (msg.toLowerCase().includes("invalid credentials") || err.response?.status === 401) {
//     toast.error("Account not found or wrong password. You may not have registered yet, or your account may have been deleted by admin.");
//   } else if (msg.toLowerCase().includes("blocked")) {
//   toast.error("Your account has been blocked by admin. Please contact support.");
// }
//    else {
//     toast.error(msg);
//   }
// } 
//   finally {
//     setLoading(false);
//   }
// };

//   const handleResendOTP = async () => {
//     setLoading(true);
//     try {
//       const { data } = await authAPI.forgotVerificationOTP({ email: form.email });
//       setUserId(data.data.user_id);
//       setOtpSent(true);
//       toast.success("OTP sent! Check your email.");
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Failed to send OTP.");
//     } finally { setLoading(false); }
//   };

//   const handleVerify = async (e) => {
//     e.preventDefault();
//     setVerifying(true);
//     try {
//       await authAPI.verifyOTP({ user_id: userId, otp });
//       toast.success("Account verified! Please log in now.");
//       setUnverified(false);
//       setOtpSent(false);
//       setOtp("");
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Invalid OTP.");
//     } finally { setVerifying(false); }
//   };

//   return (
//     <AuthLayout title="Welcome to Qwik" subtitle="IITK Digital Canteen">
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//           <input className="input" type="email" placeholder="you@iitk.ac.in"
//             value={form.email}
//             onChange={(e) => setForm({ ...form, email: e.target.value })}
//             required />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
//           {/* 👇 replaced */}
//           <div className="relative">
//             <input className="input pr-10" type={showPassword ? "text" : "password"} placeholder="••••••••"
//               value={form.password}
//               onChange={(e) => setForm({ ...form, password: e.target.value })}
//               required />
//             <button type="button" onClick={() => setShowPassword(!showPassword)}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
//               {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//             </button>
//           </div>
//         </div>
//         <div className="flex justify-end">
//           <Link to="/forgot-password" className="text-sm text-brand-600 hover:underline">
//             Forgot password?
//           </Link>
//         </div>
//         <button type="submit" disabled={loading} className="btn-primary w-full">
//           {loading ? "Signing in..." : "Sign In"}
//         </button>
//       </form>

//       {unverified && !otpSent && (
//         <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
//           <p className="text-sm text-yellow-800 font-medium mb-2">
//             ⚠️ Your account is not verified yet
//           </p>
//           <p className="text-xs text-yellow-700 mb-3">
//             Click below to receive a new OTP on your email.
//           </p>
//           <button
//             onClick={handleResendOTP}
//             disabled={loading}
//             className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 rounded-lg disabled:opacity-50"
//           >
//             {loading ? "Sending OTP..." : "Send Verification OTP"}
//           </button>
//         </div>
//       )}

//       {otpSent && (
//         <form onSubmit={handleVerify}
//           className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
//           <p className="text-sm text-green-800 font-medium">
//             ✅ OTP sent! Enter it below to verify your account.
//           </p>
//           <input
//             className="input text-center text-xl tracking-[0.5em] font-bold"
//             placeholder="------"
//             maxLength={6}
//             value={otp}
//             onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
//             required
//           />
//           <button type="submit" disabled={verifying || otp.length < 6}
//             className="w-full btn-primary">
//             {verifying ? "Verifying..." : "Verify Account"}
//           </button>
//         </form>
//       )}

//       <p className="text-center text-sm text-gray-500 mt-4">
//         Don't have an account?{" "}
//         <Link to="/register" className="text-brand-600 font-medium hover:underline">
//           Register
//         </Link>
//       </p>
//     </AuthLayout>
//   );
// }
import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../../components/layout/AuthLayout";
import { useAuth } from "../../hooks/useAuth";
import { authAPI } from "../../api";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm]             = useState({ email: "", password: "" });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [unverified, setUnverified] = useState(false);
  const [userId, setUserId]         = useState(null);
  const [otpSent, setOtpSent]       = useState(false);
  const [otp, setOtp]               = useState("");
  const [verifying, setVerifying]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setUnverified(false);
    try {
      await login(form);
      toast.success("Welcome back!");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Login failed";
      if (msg.toLowerCase().includes("verify")) {
        setUnverified(true);
      } else if (msg.toLowerCase().includes("blocked")) {
        setError("Your account has been blocked by admin. Please contact support.");
      } else if (msg.toLowerCase().includes("invalid credentials") || err.response?.status === 401) {
        setError("Account not found or wrong password. You may not have registered yet.");
      } else {
        setError(msg);
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
    } finally {
      setLoading(false);
    }
  };

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
    } finally {
      setVerifying(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back!" subtitle="Sign in to continue to QWIK">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email Address</label>
          <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 gap-2 focus-within:ring-2 focus-within:ring-yellow-400 bg-white">
            <Mail size={16} className="text-gray-400 shrink-0" />
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 text-sm outline-none bg-transparent"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">Password</label>
          <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 gap-2 focus-within:ring-2 focus-within:ring-yellow-400 bg-white">
            <Lock size={16} className="text-gray-400 shrink-0" />
            <input
              type="password"
              placeholder="Enter your password"
              className="flex-1 text-sm outline-none bg-transparent"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" className="rounded" />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-sm font-semibold text-gray-800 hover:underline">
            Forgot Password?
          </Link>
        </div>

        {/* Inline error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <span className="text-red-500">⚠️</span>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Continue"}
        </button>
      </form>

      {/* Unverified account */}
      {unverified && !otpSent && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-800 font-semibold mb-1">⚠️ Account not verified yet</p>
          <p className="text-xs text-yellow-700 mb-3">Click below to receive a new OTP on your email.</p>
          <button
            onClick={handleResendOTP}
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 rounded-xl disabled:opacity-50"
          >
            {loading ? "Sending OTP..." : "Send Verification OTP"}
          </button>
        </div>
      )}

      {/* OTP input */}
      {otpSent && (
        <form onSubmit={handleVerify} className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
          <p className="text-sm text-green-800 font-semibold">✅ OTP sent! Enter it below.</p>
          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-center text-xl tracking-[0.5em] font-bold outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="------"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            required
          />
          <button
            type="submit"
            disabled={verifying || otp.length < 6}
            className="w-full bg-gray-900 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50"
          >
            {verifying ? "Verifying..." : "Verify Account"}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-gray-500 mt-5">
        Don't have an account?{" "}
        <Link to="/register" className="font-bold text-gray-900 hover:underline">Sign Up</Link>
      </p>
      <p className="text-center mt-2">
        <Link to="/admin/login" className="text-xs text-gray-400 hover:underline">Super Admin Access</Link>
      </p>
    </AuthLayout>
  );
}
