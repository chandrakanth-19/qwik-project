import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ShieldOff, ShieldCheck, Plus, Pencil, Trash2 } from "lucide-react";
import { adminAPI } from "../../api";
import { Spinner } from "../../components";

// ── User Management ───────────────────────────────────────────
export function UserManagement() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  const load = () => adminAPI.getUsers().then(({ data }) => { setUsers(data.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const toggleBlock = async (id) => {
    await adminAPI.toggleBlock(id);
    toast.success("User status updated");
    await load();
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">User Management</h1>
      <input className="input mb-4 max-w-xs" placeholder="Search by name or email..."
        value={search} onChange={(e) => setSearch(e.target.value)} />

      {filtered.length === 0
        ? <p className="text-gray-400 text-center py-12">No users found</p>
        : <div className="card divide-y divide-gray-50">
            {filtered.map((u) => (
              <div key={u._id} className={`flex items-center gap-3 p-4 ${u.is_blocked ? "opacity-60" : ""}`}>
                <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-sm flex-shrink-0">
                  {u.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{u.name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email || u.phone} · {u.hall_of_residence || "—"}</p>
                </div>
                {u.is_blocked && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Blocked</span>
                )}
                <button onClick={() => toggleBlock(u._id)}
                  className={`p-1.5 rounded-lg transition-colors ${u.is_blocked ? "text-brand-400 hover:bg-brand-50" : "text-red-400 hover:bg-red-50"}`}
                  title={u.is_blocked ? "Unblock" : "Block"}>
                  {u.is_blocked ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
                </button>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

// ── Canteen Management ────────────────────────────────────────
export function CanteenManagement() {
  const [canteens, setCanteens] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false); const [merchants, setMerchants] = useState([]);
  const [form, setForm] = useState({
    name: "", hall: "", location: "", opening_time: "08:00", closing_time: "22:00", contact: "", manager_id: "",
  });

  const load = () => adminAPI.getCanteens().then(({ data }) => { setCanteens(data.data); setLoading(false); });
  useEffect(() => {
    load();
    adminAPI.getApprovedMerchants().then(({ data }) => setMerchants(data.data));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.addCanteen(form);
      toast.success("Canteen added");
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error("Failed to add canteen");
    } finally { setSaving(false); }
  };

  const deactivate = async (id) => {
    if (!window.confirm("Deactivate this canteen?")) return;
    await adminAPI.deleteCanteen(id);
    toast.success("Canteen deactivated");
    await load();
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Canteen Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Canteen
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card p-5 mb-4 border-amber-300 border">
          <h2 className="font-semibold mb-3">New Canteen</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Canteen Name</label>
              <input className="input text-sm" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hall</label>
              <input className="input text-sm" value={form.hall}
                onChange={(e) => setForm({ ...form, hall: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Opening Time</label>
              <input className="input text-sm" type="time" value={form.opening_time}
                onChange={(e) => setForm({ ...form, opening_time: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Closing Time</label>
              <input className="input text-sm" type="time" value={form.closing_time}
                onChange={(e) => setForm({ ...form, closing_time: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact</label>
              <input className="input text-sm" value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </div>
              <div className="sm:col-span-2">
    <label className="block text-xs font-medium text-gray-600 mb-1">
      Assign to Merchant
    </label>
    <select className="input text-sm" value={form.manager_id}
      onChange={(e) => setForm({ ...form, manager_id: e.target.value })}>
      <option value="">Select merchant</option>
      {merchants.map((m) => (
        <option key={m._id} value={m._id}>{m.name} — {m.email}</option>
      ))}
    </select>
  </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? "Adding..." : "Add Canteen"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {canteens.map((c) => (
          <div key={c._id} className={`card p-4 flex items-center justify-between ${!c.is_active ? "opacity-50" : ""}`}>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{c.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_open ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {c.is_open ? "Open" : "Closed"}
                </span>
                {!c.is_active && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Deactivated</span>}
              </div>
              <p className="text-sm text-gray-500">{c.hall || c.location} · {c.manager_id?.name || "No manager"}</p>
              <p className="text-xs text-gray-400">{c.opening_time} – {c.closing_time}</p>
            </div>
            {c.is_active && (
              <button onClick={() => deactivate(c._id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
