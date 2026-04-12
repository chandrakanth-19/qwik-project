import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Minus, Plus, Trash2, RotateCcw, Eye, Lock } from "lucide-react";
import useCartStore from "../../store/cartStore";
import { orderAPI, paymentAPI, userAPI, authAPI } from "../../api";
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
  const [cancelLoading, setCancelLoading]       = useState(false);
  const [completeLoading, setCompleteLoading]   = useState(false);
  const [acceptedPopup, setAcceptedPopup]       = useState(false);
  const prevStatusRef = useRef(null);

  const { data: order, loading } = usePolling(
    () => orderAPI.getOne(orderId).then((r) => r.data.data),
    4000,
    (o) => o && TERMINAL_STATUSES.includes(o.status)
  );

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

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancelLoading(true);
    try {
      await orderAPI.cancel(orderId);
      toast.success("Order cancelled.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel order");
    } finally { setCancelLoading(false); }
  };

  const handleMarkComplete = async () => {
    if (!window.confirm("Confirm you have received your order?")) return;
    setCompleteLoading(true);
    try {
      await orderAPI.customerComplete(orderId);
      toast.success("Order marked as completed!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setCompleteLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!order) return <p className="text-center text-gray-400">Order not found</p>;

  const steps = ["PENDING","ACCEPTED","PAID","PREPARING","READY","COMPLETED"];
  const currentStep = steps.indexOf(order.status);

  return (
    <div className="max-w-lg mx-auto">
      {acceptedPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Order Accepted!</h2>
            <p className="text-sm text-gray-500 mb-1">The merchant has accepted your order.</p>
            {order.merchant_note && (
              <p className="text-sm text-brand-600 font-medium bg-brand-50 rounded-lg px-3 py-2 mb-3">
                Merchant says: &quot;{order.merchant_note}&quot;
              </p>
            )}
            {order.eta && (
              <p className="text-sm text-green-700 font-medium bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3 flex items-center gap-1.5">
                ⏱ ETA: {order.eta}
              </p>
            )}
            <p className="text-lg font-bold text-gray-800 mb-4">Total: ₹{order.total_amount}</p>
            <button onClick={() => { setAcceptedPopup(false); navigate(`/pay/${orderId}`); }} className="btn-primary w-full mb-2">
              Proceed to Payment
            </button>
            <button onClick={() => setAcceptedPopup(false)} className="btn-secondary w-full text-sm">
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

        {(order.status === "PENDING" || order.status === "ACCEPTED") && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button onClick={handleCancel} disabled={cancelLoading}
              className="w-full text-sm text-red-500 border border-red-200 hover:bg-red-50 py-2 rounded-lg transition-colors disabled:opacity-50">
              {cancelLoading ? "Cancelling..." : "Cancel Order"}
            </button>
          </div>
        )}

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

        {/* FIX 5: Show ETA if the merchant provided one */}
        {order.eta && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
            <span className="text-base">⏱</span>
            <span><span className="font-semibold">ETA:</span> {order.eta}</span>
          </div>
        )}

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
      {(order.status === "PREPARING" || order.status === "READY") && (
        <button onClick={handleMarkComplete} disabled={completeLoading} className="btn-primary w-full mt-2">
          {completeLoading ? "Marking..." : "✅ Mark as Received / Complete"}
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
// Order History  —  FIX 2: Quick Re-Order
// ─────────────────────────────────────────────────────────────
export function OrderHistory() {
  const navigate  = useNavigate();
  const addItem   = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const [orders,   setOrders]  = useState([]);
  const [loading,  setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [reordering, setReordering] = useState(null);

  useEffect(() => {
    orderAPI.myOrders().then(({ data }) => {
      setOrders(data.data);
      setLoading(false);
    });
  }, []);

  // FIX 2: Re-order — add all items from a past order back into the cart.
  // If the cart already has items from a different canteen the cartStore will
  // surface the pendingSwitchItem dialog (existing UX); we just kick it off.
  const handleReorder = async (order) => {
    setReordering(order._id);
    try {
      order.items.forEach((item) => {
        for (let i = 0; i < item.qty; i++) {
          addItem({
            item_id:    item.item_id,
            name:       item.name,
            price:      item.price,
            canteen_id: order.canteen_id?._id || order.canteen_id,
          });
        }
      });
      toast.success("Items added to cart!");
      navigate("/cart");
    } catch {
      toast.error("Failed to re-order. Please try again.");
    } finally {
      setReordering(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Order History</h1>
      {!orders.length
        ? <p className="text-center text-gray-400 py-12">No orders yet</p>
        : <div className="space-y-3">
            {orders.map((o) => (
              <div key={o._id} className="card overflow-hidden">
                {/* Summary row */}
                <div className="p-4 flex items-center gap-3">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => navigate(`/track/${o._id}`)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-gray-400">#{o._id.slice(-8).toUpperCase()}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="font-medium text-sm">{o.canteen_id?.name}</p>
                    <p className="text-xs text-gray-400">{o.items.length} item(s) · ₹{o.total_amount}</p>
                    <p className="text-xs text-gray-400">{new Date(o.placed_at).toLocaleString()}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {/* View tracking */}
                    <button
                      onClick={() => navigate(`/track/${o._id}`)}
                      className="flex items-center gap-1 text-xs text-brand-600 border border-brand-400 hover:bg-brand-50 px-2.5 py-1.5 rounded-lg transition-colors"
                      title="Track order"
                    >
                      <Eye size={12} /> Track
                    </button>

                    {/* FIX 2: Re-order button */}
                    <button
                      onClick={() => handleReorder(o)}
                      disabled={reordering === o._id}
                      className="flex items-center gap-1 text-xs text-white bg-brand-400 hover:bg-brand-600 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      title="Add these items to cart again"
                    >
                      <RotateCcw size={12} />
                      {reordering === o._id ? "..." : "Re-order"}
                    </button>
                  </div>
                </div>

                {/* Expandable items list */}
                {expanded === o._id && (
                  <div className="border-t divide-y divide-gray-50 px-4 pb-3 bg-gray-50">
                    {o.items.map((item) => (
                      <div key={item.item_id} className="flex justify-between py-2 text-sm">
                        <span className="text-gray-600">{item.name} × {item.qty}</span>
                        <span>₹{item.price * item.qty}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setExpanded(expanded === o._id ? null : o._id)}
                  className="w-full text-xs text-gray-400 hover:text-gray-600 py-1.5 border-t border-gray-50 transition-colors"
                >
                  {expanded === o._id ? "▲ Hide items" : "▼ Show items"}
                </button>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Profile  —  FIX 4: Change Password in-session
// ─────────────────────────────────────────────────────────────
const HALLS = ["Hall 1","Hall 2","Hall 3","Hall 4","Hall 5","Hall 6","Hall 7","Hall 8","Hall 9","Hall 10","Hall 11","Hall 12","Hall 13","Hall 14","Visitors"];

export function Profile() {
  const [form,     setForm]     = useState({ name: "", phone: "", hall_of_residence: "", room_no: "" });
  const [loading,  setLoading]  = useState(false);
  const [phoneError, setPhoneError] = useState("");

  // FIX 4: change-password state
  const [pwForm,   setPwForm]   = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw,   setShowPw]   = useState(false);

  useEffect(() => {
    import("../../api").then((m) => {
      m.userAPI.getMe().then(({ data }) => {
        const u = data.data;
        setForm({
          name:              u.name || "",
          phone:             (u.phone || "").replace(/\D/g, "").slice(-10),
          hall_of_residence: u.hall_of_residence || "",
          room_no:           u.room_no || "",
        });
      });
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.phone || form.phone.replace(/\D/g, "").length !== 10) {
      setPhoneError("Phone number is required and must be exactly 10 digits");
      return;
    }
    setLoading(true);
    try {
      const { userAPI } = await import("../../api");
      await userAPI.updateMe(form);
      toast.success("Profile updated");
    } catch {
      toast.error("Update failed");
    } finally { setLoading(false); }
  };

  // FIX 4: submit change-password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }
    if (pwForm.new_password.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setPwLoading(true);
    try {
      const { authAPI } = await import("../../api");
      await authAPI.changePassword({
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      });
      toast.success("Password changed successfully!");
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      setShowPw(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally { setPwLoading(false); }
  };

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-xl font-bold">Profile</h1>

      {/* Profile details */}
      <form onSubmit={handleSave} className="card p-6 space-y-4">
        <h2 className="font-semibold text-sm text-gray-600">Account Info</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-gray-400 font-normal">(+91)</span></label>
          <input className="input" type="tel" placeholder="9999999999" maxLength={10} required
            value={form.phone}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              setForm({ ...form, phone: val });
              if (!val) setPhoneError("Phone number is required");
              else if (val.length !== 10) setPhoneError("Phone number must be exactly 10 digits");
              else setPhoneError("");
            }}
          />
          {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
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
          <input className="input" placeholder="e.g. 101, A-204" required value={form.room_no}
            onChange={(e) => setForm({ ...form, room_no: e.target.value })} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* FIX 4: Change password section */}
      <div className="card p-6">
        <button
          onClick={() => setShowPw((v) => !v)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-gray-500" />
            <span className="font-semibold text-sm text-gray-700">Change Password</span>
          </div>
          <span className="text-xs text-brand-600">{showPw ? "Cancel ▲" : "Change ▼"}</span>
        </button>

        {showPw && (
          <form onSubmit={handleChangePassword} className="mt-4 space-y-3 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input className="input" type="password" placeholder="••••••••" required
                value={pwForm.current_password}
                onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input className="input" type="password" placeholder="Min 6 characters" required minLength={6}
                value={pwForm.new_password}
                onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input className="input" type="password" placeholder="Repeat new password" required
                value={pwForm.confirm_password}
                onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })} />
            </div>
            <button type="submit" disabled={pwLoading} className="btn-primary w-full">
              {pwLoading ? "Changing..." : "Change Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
