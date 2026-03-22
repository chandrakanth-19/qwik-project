import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { canteenAPI, orderAPI } from "../../api";
import { Spinner } from "../../components";

// ── Canteen Settings ──────────────────────────────────────────
export function CanteenSettings() {
  const [canteen, setCanteen] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    canteenAPI.getMine().then(({ data }) => {
      setCanteen(data.data);
      const c = data.data;
      setForm({
        name: c.name, location: c.location || "", hall: c.hall || "",
        opening_time: c.opening_time || "08:00", closing_time: c.closing_time || "22:00",
        contact: c.contact || "",
      });
      setLoading(false);
    });
  }, []);

  const toggleOpen = async () => {
    const { data } = await canteenAPI.updateStatus(canteen._id, { is_open: !canteen.is_open });
    setCanteen(data.data);
    toast.success(`Canteen is now ${data.data.is_open ? "open" : "closed"}`);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await canteenAPI.update(canteen._id, form);
      setCanteen(data.data);
      toast.success("Settings saved");
    } catch (err) {
      toast.error("Failed to save");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6">Canteen Settings</h1>

      {/* Open/Close toggle */}
      <div className="card p-5 mb-4 flex items-center justify-between">
        <div>
          <p className="font-medium">Canteen Status</p>
          <p className="text-sm text-gray-500">Customers {canteen.is_open ? "can" : "cannot"} place orders</p>
        </div>
        <button onClick={toggleOpen} className="flex items-center gap-2">
          {canteen.is_open
            ? <ToggleRight size={36} className="text-brand-400" />
            : <ToggleLeft size={36} className="text-gray-400" />
          }
        </button>
      </div>

      {/* Details form */}
      <form onSubmit={handleSave} className="card p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Canteen Name</label>
          <input className="input" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
            <input className="input" type="time" value={form.opening_time}
              onChange={(e) => setForm({ ...form, opening_time: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
            <input className="input" type="time" value={form.closing_time}
              onChange={(e) => setForm({ ...form, closing_time: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hall / Location</label>
          <input className="input" value={form.hall}
            onChange={(e) => setForm({ ...form, hall: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
          <input className="input" type="tel" value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}

// ── Analytics ─────────────────────────────────────────────────
export function Analytics() {
  const [canteenId, setCanteenId] = useState(null);
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    canteenAPI.getMine().then(({ data }) => {
      setCanteenId(data.data._id);
      return orderAPI.getCanteenOrders(data.data._id);
    }).then(({ data }) => {
      setOrders(data.data.filter((o) => ["PAID","PREPARING","READY","COMPLETED"].includes(o.status)));
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const totalRevenue = orders.reduce((s, o) => s + o.total_amount, 0);
  const today = new Date().toDateString();
  const todayRevenue = orders
    .filter((o) => new Date(o.placed_at).toDateString() === today)
    .reduce((s, o) => s + o.total_amount, 0);

  // Item popularity
  const itemCounts = {};
  orders.forEach((o) => o.items.forEach((i) => {
    itemCounts[i.name] = (itemCounts[i.name] || 0) + i.qty;
  }));
  const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Daily revenue last 7 days
  const dailyMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dailyMap[d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })] = 0;
  }
  orders.forEach((o) => {
    const d = new Date(o.placed_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    if (d in dailyMap) dailyMap[d] += o.total_amount;
  });
  const maxRev = Math.max(...Object.values(dailyMap), 1);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Orders",    value: orders.length },
          { label: "Total Revenue",   value: `₹${totalRevenue.toFixed(0)}` },
          { label: "Today's Revenue", value: `₹${todayRevenue.toFixed(0)}` },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Revenue bar chart — last 7 days */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-sm mb-4">Revenue — last 7 days</h2>
        <div className="flex items-end gap-2 h-28">
          {Object.entries(dailyMap).map(([day, rev]) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-gray-400">₹{rev.toFixed(0)}</span>
              <div className="w-full bg-brand-400 rounded-t-sm transition-all"
                style={{ height: `${(rev / maxRev) * 80}px`, minHeight: rev > 0 ? "4px" : "0" }} />
              <span className="text-[10px] text-gray-400">{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top items */}
      <div className="card p-5">
        <h2 className="font-semibold text-sm mb-4">Top selling items</h2>
        {topItems.length === 0
          ? <p className="text-sm text-gray-400">No data yet</p>
          : topItems.map(([name, qty], i) => (
              <div key={name} className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                <span className="flex-1 text-sm">{name}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 bg-brand-400 rounded-full" style={{ width: `${(qty / topItems[0][1]) * 80}px` }} />
                  <span className="text-xs text-gray-400">{qty} sold</span>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  );
}
