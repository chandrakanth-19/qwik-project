import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ShieldOff, ShieldCheck, Trash2, Pencil, Plus, X } from "lucide-react";
import { adminAPI } from "../../api";
import { Spinner } from "../../components";

export default function ManageMerchants() {
  const [merchants, setMerchants] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [editing,   setEditing]   = useState(null);
  const [showAdd,   setShowAdd]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [editForm,  setEditForm]  = useState({ name: "", email: "", phone: "" });
  const [addForm,   setAddForm]   = useState({ name: "", email: "", phone: "", password: "" });

  const load = () =>
    adminAPI.getApprovedMerchants()
      .then(({ data }) => { setMerchants(data.data); setLoading(false); });

  useEffect(() => { load(); }, []);

  const handleBlock = async (id) => {
    await adminAPI.toggleBlockMerchant(id);
    toast.success("Merchant status updated");
    await load();
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Deactivate this merchant and their canteen?")) return;
    await adminAPI.removeMerchant(id);
    toast.success("Merchant deactivated");
    await load();
  };

  const openEdit = (m) => {
    setEditing(m);
    setEditForm({ name: m.name, email: m.email || "", phone: m.phone || "" });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.updateMerchant(editing._id, editForm);
      toast.success("Merchant updated");
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setSaving(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.addMerchant(addForm);
      toast.success("Merchant added!");
      setShowAdd(false);
      setAddForm({ name: "", email: "", phone: "", password: "" });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setSaving(false); }
  };

  const filtered = merchants.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.email || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Manage Merchants</h1>
        <button onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Merchant
        </button>
      </div>

      <input className="input mb-4 max-w-xs"
        placeholder="Search by name or email..."
        value={search} onChange={(e) => setSearch(e.target.value)} />

      {/* Add Merchant Form */}
      {showAdd && (
        <div className="card p-5 mb-4 border-brand-400 border">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Add New Merchant</h2>
            <button onClick={() => setShowAdd(false)}><X size={16} /></button>
          </div>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input className="input text-sm" required value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input className="input text-sm" type="email" value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input className="input text-sm" type="tel" value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
              <input className="input text-sm" type="password" required value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary text-sm">
                {saving ? "Adding..." : "Add Merchant"}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Merchants list */}
      {filtered.length === 0
        ? <p className="text-gray-400 text-center py-12">No merchants found</p>
        : <div className="space-y-3">
            {filtered.map((m) => (
              <div key={m._id} className={`card p-4 ${m.is_blocked ? "opacity-60" : ""}`}>

                {/* Merchant info */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{m.name}</p>
                      {m.is_blocked && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                          Blocked
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{m.email || "—"} · {m.phone || "—"}</p>
                    {/* Canteen info — backend returns canteens[] array */}
                    {m.canteens?.length > 0
                      ? <p className="text-xs text-brand-600 mt-1">
                          📍 {m.canteens[0].name}
                          {(m.canteens[0].hall || m.canteens[0].location) && ` · ${m.canteens[0].hall || m.canteens[0].location}`}
                          {" · "}{m.canteens[0].is_open ? "Open" : "Closed"}
                        </p>
                      : <p className="text-xs text-gray-400 mt-1">No canteen assigned</p>
                    }
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(m)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                      title="Edit">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleBlock(m._id)}
                      className={`p-1.5 rounded-lg ${m.is_blocked ? "hover:bg-brand-50 text-brand-400" : "hover:bg-red-50 text-red-400"}`}
                      title={m.is_blocked ? "Unblock" : "Block"}>
                      {m.is_blocked ? <ShieldCheck size={15} /> : <ShieldOff size={15} />}
                    </button>
                    <button onClick={() => handleRemove(m._id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                      title="Deactivate">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Edit form inline */}
                {editing?._id === m._id && (
                  <form onSubmit={handleEdit}
                    className="mt-3 pt-3 border-t grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Name</label>
                      <input className="input text-sm" value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Email</label>
                      <input className="input text-sm" value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Phone</label>
                      <input className="input text-sm" value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                    </div>
                    <div className="sm:col-span-3 flex gap-2">
                      <button type="submit" disabled={saving} className="btn-primary text-sm py-1.5">
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button type="button" onClick={() => setEditing(null)}
                        className="btn-secondary text-sm py-1.5">
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