import { useEffect, useState } from "react";
import { ShoppingBag, IndianRupee, Clock, CheckCircle } from "lucide-react";
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
  const [canteen, setCanteen] = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    canteenAPI.getMine().then(({ data }) => {
      setCanteen(data.data);
      return orderAPI.getCanteenOrders(data.data._id);
    }).then(({ data }) => {
      setOrders(data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!canteen) return <p className="text-gray-500">No canteen assigned yet. Contact admin.</p>;

  const today      = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.placed_at).toDateString() === today);
  const pending    = orders.filter((o) => o.status === "PENDING").length;
  const preparing  = orders.filter((o) => o.status === "PREPARING").length;
  const revenue    = todayOrders
    .filter((o) => ["PAID","PREPARING","READY","COMPLETED"].includes(o.status))
    .reduce((s, o) => s + o.total_amount, 0);

  return (
    <div>
      {/* Canteen header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{canteen.name}</h1>
          <p className="text-sm text-gray-500">{canteen.hall || canteen.location}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${canteen.is_open ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {canteen.is_open ? "● Open" : "○ Closed"}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={ShoppingBag}  label="Pending orders"  value={pending}                color="bg-yellow-400" />
        <StatCard icon={Clock}        label="Preparing"        value={preparing}              color="bg-blue-500"   />
        <StatCard icon={CheckCircle}  label="Today's orders"   value={todayOrders.length}     color="bg-brand-400"  />
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
                  o.status === "PENDING"    ? "bg-yellow-100 text-yellow-800" :
                  o.status === "PREPARING" ? "bg-blue-100 text-blue-800" :
                  o.status === "COMPLETED" ? "bg-gray-100 text-gray-600" :
                  "bg-green-100 text-green-800"}`}>
                  {o.status}
                </span>
              </div>
            ))}
          </div>
      }
    </div>
  );
}
