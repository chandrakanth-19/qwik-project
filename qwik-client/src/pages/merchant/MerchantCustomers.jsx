import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ShieldOff, ShieldCheck, Users } from "lucide-react";
import api from "../../api/axios";
import { Spinner } from "../../components";

export default function MerchantCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [toggling,  setToggling]  = useState(null);

  const load = () =>
    api.get("/users/canteen-customers").then(({ data }) => {
      setCustomers(data.data);
      setLoading(false);
    });

  useEffect(() => { load(); }, []);

  const handleToggle = async (customer) => {
    setToggling(customer._id);
    try {
      await api.put(`/users/${customer._id}/merchant-block`);
      toast.success(`Customer ${customer.is_blocked ? "unblocked" : "blocked"}`);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update customer status");
    } finally {
      setToggling(null);
    }
  };

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search)
  );

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Users size={20} className="text-purple-600" />
        <h1 className="text-xl font-bold">Canteen Customers</h1>
      </div>

      <p className="text-sm text-gray-500 mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        These are customers who have placed orders at your canteen. You can block a customer to prevent them from ordering again.
      </p>

      <input
        className="input mb-4 max-w-xs"
        placeholder="Search by name, email or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>{search ? "No customers match your search" : "No customers have ordered yet"}</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-50">
          {filtered.map((c) => (
            <div
              key={c._id}
              className={`flex items-center gap-3 p-4 ${c.is_blocked ? "opacity-60" : ""}`}
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-sm flex-shrink-0">
                {c.name?.[0]?.toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{c.name}</p>
                  {c.is_blocked && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      Blocked
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {c.email || c.phone}
                  {c.hall_of_residence ? ` · ${c.hall_of_residence}` : ""}
                </p>
              </div>

              {/* Block / Unblock button */}
              <button
                onClick={() => handleToggle(c)}
                disabled={toggling === c._id}
                className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                  c.is_blocked
                    ? "text-brand-400 hover:bg-brand-50"
                    : "text-red-400 hover:bg-red-50"
                }`}
                title={c.is_blocked ? "Unblock customer" : "Block customer"}
              >
                {toggling === c._id ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : c.is_blocked ? (
                  <ShieldCheck size={16} />
                ) : (
                  <ShieldOff size={16} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4 text-center">
        {filtered.length} customer{filtered.length !== 1 ? "s" : ""} shown
      </p>
    </div>
  );
}
