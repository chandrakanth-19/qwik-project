import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Lock } from "lucide-react";
import { userAPI, authAPI } from "../../api";
import { Spinner } from "../../components";
import useAuthStore from "../../store/authStore";

export default function MerchantProfile() {
  const { user, setAuth, token, role } = useAuthStore();
  // FIX 4: email is intentionally excluded from the editable form
  const [form,   setForm]   = useState({ name: "", phone: "" });
  const [email,  setEmail]  = useState(""); // display-only
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const [showPw,    setShowPw]    = useState(false);
  const [pwForm,    setPwForm]    = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    userAPI.getMe().then(({ data }) => {
      const u = data.data;
      setForm({
        name:  u.name  || "",
        phone: (u.phone || "").replace(/\D/g, "").slice(-10),
      });
      setEmail(u.email || "");
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.phone || form.phone.replace(/\D/g, "").length !== 10) {
      setPhoneError("Phone number is required and must be exactly 10 digits");
      return;
    }
    setSaving(true);
    try {
      // email is NOT sent — backend also ignores it for non-merchant roles,
      // but we explicitly exclude it here so merchants can't change it either.
      const { data } = await userAPI.updateMe({ name: form.name, phone: form.phone });
      setAuth(data.data, token, role);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }
    if (pwForm.new_password.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setPwLoading(true);
    try {
      await authAPI.changePassword({
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      });
      toast.success("Password changed successfully!");
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      setShowPw(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally { setPwLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-xl font-bold">My Profile</h1>

      {/* Profile info */}
      <form onSubmit={handleSave} className="card p-6 space-y-4">
        {/* Avatar */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xl">
            {form.name?.[0]?.toUpperCase() || "M"}
          </div>
          <div>
            <p className="font-semibold">{form.name || "Merchant"}</p>
            <p className="text-xs text-gray-500">Canteen Manager</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input className="input" placeholder="Your name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>

        {/* FIX 4: Email is read-only — shown for reference but cannot be edited */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-gray-400 font-normal text-xs">(cannot be changed)</span>
          </label>
          <input
            className="input bg-gray-50 text-gray-500 cursor-not-allowed"
            type="email"
            value={email}
            readOnly
            tabIndex={-1}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input className="input" type="tel" placeholder="9999999999" maxLength={10} required
            value={form.phone}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              setForm({ ...form, phone: val });
              if (!val) setPhoneError("Phone number is required");
              else if (val.length !== 10) setPhoneError("Phone number must be exactly 10 digits");
              else setPhoneError("");
            }}
          />
          {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
        </div>

        <button
          type="submit"
          disabled={saving || form.phone.replace(/\D/g, "").length !== 10}
          className="btn-primary w-full"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Change password */}
      <div className="card p-6">
        <button
          onClick={() => setShowPw((v) => !v)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-gray-500" />
            <span className="font-semibold text-sm text-gray-700">Change Password</span>
          </div>
          <span className="text-xs text-purple-600">{showPw ? "Cancel ▲" : "Change ▼"}</span>
        </button>

        {showPw && (
          <form onSubmit={handleChangePassword} className="mt-4 space-y-3 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input className="input" type="password" placeholder="••••••••" required
                value={pwForm.current_password}
                onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input className="input" type="password" placeholder="Min 6 characters" required minLength={6}
                value={pwForm.new_password}
                onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input className="input" type="password" placeholder="Repeat new password" required
                value={pwForm.confirm_password}
                onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })} />
            </div>
            <button type="submit" disabled={pwLoading} className="btn-primary w-full">
              {pwLoading ? "Changing..." : "Change Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
