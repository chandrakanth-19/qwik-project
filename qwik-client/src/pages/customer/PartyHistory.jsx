import { useEffect, useState } from "react";
import { Cake, UtensilsCrossed } from "lucide-react";
import { reservationAPI } from "../../api";
import { Spinner } from "../../components";

const STATUS_COLORS = {
  PENDING:   "bg-yellow-100 text-yellow-800",
  APPROVED:  "bg-green-100 text-green-800",
  REJECTED:  "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  COMPLETED: "bg-gray-100 text-gray-600",
};

export default function PartyHistory() {
  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState("ALL");

  useEffect(() => {
    reservationAPI.mine()
      .then(({ data }) => { setReservations(data.data); setLoading(false); });
  }, []);

  const filtered = filter === "ALL"
    ? reservations
    : reservations.filter((r) => r.status === filter);

  if (loading) return (
    <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  );

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Party Mode History</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED", "COMPLETED"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors
              ${filter === f ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0
        ? <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🎉</p>
            <p>No party reservations yet</p>
          </div>
        : <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r._id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {r.type === "cake_order"
                      ? <Cake size={16} className="text-pink-500" />
                      : <UtensilsCrossed size={16} className="text-purple-500" />
                    }
                    <span className="font-medium text-sm capitalize">
                      {r.type.replace("_", " ")}
                    </span>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>
                    {r.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-1">
                  📍 {r.canteen_id?.name} · {r.canteen_id?.hall || "—"}
                </p>
                <p className="text-sm text-gray-500">
                  📅 {new Date(r.date).toLocaleDateString()} @ {r.time_slot}
                </p>

                {r.type === "table" && (
                  <p className="text-xs text-gray-400 mt-1">
                    👥 {r.party_size} people
                  </p>
                )}

                {r.type === "cake_order" && r.cake_details && (
                  <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                    <p>🎂 {r.cake_details.flavor} · {r.cake_details.size}</p>
                    {r.cake_details.message && (
                      <p>✉️ "{r.cake_details.message}"</p>
                    )}
                  </div>
                )}

                {r.merchant_note && (
                  <p className="text-xs text-orange-600 mt-2 bg-orange-50 p-2 rounded">
                    Merchant note: {r.merchant_note}
                  </p>
                )}

                {/* Cancel button for pending reservations */}
                {r.status === "PENDING" && (
                  <button
                    onClick={async () => {
                      await reservationAPI.cancel(r._id);
                      setReservations((prev) =>
                        prev.map((res) =>
                          res._id === r._id ? { ...res, status: "CANCELLED" } : res
                        )
                      );
                    }}
                    className="mt-3 text-xs text-red-500 hover:underline"
                  >
                    Cancel reservation
                  </button>
                )}
              </div>
            ))}
          </div>
      }
    </div>
  );
}