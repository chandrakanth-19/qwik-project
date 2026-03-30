import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { paymentAPI, orderAPI } from "../../api";
import { Spinner } from "../../components";

// ── Inner form component ──────────────────────────────────────
function CheckoutForm({ orderId, amount, onCancel, cancelling }) {
  const stripe   = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "Payment failed");
        setPaying(false);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        await paymentAPI.verify({
          payment_intent_id: paymentIntent.id,
          order_id: orderId,
        });
        toast.success("Payment successful! Order confirmed.");
        navigate(`/track/${orderId}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment verification failed");
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || paying}
        className="btn-primary w-full text-base py-3 mt-4"
      >
        {paying ? "Processing..." : `Pay ₹${amount}`}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={cancelling}
        className="w-full text-sm text-red-500 border border-red-200 hover:bg-red-50 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {cancelling ? "Cancelling..." : "Cancel Order"}
      </button>
    </form>
  );
}

// ── Main Payment page ─────────────────────────────────────────
export default function PaymentPage() {
  const { orderId } = useParams();
  const navigate    = useNavigate();

  const [order,        setOrder]        = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  // BUG 3 FIX: Don't cache stripePromise as a module singleton.
  // Store it in component state so it's always tied to the key from the backend.
  const [stripePromise, setStripePromise] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [cancelling,   setCancelling]   = useState(false);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get order details first
        const { data: orderData } = await orderAPI.getOne(orderId);
        const orderObj = orderData.data;
        setOrder(orderObj);

        // BUG 2 FIX: If the order is already in PAYMENT_PENDING (i.e. user refreshed
        // or navigated back), we re-use the existing payment intent by calling initiate
        // again. The backend must support idempotent initiation for PAYMENT_PENDING
        // orders — see the server fix below. If the order is already PAID or beyond,
        // redirect away immediately.
        const terminalStatuses = ["PAID", "PREPARING", "READY", "COMPLETED", "CANCELLED", "REJECTED", "PAYMENT_FAILED"];
        if (terminalStatuses.includes(orderObj.status)) {
          navigate(`/track/${orderId}`);
          return;
        }

        // Only ACCEPTED and PAYMENT_PENDING orders should reach here
        const { data: payData } = await paymentAPI.initiate(orderId);
        setClientSecret(payData.data.client_secret);
        // BUG 3 FIX: Always create a fresh Stripe instance from the key returned
        // by the backend. Never rely on a module-level singleton.
        setStripePromise(loadStripe(payData.data.publishable_key));
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to load payment";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [orderId]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      await orderAPI.cancel(orderId);
      toast.success("Order cancelled.");
      navigate(`/track/${orderId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel order");
      setCancelling(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Spinner size="lg" />
    </div>
  );

  // Show error state with a back button instead of silently redirecting
  if (error) return (
    <div className="max-w-md mx-auto text-center py-16">
      <p className="text-4xl mb-4">⚠️</p>
      <p className="text-gray-700 font-medium mb-2">Unable to load payment</p>
      <p className="text-sm text-gray-400 mb-6">{error}</p>
      <button onClick={() => navigate(`/track/${orderId}`)} className="btn-secondary">
        Back to Order
      </button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Complete Payment</h1>

      {/* Order summary */}
      <div className="card p-5 mb-4">
        <h2 className="font-medium text-sm text-gray-500 mb-3">Order Summary</h2>
        <div className="space-y-1.5 mb-3">
          {order?.items.map((i) => (
            <div key={i.item_id} className="flex justify-between text-sm">
              <span className="text-gray-600">{i.name} × {i.qty}</span>
              <span>₹{i.price * i.qty}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm text-gray-400 pt-1 border-t">
            <span>Tax (5%)</span>
            <span>₹{order?.tax_amount}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>₹{order?.total_amount}</span>
          </div>
        </div>
      </div>

      {/* Stripe payment form */}
      {clientSecret && stripePromise && (
        <div className="card p-5">
          <h2 className="font-medium text-sm text-gray-500 mb-4">
            Payment — powered by Stripe
          </h2>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: { colorPrimary: "#1D9E75" },
              },
            }}
          >
            <CheckoutForm
              orderId={orderId}
              amount={order?.total_amount}
              onCancel={handleCancel}
              cancelling={cancelling}
            />
          </Elements>
        </div>
      )}
    </div>
  );
}
