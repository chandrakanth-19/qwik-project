import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { userAPI } from "../../api";
import { Spinner } from "../../components";
import useAuthStore from "../../store/authStore";

export default function MerchantProfile() {
  const { user, setAuth, token, role } = useAuthStore();
  const [form, setForm]       = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    userAPI.getMe().then(({ data }) => {
      const u = data.data;
      setForm({
        name:  u.name  || "",
        email: u.email || "",
        phone: u.phone || "",
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await userAPI.updateMe(form);
      // Update auth store so sidebar name stays in sync
      setAuth(data.data, token, role);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-bold mb-6">My Profile</h1>

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
          <input
            className="input"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            className="input"
            type="tel"
            placeholder="+91 9999999999"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
