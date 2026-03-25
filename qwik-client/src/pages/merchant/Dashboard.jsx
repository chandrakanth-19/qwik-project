import { useEffect, useState } from "react";
import { ShoppingBag, IndianRupee, Clock, CheckCircle, ChevronDown } from "lucide-react";
import { orderAPI, canteenAPI } from "../../api";
import { Spinner } from "../../components";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export default function MerchantDashboard() {
  const [canteens,       setCanteens]       = useState([]);   // FIX 5: all canteens
  const [activeCanteen,  setActiveCanteen]  = useState(null); // FIX 5: selected canteen
  const [orders,         setOrders]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [ordersLoading,  setOrdersLoading]  = useState(false);

  // FIX 5: load all canteens, default to first
  useEffect(() => {
    canteenAPI.getMine()
      .then(({ data }) => {
        // API now returns array
        const list = Array.isArray(data.data) ? data.data : [data.data];
        setCanteens(list);
        setActiveCanteen(list[0]);
        return orderAPI.getCanteenOrders(list[0]._id);
      })
      .then(({ data }) => { setOrders(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // FIX 5: when merchant switches canteen, reload orders
  const switchCanteen = async (canteen) => {
    setActiveCanteen(canteen);
    setOrdersLoading(true);
    try {
      const { data } = await orderAPI.getCanteenOrders(canteen._id);
      setOrders(data.data);
    } catch (_) {}
    finally { setOrdersLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!activeCanteen) return <p className="text-gray-500 p-4">No canteen assigned yet. Contact admin.</p>;

  const today       = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.placed_at).toDateString() === today);
  const pending     = orders.filter((o) => o.status === "PENDING").length;
  const preparing   = orders.filter((o) => o.status === "PREPARING").length;
  const revenue     = todayOrders
    .filter((o) => ["PAID","PREPARING","READY","COMPLETED"].includes(o.status))
    .reduce((s, o) => s + o.total_amount, 0);

  return (
    <div>
      {/* Canteen header + FIX 5: multi-canteen dropdown */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex-1 min-w-0">
          {/* FIX 5: Show dropdown only if merchant has multiple canteens */}
          {canteens.length > 1 ? (
            <div className="mb-1">
              <p className="text-xs text-gray-400 mb-1">Viewing canteen</p>
              <div className="relative w-fit">
                <select
                  className="input pr-8 text-xl font-bold appearance-none bg-transparent border-0 border-b-2 border-brand-400 rounded-none px-0 focus:ring-0"
                  value={activeCanteen._id}
                  onChange={(e) => {
                    const c = canteens.find((c) => c._id === e.target.value);
                    if (c) switchCanteen(c);
                  }}
                >
                  {canteens.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none" />
              </div>
            </div>
          ) : (
            <h1 className="text-2xl font-bold">{activeCanteen.name}</h1>
          )}
          <p className="text-sm text-gray-500">{activeCanteen.hall || activeCanteen.location}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-sm font-medium flex-shrink-0 ${activeCanteen.is_open ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {activeCanteen.is_open ? "● Open" : "○ Closed"}
        </div>
      </div>

      {/* Stats */}
      {ordersLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={ShoppingBag}  label="Pending orders"  value={pending}                  color="bg-yellow-400" />
            <StatCard icon={Clock}        label="Preparing"        value={preparing}                color="bg-blue-500"   />
            <StatCard icon={CheckCircle}  label="Today's orders"   value={todayOrders.length}       color="bg-brand-400"  />
            <StatCard icon={IndianRupee}  label="Today's revenue"  value={`₹${revenue.toFixed(0)}`} color="bg-purple-500" />
          </div>

          {/* Recent orders */}
          <h2 className="font-semibold mb-3">Recent Orders</h2>
          {orders.slice(0, 8).length === 0
            ? <p className="text-gray-400 text-sm">No orders yet</p>
            : <div className="space-y-2">
                {orders.slice(0, 8).map((o) => (
                  <div key={o._id} className="card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{o.user_id?.name}</p>
                      <p className="text-xs text-gray-400">{o.items.length} item(s) · ₹{o.total_amount}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      o.status === "PENDING"   ? "bg-yellow-100 text-yellow-800" :
                      o.status === "PREPARING" ? "bg-blue-100 text-blue-800" :
                      o.status === "COMPLETED" ? "bg-gray-100 text-gray-600" :
                      "bg-green-100 text-green-800"}`}>
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
          }
        </>
      )}
    </div>
  );
}
