import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ToggleLeft, ToggleRight, Clock } from "lucide-react";
import { canteenAPI, orderAPI } from "../../api";
import { Spinner } from "../../components";

// ── Canteen Settings ──────────────────────────────────────────
export function CanteenSettings() {
  const [canteen, setCanteen] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    canteenAPI.getMine().then(({ data }) => {
      const c = Array.isArray(data.data) ? data.data[0] : data.data;
      setCanteen(c);
      setForm({
        name: c.name, location: c.location || "", hall: c.hall || "",
        opening_time: c.opening_time || "08:00", closing_time: c.closing_time || "22:00",
        contact: c.contact || "",
      });
      setLoading(false);
    });
  }, []);

  /**
   * Toggle logic:
   *   - If currently in "auto" mode (manual_override === null):
   *       → schedule is open  → clicking closes it  (action: "close")
   *       → schedule is closed → clicking opens it  (action: "open")
   *   - If merchant has force-opened (manual_override === true):
   *       → clicking goes back to auto              (action: "auto")
   *   - If merchant has force-closed (manual_override === false):
   *       → clicking goes back to auto              (action: "auto")
   *
   * This means one tap always moves toward "normal" behaviour,
   * and a second tap takes you to the opposite override if needed.
   */
  const toggleOpen = async () => {
    setToggling(true);
    try {
      let action;
      const override = canteen.manual_override; // true | false | null

      if (override === null) {
        // Following schedule — toggle against the schedule
        action = canteen.schedule_open ? "close" : "open";
      } else {
        // Already overridden — one tap goes back to auto (schedule)
        action = "auto";
      }

      const { data } = await canteenAPI.updateStatus(canteen._id, action);
      setCanteen(data.data);

      const c = data.data;
      if (c.manual_override === null) {
        toast.success(`Back to schedule — canteen is ${c.is_open ? "open" : "closed"}`);
      } else {
        toast.success(`Canteen manually ${c.is_open ? "opened" : "closed"}`);
      }
    } catch (err) {
      toast.error("Failed to update canteen status. Please try again.");
    } finally {
      setToggling(false);
    }
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

  // Derive display state
  const isOpen      = canteen.is_open;
  const isOverride  = canteen.manual_override !== null && canteen.manual_override !== undefined;
  const scheduleOpen = canteen.schedule_open;

  // Sub-label: tell the merchant what mode they're in
  let statusLabel;
  if (isOverride) {
    statusLabel = isOpen
      ? "Manually opened (outside schedule)"
      : "Manually closed (overriding schedule)";
  } else {
    statusLabel = scheduleOpen
      ? "Open — following your schedule"
      : "Closed — following your schedule";
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6">Canteen Settings</h1>

      {/* Open/Close toggle */}
      <div className="card p-5 mb-4 flex items-center justify-between">
        <div>
          <p className="font-medium">Canteen Status</p>
          <p className="text-sm text-gray-500">{statusLabel}</p>
          {isOverride && (
            <p className="text-xs text-brand-500 mt-1 flex items-center gap-1">
              <Clock size={11} />
              Tap again to return to schedule
            </p>
          )}
        </div>
        <button
          onClick={toggleOpen}
          disabled={toggling}
          className="flex items-center gap-2 disabled:opacity-50"
        >
          {isOpen
            ? <ToggleRight size={36} className="text-brand-400" />
            : <ToggleLeft  size={36} className="text-gray-400"  />
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
      const c = Array.isArray(data.data) ? data.data[0] : data.data;
      setCanteenId(c._id);
      return orderAPI.getCanteenOrders(c._id);
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
