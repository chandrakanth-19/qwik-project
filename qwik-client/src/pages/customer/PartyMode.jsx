import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { PartyPopper, Cake, UtensilsCrossed } from "lucide-react";
import { canteenAPI, reservationAPI } from "../../api";
import { Spinner } from "../../components";

export default function PartyMode() {
  const [tab, setTab]         = useState("table"); // "table" | "cake"
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [tableForm, setTableForm] = useState({ canteen_id: "", date: "", time_slot: "", party_size: 2 });
  const [cakeForm,  setCakeForm]  = useState({ canteen_id: "", date: "", time_slot: "", cake_details: { flavor: "", message: "", size: "1kg" } });

  useEffect(() => {
    canteenAPI.getAll().then(({ data }) => { setCanteens(data.data); setLoading(false); });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = tab === "table"
        ? { ...tableForm, type: "table" }
        : { ...cakeForm,  type: "cake_order" };
      await reservationAPI.create(payload);
      toast.success("Reservation request sent to merchant!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 mb-6">
        <PartyPopper className="text-pink-500" size={24} />
        <h1 className="text-xl font-bold">Party Mode</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "table", label: "Table Reservation", icon: UtensilsCrossed },
          { key: "cake",  label: "Cake Pre-Order",    icon: Cake },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              tab === key ? "bg-pink-500 text-white border-pink-500" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            <Icon size={16} />{label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="card p-5 space-y-4">
        {/* Common fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Canteen</label>
          <select className="input" required
            value={tab === "table" ? tableForm.canteen_id : cakeForm.canteen_id}
            onChange={(e) => tab === "table"
              ? setTableForm({ ...tableForm, canteen_id: e.target.value })
              : setCakeForm({ ...cakeForm, canteen_id: e.target.value })}>
            <option value="">Select canteen</option>
            {canteens.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input className="input" type="date" required min={minDate}
              value={tab === "table" ? tableForm.date : cakeForm.date}
              onChange={(e) => tab === "table"
                ? setTableForm({ ...tableForm, date: e.target.value })
                : setCakeForm({ ...cakeForm, date: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input className="input" type="time" required
              value={tab === "table" ? tableForm.time_slot : cakeForm.time_slot}
              onChange={(e) => tab === "table"
                ? setTableForm({ ...tableForm, time_slot: e.target.value })
                : setCakeForm({ ...cakeForm, time_slot: e.target.value })} />
          </div>
        </div>

        {/* Table-specific */}
        {tab === "table" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of people</label>
            <input className="input" type="number" min={1} max={100}
              value={tableForm.party_size}
              onChange={(e) => setTableForm({ ...tableForm, party_size: +e.target.value })} />
          </div>
        )}

        {/* Cake-specific */}
        {tab === "cake" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Flavor</label>
              <input className="input" placeholder="e.g. Chocolate, Vanilla, Strawberry"
                value={cakeForm.cake_details.flavor}
                onChange={(e) => setCakeForm({ ...cakeForm, cake_details: { ...cakeForm.cake_details, flavor: e.target.value } })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message on cake</label>
              <input className="input" placeholder="e.g. Happy Birthday Raj!"
                value={cakeForm.cake_details.message}
                onChange={(e) => setCakeForm({ ...cakeForm, cake_details: { ...cakeForm.cake_details, message: e.target.value } })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <select className="input"
                value={cakeForm.cake_details.size}
                onChange={(e) => setCakeForm({ ...cakeForm, cake_details: { ...cakeForm.cake_details, size: e.target.value } })}>
                <option>500g</option><option>1kg</option><option>1.5kg</option><option>2kg</option>
              </select>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg">
              ⏰ Cake orders must be placed at least 4 hours in advance.
            </p>
          </>
        )}

        <button type="submit" disabled={submitting}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
          {submitting ? "Sending request..." : "Send Request"}
        </button>
      </form>
    </div>
  );
}
