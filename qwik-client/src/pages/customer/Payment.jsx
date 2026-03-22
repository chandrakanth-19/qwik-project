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

// Stripe instance — loaded once
let stripePromise = null;
const getStripe = (key) => {
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
};

// ── Inner form component ──────────────────────────────────────
function CheckoutForm({ orderId, amount }) {
  const stripe   = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);

    try {
      // Confirm payment with Stripe
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
        // Verify on backend
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
    </form>
  );
}

// ── Main Payment page ─────────────────────────────────────────
export default function PaymentPage() {
  const { orderId } = useParams();
  const navigate    = useNavigate();
  const [order,        setOrder]        = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [stripeKey,    setStripeKey]    = useState(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Get order details
        const { data: orderData } = await orderAPI.getOne(orderId);
        setOrder(orderData.data);

        // Initiate payment — get client secret from backend
        const { data: payData } = await paymentAPI.initiate(orderId);
        setClientSecret(payData.data.client_secret);
        setStripeKey(payData.data.publishable_key);
      } catch (err) {
        toast.error("Failed to load payment");
        navigate(`/track/${orderId}`);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [orderId]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <Spinner size="lg" />
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
      {clientSecret && stripeKey && (
        <div className="card p-5">
          <h2 className="font-medium text-sm text-gray-500 mb-4">
            Payment — powered by Stripe
          </h2>
          <Elements
            stripe={getStripe(stripeKey)}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: { colorPrimary: "#1D9E75" },
              },
            }}
          >
            <CheckoutForm orderId={orderId} amount={order?.total_amount} />
          </Elements>
        </div>
      )}
    </div>
  );
}