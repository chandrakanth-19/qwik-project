import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Minus, Plus, Trash2 } from "lucide-react";
import useCartStore from "../../store/cartStore";
import { orderAPI, paymentAPI, userAPI } from "../../api";
import { Spinner, OrderStatusBadge } from "../../components";
import { usePolling } from "../../hooks/usePolling";
import { TERMINAL_STATUSES } from "../../utils/constants";

// ─────────────────────────────────────────────────────────────
// Cart
// ─────────────────────────────────────────────────────────────
export function Cart() {
  const navigate = useNavigate();
  const { items, updateQty, removeItem, clearCart } = useCartStore();
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax      = subtotal * 0.05;
  const total    = subtotal + tax;

  if (!items.length) return (
    <div className="text-center py-20">
      <p className="text-4xl mb-4">🛒</p>
      <p className="text-gray-500 mb-4">Your cart is empty</p>
      <button onClick={() => navigate("/home")} className="btn-primary">Browse Menu</button>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-4">Your Cart</h1>
      <div className="card divide-y divide-gray-50 mb-4">
        {items.map((item) => (
          <div key={item.item_id} className="flex items-center gap-3 p-4">
            <div className="flex-1">
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-brand-600 font-semibold text-sm">₹{item.price}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQty(item.item_id, item.qty - 1)}
                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <Minus size={12} />
              </button>
              <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
              <button onClick={() => updateQty(item.item_id, item.qty + 1)}
                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <Plus size={12} />
              </button>
              <button onClick={() => removeItem(item.item_id)} className="ml-1 text-red-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
            <p className="text-sm font-semibold w-16 text-right">₹{item.price * item.qty}</p>
          </div>
        ))}
      </div>

      <div className="card p-4 space-y-2 mb-4">
        <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-500">Tax (5%)</span><span>₹{tax.toFixed(2)}</span></div>
        <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
      </div>

      <div className="flex gap-3">
        <button onClick={clearCart} className="btn-secondary flex-1">Clear Cart</button>
        <button onClick={() => navigate("/checkout")} className="btn-primary flex-1">Proceed to Checkout</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Checkout
// ─────────────────────────────────────────────────────────────
export function Checkout() {
  const navigate = useNavigate();
  const { items, canteen_id, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax      = subtotal * 0.05;
  const total    = subtotal + tax;

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const payload = {
        canteen_id,
        items: items.map(({ item_id, qty }) => ({ item_id, qty })),
      };
      const { data } = await orderAPI.place(payload);
      clearCart();
      toast.success("Order placed! Waiting for merchant confirmation.");
      navigate(`/track/${data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-4">Order Summary</h1>
      <div className="card divide-y divide-gray-50 mb-4">
        {items.map((item) => (
          <div key={item.item_id} className="flex justify-between p-3 text-sm">
            <span>{item.name} × {item.qty}</span>
            <span className="font-medium">₹{item.price * item.qty}</span>
          </div>
        ))}
        <div className="p-3 space-y-1">
          <div className="flex justify-between text-sm text-gray-500"><span>Tax (5%)</span><span>₹{tax.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        Payment will be collected after the merchant accepts your order.
      </p>
      <button onClick={handlePlaceOrder} disabled={loading || !items.length} className="btn-primary w-full">
        {loading ? "Placing order..." : "Place Order Request"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Order Tracking (polling)
// ─────────────────────────────────────────────────────────────
export function OrderTracking({ orderId }) {
  const navigate = useNavigate();
  const [reconfirmLoading, setReconfirmLoading] = useState(false);
  const [acceptedPopup, setAcceptedPopup]       = useState(false); // FIX 7
  const prevStatusRef = useRef(null);                               // FIX 7: track prev status

  const { data: order, loading } = usePolling(
    () => orderAPI.getOne(orderId).then((r) => r.data.data),
    4000,
    (o) => o && TERMINAL_STATUSES.includes(o.status)
  );

  // FIX 7: Detect when status transitions to ACCEPTED and show popup
  useEffect(() => {
    if (!order) return;
    if (prevStatusRef.current !== "ACCEPTED" && order.status === "ACCEPTED") {
      setAcceptedPopup(true);
    }
    prevStatusRef.current = order.status;
  }, [order?.status]);

  const handleReconfirm = async () => {
    setReconfirmLoading(true);
    try {
      const { data } = await orderAPI.reconfirm(orderId);
      toast.success("Order reconfirmed!");
      if (data.data.status === "ACCEPTED") navigate(`/pay/${orderId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setReconfirmLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!order) return <p className="text-center text-gray-400">Order not found</p>;

  const steps = ["PENDING","ACCEPTED","PAID","PREPARING","READY","COMPLETED"];
  const currentStep = steps.indexOf(order.status);

  return (
    <div className="max-w-lg mx-auto">
      {/* FIX 7: Order accepted popup */}
      {acceptedPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Order Accepted!</h2>
            <p className="text-sm text-gray-500 mb-1">The merchant has accepted your order.</p>
            {order.merchant_note && (
              <p className="text-sm text-brand-600 font-medium bg-brand-50 rounded-lg px-3 py-2 mb-3">
                Merchant says: "{order.merchant_note}"
              </p>
            )}
            <p className="text-lg font-bold text-gray-800 mb-4">
              Total: ₹{order.total_amount}
            </p>
            <button
              onClick={() => { setAcceptedPopup(false); navigate(`/pay/${orderId}`); }}
              className="btn-primary w-full mb-2"
            >
              Proceed to Payment
            </button>
            <button
              onClick={() => setAcceptedPopup(false)}
              className="btn-secondary w-full text-sm"
            >
              View Order Status
            </button>
          </div>
        </div>
      )}
      <h1 className="text-xl font-bold mb-1">Tracking Order</h1>
      <p className="text-sm text-gray-400 mb-6 font-mono">#{order._id?.slice(-8).toUpperCase()}</p>

      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">Status</span>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Progress bar */}
        <div className="relative mb-4">
          <div className="flex justify-between mb-2">
            {steps.map((s, i) => (
              <div key={s} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${i <= currentStep ? "bg-brand-400 text-white" : "bg-gray-100 text-gray-400"}`}>
                {i + 1}
              </div>
            ))}
          </div>
          <div className="absolute top-3 left-3 right-3 h-0.5 bg-gray-100 -z-0">
            <div className="h-full bg-brand-400 transition-all" style={{ width: `${Math.max(0, (currentStep / (steps.length - 1)) * 100)}%` }} />
          </div>
          <div className="flex justify-between">
            {steps.map((s) => <span key={s} className="text-[9px] text-gray-400 text-center" style={{width:'16%'}}>{s.replace(/_/g,' ')}</span>)}
          </div>
        </div>

        {/* Partial accept — reconfirm UI */}
        {order.status === "AWAITING_RECONFIRM" && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
            <p className="text-sm font-medium text-orange-800 mb-2">Some items are unavailable</p>
            {order.merchant_note && <p className="text-xs text-orange-700 mb-2">{order.merchant_note}</p>}
            <div className="space-y-1 mb-3">
              {order.items.map((i) => (
                <div key={i.item_id} className={`text-xs flex justify-between ${!i.is_available ? "line-through text-gray-400" : ""}`}>
                  <span>{i.name} × {i.qty}</span>
                  <span>{i.is_available ? `₹${i.price * i.qty}` : "Unavailable"}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleReconfirm} disabled={reconfirmLoading} className="btn-primary text-sm py-1.5 flex-1">
                {reconfirmLoading ? "..." : "Confirm available items"}
              </button>
              <button onClick={() => orderAPI.cancel(orderId).then(() => toast.success("Cancelled"))} className="btn-secondary text-sm py-1.5">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="space-y-1 mt-3 pt-3 border-t">
          {order.items.map((i) => (
            <div key={i.item_id} className="flex justify-between text-sm">
              <span className="text-gray-600">{i.name} × {i.qty}</span>
              <span>₹{i.price * i.qty}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-sm pt-1 border-t">
            <span>Total</span><span>₹{order.total_amount}</span>
          </div>
        </div>
      </div>

      {order.status === "ACCEPTED" && (
        <button onClick={() => navigate(`/pay/${orderId}`)} className="btn-primary w-full">
          Proceed to Payment
        </button>
      )}
      {order.status === "COMPLETED" && !order.is_rated && (
        <button onClick={() => navigate(`/review/${orderId}`)} className="btn-secondary w-full mt-2">
          Rate your order
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Order History
// ─────────────────────────────────────────────────────────────
export function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.myOrders().then(({ data }) => {
      setOrders(data.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Order History</h1>
      {!orders.length
        ? <p className="text-center text-gray-400 py-12">No orders yet</p>
        : <div className="space-y-3">
            {orders.map((o) => (
              <div key={o._id} className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/track/${o._id}`)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-gray-400">#{o._id.slice(-8).toUpperCase()}</span>
                  <OrderStatusBadge status={o.status} />
                </div>
                <p className="font-medium text-sm">{o.canteen_id?.name}</p>
                <p className="text-xs text-gray-400">{o.items.length} item(s) · ₹{o.total_amount}</p>
                <p className="text-xs text-gray-400">{new Date(o.placed_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────
const HALLS = ["Hall 1","Hall 2","Hall 3","Hall 4","Hall 5","Hall 6","Hall 7","Hall 8","Hall 9","Hall 10","Hall 11","Hall 12","Hall 13","Hall 14","Visitors"];

export function Profile() {
  const [form, setForm] = useState({ name: "", phone: "", hall_of_residence: "", room_no: "" });
  const [loading, setLoading] = useState(false);
  const { userAPI } = { userAPI: { getMe: () => import("../../api").then(m => m.userAPI.getMe()), updateMe: (d) => import("../../api").then(m => m.userAPI.updateMe(d)) } };

  useEffect(() => {
    userAPI.getMe().then(({ data }) => {
      const u = data.data;
      setForm({ name: u.name || "", phone: u.phone || "", hall_of_residence: u.hall_of_residence || "", room_no: u.room_no || ""});
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userAPI.updateMe(form);
      toast.success("Profile updated");
    } catch (err) {
      toast.error("Update failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-bold mb-6">Profile</h1>
      <form onSubmit={handleSave} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input className="input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hall of Residence</label>
          <select className="input" value={form.hall_of_residence}
            onChange={(e) => setForm({ ...form, hall_of_residence: e.target.value })}>
            {HALLS.map((h) => <option key={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
          <input
            className="input"
            placeholder="e.g. 101, A-204"
            value={form.room_no}
            onChange={(e) => setForm({ ...form, room_no: e.target.value })}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
