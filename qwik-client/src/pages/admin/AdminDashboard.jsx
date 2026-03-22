import { useEffect, useState } from "react";
import { Users, Store, ShoppingBag, UserCheck } from "lucide-react";
import { adminAPI } from "../../api";
import { Spinner } from "../../components";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold">{value ?? "—"}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats,    setStats]    = useState(null);
  const [pending,  setPending]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([adminAPI.getDashboard(), adminAPI.getPendingMerchants()])
      .then(([s, p]) => { setStats(s.data.data); setPending(p.data.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">System Overview</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users}     label="Total customers"  value={stats?.totalUsers}     color="bg-blue-500"   />
        <StatCard icon={Store}     label="Active canteens"  value={stats?.totalCanteens}  color="bg-brand-400"  />
        <StatCard icon={ShoppingBag} label="Total orders"   value={stats?.totalOrders}    color="bg-purple-500" />
        <StatCard icon={UserCheck} label="Pending approvals" value={stats?.pendingMerchants} color="bg-amber-500" />
      </div>

      {/* Pending merchants quick view */}
      {pending.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold mb-3">Pending Merchant Approvals</h2>
          <div className="space-y-2">
            {pending.slice(0, 5).map((m) => (
              <div key={m._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-sm">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.email}</p>
                </div>
                <a href="/admin/approvals" className="text-xs text-amber-600 font-medium hover:underline">Review →</a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
