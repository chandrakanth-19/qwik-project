import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Cake, UtensilsCrossed, CheckCircle, XCircle } from "lucide-react";
import { reservationAPI, canteenAPI } from "../../api";
import { Spinner } from "../../components";

const STATUS_COLORS = {
  PENDING:   "bg-yellow-100 text-yellow-800",
  APPROVED:  "bg-green-100 text-green-800",
  REJECTED:  "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  COMPLETED: "bg-gray-100 text-gray-600",
};

export default function PartyRequests() {
  const [canteenId, setCanteenId] = useState(null);
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("ALL");

  const load = (cid) =>
    reservationAPI.getCanteenReservations(cid).then(({ data }) => setRequests(data.data));

  useEffect(() => {
    canteenAPI.getMine().then(({ data }) => {
      const c = Array.isArray(data.data) ? data.data[0] : data.data;
      setCanteenId(c._id);
      return load(c._id);
    }).finally(() => setLoading(false));
  }, []);

  const update = async (id, status) => {
    try {
      await reservationAPI.updateStatus(id, { status });
      toast.success(`Request ${status.toLowerCase()}`);
      await load(canteenId);
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  const filtered = filter === "ALL" ? requests : requests.filter((r) => r.status === filter);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Party Requests</h1>

      <div className="flex gap-2 flex-wrap mb-4">
        {["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${filter === f ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0
        ? <p className="text-gray-400 text-sm text-center py-12">No requests</p>
        : <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r._id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {r.type === "cake_order"
                      ? <Cake size={16} className="text-pink-500" />
                      : <UtensilsCrossed size={16} className="text-purple-500" />
                    }
                    <span className="font-medium text-sm capitalize">{r.type.replace("_", " ")}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(r.date).toLocaleDateString()} @ {r.time_slot}</p>
                </div>

                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  <p><span className="text-gray-400">Customer:</span> {r.user_id?.name} · {r.user_id?.email || r.user_id?.phone}</p>
                  {r.type === "table" && <p><span className="text-gray-400">Party size:</span> {r.party_size} people</p>}
                  {r.type === "cake_order" && r.cake_details && (
                    <>
                      <p><span className="text-gray-400">Flavor:</span> {r.cake_details.flavor}</p>
                      <p><span className="text-gray-400">Message:</span> {r.cake_details.message}</p>
                      <p><span className="text-gray-400">Size:</span> {r.cake_details.size}</p>
                    </>
                  )}
                </div>

                {r.status === "PENDING" && (
                  <div className="flex gap-2">
                    <button onClick={() => update(r._id, "APPROVED")}
                      className="flex-1 flex items-center justify-center gap-1 bg-brand-400 hover:bg-brand-600 text-white text-sm py-2 rounded-lg">
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button onClick={() => update(r._id, "REJECTED")}
                      className="flex-1 flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white text-sm py-2 rounded-lg">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
                {r.status === "APPROVED" && (
                  <button onClick={() => update(r._id, "COMPLETED")}
                    className="w-full bg-gray-700 hover:bg-gray-800 text-white text-sm py-2 rounded-lg">
                    Mark Completed
                  </button>
                )}
              </div>
            ))}
          </div>
      }
    </div>
  );
}
