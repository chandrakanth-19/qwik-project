import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ShieldOff, ShieldCheck, Plus, Pencil, Trash2, X } from "lucide-react";
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

// -- canteen management ---
export function CanteenManagement() {
  const [canteens,  setCanteens]  = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [editing,   setEditing]   = useState(null);
  const [editForm,  setEditForm]  = useState({});
  const [saving,    setSaving]    = useState(false);

  const load = async () => {
    const [c, m] = await Promise.all([
      adminAPI.getCanteens(),
      adminAPI.getApprovedMerchants(),
    ]);
    setCanteens(c.data.data);
    setMerchants(m.data.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (c) => {
    setEditing(c);
    setEditForm({
      name:         c.name         || "",
      hall:         c.hall         || "",
      location:     c.location     || "",
      opening_time: c.opening_time || "08:00",
      closing_time: c.closing_time || "22:00",
      contact:      c.contact      || "",
      manager_id:   c.manager_id?._id || c.manager_id || "",
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.updateCanteen(editing._id, editForm);
      toast.success("Canteen updated successfully!");
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update canteen.");
    } finally { setSaving(false); }
  };

  const deactivate = async (id) => {
    if (!window.confirm("Deactivate this canteen?")) return;
    try {
      await adminAPI.deleteCanteen(id);
      toast.success("Canteen deactivated.");
      await load();
    } catch (err) {
      toast.error("Failed to deactivate canteen.");
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  );

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Canteen Management</h1>

      {canteens.length === 0
        ? <p className="text-gray-400 text-center py-12">No canteens yet</p>
        : <div className="space-y-3">
            {canteens.map((c) => (
              <div key={c._id} className={`card p-4 ${!c.is_active ? "opacity-50" : ""}`}>
                {/* Canteen header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{c.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full
                        ${c.is_open ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {c.is_open ? "Open" : "Closed"}
                      </span>
                      {!c.is_active && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                          Deactivated
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {c.hall || c.location || "—"} · {c.opening_time} – {c.closing_time}
                    </p>
                    <p className="text-xs text-gray-400">
                      Manager: {c.manager_id?.name || "None"} · {c.contact || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(c)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                      title="Edit">
                      <Pencil size={15} />
                    </button>
                    {c.is_active && (
                      <button onClick={() => deactivate(c._id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                        title="Deactivate">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline edit form */}
                {editing?._id === c._id && (
                  <form onSubmit={handleEdit}
                    className="mt-3 pt-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Canteen Name
                      </label>
                      <input className="input text-sm" value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Hall</label>
                      <input className="input text-sm" value={editForm.hall}
                        onChange={(e) => setEditForm({ ...editForm, hall: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Opening Time
                      </label>
                      <input className="input text-sm" type="time" value={editForm.opening_time}
                        onChange={(e) => setEditForm({ ...editForm, opening_time: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Closing Time
                      </label>
                      <input className="input text-sm" type="time" value={editForm.closing_time}
                        onChange={(e) => setEditForm({ ...editForm, closing_time: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Contact</label>
                      <input className="input text-sm" value={editForm.contact}
                        onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Reassign Manager
                      </label>
                      <select className="input text-sm" value={editForm.manager_id}
                        onChange={(e) => setEditForm({ ...editForm, manager_id: e.target.value })}>
                        <option value="">Keep current</option>
                        {merchants.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.name} — {m.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Manager details section */}
                    <div className="sm:col-span-2 bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-600 mb-2">
                        Current Manager Details
                      </p>
                      {c.manager_id
                        ? <div className="text-xs text-gray-500 space-y-0.5">
                            <p>Name: {c.manager_id?.name || "—"}</p>
                            <p>Email: {c.manager_id?.email || "—"}</p>
                            <p>Phone: {c.manager_id?.phone || "—"}</p>
                          </div>
                        : <p className="text-xs text-gray-400">No manager assigned</p>
                      }
                    </div>

                    <div className="sm:col-span-2 flex gap-2">
                      <button type="submit" disabled={saving} className="btn-primary text-sm">
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button type="button" onClick={() => setEditing(null)}
                        className="btn-secondary text-sm">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
      }
    </div>
  );
}