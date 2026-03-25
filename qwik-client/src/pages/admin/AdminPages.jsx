import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ShieldOff, ShieldCheck, Pencil, Trash2, X, Check } from "lucide-react";
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
// FIX 1: Removed "Add Canteen" button (canteens are created via merchant approval flow)
//         Admin can only Edit and Deactivate existing canteens
export function CanteenManagement() {
  const [canteens,  setCanteens]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [editing,   setEditing]   = useState(null);  // canteen being edited
  const [editForm,  setEditForm]  = useState({});

  const load = () =>
    adminAPI.getCanteens().then(({ data }) => { setCanteens(data.data); setLoading(false); });

  useEffect(() => { load(); }, []);

  const openEdit = (c) => {
    setEditing(c._id);
    setEditForm({
      name:         c.name,
      hall:         c.hall || "",
      location:     c.location || "",
      opening_time: c.opening_time || "08:00",
      closing_time: c.closing_time || "22:00",
      contact:      c.contact || "",
    });
  };

  const handleEdit = async (id) => {
    setSaving(true);
    try {
      await adminAPI.updateCanteen(id, editForm);
      toast.success("Canteen updated");
      setEditing(null);
      await load();
    } catch (err) {
      toast.error("Failed to update canteen");
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
        {/* FIX 1: No "Add Canteen" button — canteens created automatically on merchant approval */}
        <p className="text-xs text-gray-400">Canteens are created when merchants are approved</p>
      </div>

      <div className="space-y-3">
        {canteens.length === 0 && (
          <p className="text-gray-400 text-center py-12">No canteens yet. Approve a merchant to create one.</p>
        )}
        {canteens.map((c) => (
          <div key={c._id} className={`card overflow-hidden ${!c.is_active ? "opacity-50" : ""}`}>
            {/* Canteen summary row */}
            <div className="p-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{c.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_open ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.is_open ? "Open" : "Closed"}
                  </span>
                  {!c.is_active && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Deactivated</span>}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {c.hall || c.location || "—"} · Manager: {c.manager_id?.name || "None"}
                </p>
                <p className="text-xs text-gray-400">{c.opening_time} – {c.closing_time} · {c.contact || "No contact"}</p>
              </div>

              {c.is_active && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* FIX 1: Edit button */}
                  <button
                    onClick={() => editing === c._id ? setEditing(null) : openEdit(c)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                    title="Edit canteen"
                  >
                    {editing === c._id ? <X size={15} /> : <Pencil size={15} />}
                  </button>
                  <button onClick={() => deactivate(c._id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg" title="Deactivate">
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Inline edit form */}
            {editing === c._id && (
              <div className="border-t bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Edit Canteen Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Canteen Name</label>
                    <input className="input text-sm" value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Hall</label>
                    <input className="input text-sm" value={editForm.hall}
                      onChange={(e) => setEditForm({ ...editForm, hall: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Opening Time</label>
                    <input className="input text-sm" type="time" value={editForm.opening_time}
                      onChange={(e) => setEditForm({ ...editForm, opening_time: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Closing Time</label>
                    <input className="input text-sm" type="time" value={editForm.closing_time}
                      onChange={(e) => setEditForm({ ...editForm, closing_time: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Contact</label>
                    <input className="input text-sm" value={editForm.contact}
                      onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(c._id)}
                    disabled={saving}
                    className="btn-primary text-sm flex items-center gap-1"
                  >
                    <Check size={14} /> {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button onClick={() => setEditing(null)} className="btn-secondary text-sm">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
