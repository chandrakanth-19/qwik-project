import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, ChefHat, Bell } from "lucide-react";
import { orderAPI, canteenAPI } from "../../api";
import { Spinner, OrderStatusBadge } from "../../components";
import { ORDER_STATUS } from "../../utils/constants";

const FILTERS = ["ALL", "PENDING", "ACCEPTED", "PREPARING", "READY", "COMPLETED", "REJECTED", "CANCELLED"];

export default function MerchantOrders() {
  const [canteenId, setCanteenId] = useState(null);
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("ALL");
  const [selected,  setSelected]  = useState(null); // expanded order
  const [note,      setNote]      = useState("");
  const [unavailableIds, setUnavailableIds] = useState([]);

  const load = async (cid) => {
    const { data } = await orderAPI.getCanteenOrders(cid);
    setOrders(data.data);
  };

  useEffect(() => {
    canteenAPI.getMine().then(({ data }) => {
      const c = Array.isArray(data.data) ? data.data[0] : data.data;
      setCanteenId(c._id);
      return load(c._id);
    }).finally(() => setLoading(false));

    // Poll every 5 seconds for new orders
    const id = setInterval(() => {
      if (canteenId) load(canteenId);
    }, 5000);
    return () => clearInterval(id);
  }, [canteenId]);

  const updateStatus = async (orderId, status, extra = {}) => {
    try {
      await orderAPI.updateStatus(orderId, { status, merchant_note: note, ...extra });
      toast.success(`Order ${status.toLowerCase()}`);
      setSelected(null);
      setNote("");
      setUnavailableIds([]);
      await load(canteenId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handlePartialAccept = (orderId) => {
    if (!unavailableIds.length) {
      // Full accept
      updateStatus(orderId, ORDER_STATUS.ACCEPTED);
    } else {
      updateStatus(orderId, ORDER_STATUS.PARTIALLY_ACCEPTED, { unavailable_item_ids: unavailableIds });
    }
  };

  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Incoming Orders</h1>
        <span className="text-sm text-gray-500 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
          <Bell size={12} className="inline mr-1" />
          {orders.filter((o) => o.status === "PENDING").length} pending
        </span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${filter === f ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0
        ? <p className="text-gray-400 text-sm py-12 text-center">No orders</p>
        : <div className="space-y-3">
            {filtered.map((o) => (
              <div key={o._id} className="card overflow-hidden">
                {/* Order header */}
                <div className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => setSelected(selected?._id === o._id ? null : o)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-400">#{o._id.slice(-6).toUpperCase()}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="font-medium text-sm mt-0.5">{o.user_id?.name}</p>
                    <p className="text-xs text-gray-400">{o.items.length} item(s) · ₹{o.total_amount} · {new Date(o.placed_at).toLocaleTimeString()}</p>
                  </div>
                  <span className="text-gray-400 text-lg">{selected?._id === o._id ? "▲" : "▼"}</span>
                </div>

                {/* Expanded detail */}
                {selected?._id === o._id && (
                  <div className="border-t border-gray-50 p-4 bg-gray-50">
                    {/* Items with unavailable checkboxes for PENDING orders */}
                    <div className="space-y-2 mb-3">
                      {o.items.map((item) => (
                        <div key={item.item_id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {o.status === "PENDING" && (
                              <input type="checkbox" checked={unavailableIds.includes(item.item_id?.toString())}
                                onChange={(e) => {
                                  const id = item.item_id?.toString();
                                  setUnavailableIds(e.target.checked
                                    ? [...unavailableIds, id]
                                    : unavailableIds.filter((i) => i !== id));
                                }}
                                title="Check if unavailable"
                                className="accent-red-500"
                              />
                            )}
                            <span className={!item.is_available ? "line-through text-gray-400" : ""}>{item.name} × {item.qty}</span>
                          </div>
                          <span>₹{item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>

                    {o.status === "PENDING" && (
                      <>
                        {unavailableIds.length > 0 && (
                          <p className="text-xs text-orange-600 mb-2">
                            Checked items are marked unavailable — customer will be asked to reconfirm.
                          </p>
                        )}
                        <textarea className="input text-xs mb-3" rows={2} placeholder="Optional note to customer..."
                          value={note} onChange={(e) => setNote(e.target.value)} />
                        <div className="flex gap-2">
                          <button onClick={() => handlePartialAccept(o._id)}
                            className="flex-1 flex items-center justify-center gap-1 bg-brand-400 hover:bg-brand-600 text-white text-sm py-2 rounded-lg">
                            <CheckCircle size={14} />
                            {unavailableIds.length ? "Partial Accept" : "Accept"}
                          </button>
                          <button onClick={() => updateStatus(o._id, ORDER_STATUS.REJECTED)}
                            className="flex-1 flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white text-sm py-2 rounded-lg">
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      </>
                    )}

                    {o.status === "PAID" && (
                      <button onClick={() => updateStatus(o._id, ORDER_STATUS.PREPARING)}
                        className="w-full flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 rounded-lg">
                        <ChefHat size={14} /> Start Preparing
                      </button>
                    )}

                    {o.status === "PREPARING" && (
                      <button onClick={() => updateStatus(o._id, ORDER_STATUS.READY)}
                        className="w-full flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white text-sm py-2 rounded-lg">
                        <CheckCircle size={14} /> Mark Ready for Pickup
                      </button>
                    )}

                    {o.status === "READY" && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 text-center">Waiting for customer to confirm receipt...</p>
                        <button onClick={() => updateStatus(o._id, ORDER_STATUS.COMPLETED)}
                          className="w-full flex items-center justify-center gap-1 bg-gray-700 hover:bg-gray-800 text-white text-sm py-2 rounded-lg">
                          <CheckCircle size={14} /> Mark Completed (Override)
                        </button>
                      </div>
                    )}

                    {/* Feature 3: merchant can cancel if user hasn't paid yet */}
                    {(o.status === "ACCEPTED" || o.status === "PENDING" || o.status === "AWAITING_RECONFIRM") && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={async () => {
                            if (!window.confirm("Cancel this order? The customer will be notified.")) return;
                            try {
                              await orderAPI.merchantCancel(o._id, { merchant_note: note || undefined });
                              toast.success("Order cancelled");
                              setSelected(null);
                              setNote("");
                              await load(canteenId);
                            } catch (err) {
                              toast.error(err.response?.data?.message || "Failed to cancel");
                            }
                          }}
                          className="w-full text-xs text-red-500 border border-red-200 hover:bg-red-50 py-1.5 rounded-lg transition-colors"
                        >
                          Cancel Order (not yet paid)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
      }
    </div>
  );
}
