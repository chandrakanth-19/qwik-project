import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { userAPI } from "../../api";
import { Spinner } from "../../components";

export default function MerchantProfile() {
  const [form,    setForm]    = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    userAPI.getMe()
      .then(({ data }) => {
        const u = data.data;
        setForm({
          name:  u.name  || "",
          email: u.email || "",
          phone: u.phone || "",
        });
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load profile.");
        setLoading(false);
      });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    setSaving(true);
    try {
      await userAPI.updateMe({ name: form.name, phone: form.phone });
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  );

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-bold mb-6">My Profile</h1>
      <form onSubmit={handleSave} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input className="input" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-gray-400 text-xs">(cannot be changed)</span>
          </label>
          <input className="input bg-gray-50 cursor-not-allowed"
            value={form.email} disabled />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input className="input" type="tel" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required />
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}