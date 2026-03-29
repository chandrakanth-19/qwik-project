import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ShieldOff, ShieldCheck, Pencil, Trash2, X, Check, Plus } from "lucide-react";
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

// ── Canteen Management ────────────────────────────────────────
export function CanteenManagement() {
  const [canteens,          setCanteens]          = useState([]);
  const [approvedMerchants, setApprovedMerchants] = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [saving,            setSaving]            = useState(false);
  const [editing,           setEditing]           = useState(null);
  const [editForm,          setEditForm]          = useState({});
  const [showAdd,           setShowAdd]           = useState(false);
  const [reactivating,      setReactivating]      = useState(null);
  const [reactivateMerchant, setReactivateMerchant] = useState("");
  const [addForm,           setAddForm]           = useState({
    name: "", hall: "", location: "", opening_time: "08:00", closing_time: "22:00", contact: "", manager_id: "",
  });

  const load = async () => {
    const [c, m] = await Promise.all([adminAPI.getCanteens(), adminAPI.getApprovedMerchants()]);
    setCanteens(c.data.data);
    setApprovedMerchants(m.data.data);
    setLoading(false);
  };

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
      manager_id:   c.manager_id?._id || "",
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
      toast.error(err.response?.data?.message || "Failed to update canteen");
    } finally { setSaving(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.addCanteen(addForm);
      toast.success("Canteen created!");
      setShowAdd(false);
      setAddForm({ name: "", hall: "", location: "", opening_time: "08:00", closing_time: "22:00", contact: "", manager_id: "" });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create canteen");
    } finally { setSaving(false); }
  };

  const deactivate = async (id) => {
    if (!window.confirm("Deactivate this canteen? It will become unavailable to customers.")) return;
    await adminAPI.deleteCanteen(id);
    toast.success("Canteen deactivated");
    await load();
  };

  const handleReactivate = async (id) => {
    if (!reactivateMerchant) {
      toast.error("Please select a merchant to assign before reactivating");
      return;
    }
    setSaving(true);
    try {
      await adminAPI.reactivateCanteen(id, { manager_id: reactivateMerchant });
      toast.success("Canteen reactivated and merchant assigned!");
      setReactivating(null);
      setReactivateMerchant("");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reactivate");
    } finally { setSaving(false); }
  };

  const handleHardDelete = async (id, name) => {
    if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    try {
      await adminAPI.hardDeleteCanteen(id);
      toast.success("Canteen permanently deleted");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Canteen Management</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Canteen
        </button>
      </div>

      {/* Add Canteen form */}
      {showAdd && (
        <div className="card p-5 mb-4 border-brand-400 border">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Create New Canteen</h2>
            <button onClick={() => setShowAdd(false)}><X size={16} /></button>
          </div>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Canteen Name *</label>
              <input className="input text-sm" required value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="e.g. Hall 5 Canteen" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assign Merchant *</label>
              <select className="input text-sm" required value={addForm.manager_id}
                onChange={(e) => setAddForm({ ...addForm, manager_id: e.target.value })}>
                <option value="">— Select approved merchant —</option>
                {approvedMerchants.map((m) => (
                  <option key={m._id} value={m._id}>{m.name} ({m.email || m.phone})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hall / Building</label>
              <input className="input text-sm" value={addForm.hall}
                onChange={(e) => setAddForm({ ...addForm, hall: e.target.value })} placeholder="e.g. Hall 5" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Location / Address</label>
              <input className="input text-sm" value={addForm.location}
                onChange={(e) => setAddForm({ ...addForm, location: e.target.value })} placeholder="e.g. Near MT Gate" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Opening Time</label>
              <input className="input text-sm" type="time" value={addForm.opening_time}
                onChange={(e) => setAddForm({ ...addForm, opening_time: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Closing Time</label>
              <input className="input text-sm" type="time" value={addForm.closing_time}
                onChange={(e) => setAddForm({ ...addForm, closing_time: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact</label>
              <input className="input text-sm" value={addForm.contact}
                onChange={(e) => setAddForm({ ...addForm, contact: e.target.value })} placeholder="Phone number" />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary text-sm">
                {saving ? "Creating..." : "Create Canteen"}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {canteens.length === 0 && (
          <p className="text-gray-400 text-center py-12">No canteens yet.</p>
        )}
        {canteens.map((c) => (
          <div key={c._id} className={`card overflow-hidden ${!c.is_active ? "border border-red-100" : ""}`}>
            <div className="p-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-semibold ${!c.is_active ? "text-gray-400" : ""}`}>{c.name}</p>
                  {c.is_active ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_open ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {c.is_open ? "Open" : "Closed"}
                    </span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                      ⚠ Deactivated
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {c.hall || c.location || "—"} · Manager: {c.manager_id?.name || <span className="text-red-400">None</span>}
                </p>
                <p className="text-xs text-gray-400">{c.opening_time} – {c.closing_time} · {c.contact || "No contact"}</p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Edit — always available */}
                <button
                  onClick={() => editing === c._id ? setEditing(null) : openEdit(c)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                  title="Edit canteen"
                >
                  {editing === c._id ? <X size={15} /> : <Pencil size={15} />}
                </button>

                {/* Deactivate — only when active */}
                {c.is_active && (
                  <button onClick={() => deactivate(c._id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg" title="Deactivate canteen">
                    <Trash2 size={15} />
                  </button>
                )}

                {/* Reactivate + permanent delete — only when deactivated */}
                {!c.is_active && (
                  <>
                    <button
                      onClick={() => { setReactivating(reactivating === c._id ? null : c._id); setReactivateMerchant(""); }}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium"
                      title="Reactivate canteen"
                    >
                      Reactivate
                    </button>
                    <button
                      onClick={() => handleHardDelete(c._id, c.name)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      title="Permanently delete canteen"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Reactivate panel */}
            {!c.is_active && reactivating === c._id && (
              <div className="border-t bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800 mb-3">Assign a merchant to reactivate this canteen</p>
                <div className="flex gap-2 items-end flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Select Merchant *</label>
                    <select className="input text-sm" value={reactivateMerchant}
                      onChange={(e) => setReactivateMerchant(e.target.value)}>
                      <option value="">— Select approved merchant —</option>
                      {approvedMerchants.map((m) => (
                        <option key={m._id} value={m._id}>{m.name} ({m.email || m.phone})</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleReactivate(c._id)}
                    disabled={saving || !reactivateMerchant}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg disabled:opacity-50"
                  >
                    {saving ? "Reactivating..." : "Confirm Reactivate"}
                  </button>
                  <button onClick={() => setReactivating(null)} className="btn-secondary text-sm">Cancel</button>
                </div>
              </div>
            )}

            {/* Inline edit form — works for active AND deactivated canteens */}
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
                    <label className="block text-xs font-medium text-gray-600 mb-1">Assign Merchant</label>
                    <select className="input text-sm" value={editForm.manager_id}
                      onChange={(e) => setEditForm({ ...editForm, manager_id: e.target.value })}>
                      <option value="">— No change —</option>
                      {approvedMerchants.map((m) => (
                        <option key={m._id} value={m._id}>{m.name} ({m.email || m.phone})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Hall</label>
                    <input className="input text-sm" value={editForm.hall}
                      onChange={(e) => setEditForm({ ...editForm, hall: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                    <input className="input text-sm" value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
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
                  <button onClick={() => handleEdit(c._id)} disabled={saving}
                    className="btn-primary text-sm flex items-center gap-1">
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
