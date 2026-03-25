import { useEffect, useState } from "react";
import { canteenAPI, orderAPI } from "../../api";
import { Spinner, OrderStatusBadge } from "../../components";

export default function MerchantOrderHistory() {
  const [canteenId, setCanteenId] = useState(null);
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("ALL");
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    canteenAPI.getMine().then(({ data }) => {
      const c = Array.isArray(data.data) ? data.data[0] : data.data;
      setCanteenId(c._id);
      return orderAPI.getCanteenOrders(c._id);
    }).then(({ data }) => {
      setOrders(data.data);
      setLoading(false);
    });
  }, []);

  const FILTERS = ["ALL", "COMPLETED", "CANCELLED", "REJECTED", "PAID", "PREPARING", "READY"];

  const filtered = orders
    .filter((o) => filter === "ALL" || o.status === filter)
    .filter((o) =>
      search === "" ||
      o.user_id?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o._id.slice(-6).toLowerCase().includes(search.toLowerCase())
    );

  if (loading) return (
    <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  );

  const totalRevenue = orders
    .filter((o) => ["PAID","PREPARING","READY","COMPLETED"].includes(o.status))
    .reduce((s, o) => s + o.total_amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Order History</h1>
        <div className="text-sm text-gray-500 bg-brand-50 px-3 py-1.5 rounded-lg">
          Total revenue: <span className="font-bold text-brand-600">₹{totalRevenue.toFixed(0)}</span>
        </div>
      </div>

      {/* Search */}
      <input className="input mb-3 max-w-xs" placeholder="Search by customer or order ID..."
        value={search} onChange={(e) => setSearch(e.target.value)} />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors
              ${filter === f ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0
        ? <p className="text-gray-400 text-center py-12">No orders found</p>
        : <div className="space-y-2">
            {filtered.map((o) => (
              <div key={o._id} className="card p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-gray-400">
                    #{o._id.slice(-8).toUpperCase()}
                  </span>
                  <OrderStatusBadge status={o.status} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{o.user_id?.name}</p>
                    <p className="text-xs text-gray-400">
                      {o.items.length} item(s) · {new Date(o.placed_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="font-bold text-sm">₹{o.total_amount}</p>
                </div>
                {/* Items breakdown */}
                <div className="mt-2 pt-2 border-t border-gray-50 space-y-0.5">
                  {o.items.map((i) => (
                    <p key={i.item_id} className="text-xs text-gray-400">
                      {i.name} × {i.qty} — ₹{i.price * i.qty}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}