import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { menuAPI, canteenAPI } from "../../api";
import { Spinner, StarRating } from "../../components";

const EMPTY = { name: "", description: "", price: "", category: "meals", is_veg: true, prep_time_mins: 15 };

export default function MenuManager() {
  const [canteenId, setCanteenId] = useState(null);
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null); // item being edited
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);

  const load = (cid) =>
    menuAPI.getMenu(cid).then(({ data }) => setItems(data.data));

  useEffect(() => {
    canteenAPI.getMine().then(({ data }) => {
      setCanteenId(data.data._id);
      return load(data.data._id);
    }).finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({ name: item.name, description: item.description, price: item.price,
               category: item.category, is_veg: item.is_veg, prep_time_mins: item.prep_time_mins });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await menuAPI.updateItem(editing._id, form);
        toast.success("Item updated");
      } else {
        await menuAPI.addItem(canteenId, form);
        toast.success("Item added");
      }
      setShowForm(false);
      await load(canteenId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this item?")) return;
    await menuAPI.deleteItem(id);
    toast.success("Item removed");
    await load(canteenId);
  };

  const toggleAvail = async (item) => {
    await menuAPI.toggleAvailability(item._id, { is_available: !item.is_available });
    await load(canteenId);
  };

  const categories = [...new Set(items.map((i) => i.category))];

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Menu Manager</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="card p-5 mb-6 border-brand-400 border">
          <h2 className="font-semibold mb-4">{editing ? "Edit Item" : "Add New Item"}</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input className="input" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input className="input" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input className="input" type="number" required min={0} value={form.price}
                onChange={(e) => setForm({ ...form, price: +e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prep time (mins)</label>
              <input className="input" type="number" min={1} value={form.prep_time_mins}
                onChange={(e) => setForm({ ...form, prep_time_mins: +e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input className="input" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. meals, snacks, beverages" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select className="input" value={form.is_veg}
                onChange={(e) => setForm({ ...form, is_veg: e.target.value === "true" })}>
                <option value="true">🌿 Vegetarian</option>
                <option value="false">🍖 Non-Vegetarian</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Saving..." : editing ? "Save Changes" : "Add Item"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Items grouped by category */}
      {categories.length === 0
        ? <p className="text-gray-400 text-center py-12">No menu items yet. Add your first item!</p>
        : categories.map((cat) => (
            <div key={cat} className="mb-6">
              <h2 className="font-semibold text-gray-600 capitalize mb-2 text-sm">{cat}</h2>
              <div className="space-y-2">
                {items.filter((i) => i.category === cat).map((item) => (
                  <div key={item._id} className={`card p-4 flex items-center gap-3 ${!item.is_available ? "opacity-60" : ""}`}>
                    {item.photo_url
                      ? <img src={item.photo_url} className="w-12 h-12 rounded-lg object-cover" alt="" />
                      : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl">
                          {item.is_veg ? "🌿" : "🍖"}
                        </div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-400 truncate">{item.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-brand-600 font-semibold text-sm">₹{item.price}</span>
                        <StarRating value={Math.round(item.avg_rating)} size={10} />
                        <span className="text-xs text-gray-400">({item.rating_count})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleAvail(item)} title={item.is_available ? "Mark unavailable" : "Mark available"}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                        {item.is_available ? <ToggleRight size={18} className="text-brand-400" /> : <ToggleLeft size={18} />}
                      </button>
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(item._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
      }
    </div>
  );
}
