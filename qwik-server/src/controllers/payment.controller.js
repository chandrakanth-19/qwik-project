const stripe  = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/Payment.model");
const Order   = require("../models/Order.model");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, badReq, notFound } = require("../utils/apiResponse");
const { ORDER_STATUS, PAYMENT_STATUS } = require("../config/constants");

// ── POST /api/payments/initiate/:orderId ─────────────────────
//
// BUG 2 FIX: Made idempotent.
// If the order is already PAYMENT_PENDING (user refreshed the payment page or
// navigated back to it), we look up the existing Payment record, retrieve the
// existing PaymentIntent from Stripe, and return its client_secret again.
// This means the Stripe form re-mounts correctly and the Cancel / Pay buttons
// are always visible.
//
exports.initiatePayment = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.orderId,
    user_id: req.user._id,
  });
  if (!order) return notFound(res, "Order not found");

  // Allow both ACCEPTED (first time) and PAYMENT_PENDING (refresh / back-nav)
  if (
    order.status !== ORDER_STATUS.ACCEPTED &&
    order.status !== ORDER_STATUS.PAYMENT_PENDING
  ) {
    return badReq(res, "Order must be accepted before payment");
  }

  // ── Idempotency: reuse existing PaymentIntent if one already exists ──
  if (order.status === ORDER_STATUS.PAYMENT_PENDING && order.payment_id) {
    const existingPayment = await Payment.findById(order.payment_id);
    if (existingPayment && existingPayment.gateway_txn_id) {
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(
          existingPayment.gateway_txn_id
        );
        // Only reuse if the intent is still actionable
        if (
          existingIntent.status === "requires_payment_method" ||
          existingIntent.status === "requires_confirmation" ||
          existingIntent.status === "requires_action"
        ) {
          return ok(res, {
            client_secret:   existingIntent.client_secret,
            publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
            payment_id:      existingPayment._id,
            amount:          order.total_amount,
          });
        }
      } catch (_) {
        // Stripe retrieval failed — fall through and create a new intent
      }
    }
  }

  // ── First time: create a new PaymentIntent ──────────────────
  const paymentIntent = await stripe.paymentIntents.create({
    amount:   Math.round(order.total_amount * 100), // paise
    currency: "inr",
    metadata: {
      order_id: order._id.toString(),
      user_id:  req.user._id.toString(),
    },
  });

  const payment = await Payment.create({
    order_id:       order._id,
    user_id:        req.user._id,
    amount:         order.total_amount,
    gateway_txn_id: paymentIntent.id,
  });

  order.payment_id = payment._id;
  order.status     = ORDER_STATUS.PAYMENT_PENDING;
  await order.save();

  ok(res, {
    client_secret:   paymentIntent.client_secret,
    publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
    payment_id:      payment._id,
    amount:          order.total_amount,
  });
});

// ── POST /api/payments/verify ────────────────────────────────
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { payment_intent_id, order_id } = req.body;

  const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

  if (paymentIntent.status !== "succeeded") {
    await Payment.findOneAndUpdate(
      { gateway_txn_id: payment_intent_id },
      { status: PAYMENT_STATUS.FAILED }
    );
    await Order.findByIdAndUpdate(order_id, { status: ORDER_STATUS.PAYMENT_FAILED });
    return badReq(res, "Payment not successful");
  }

  const payment = await Payment.findOneAndUpdate(
    { gateway_txn_id: payment_intent_id },
    { status: PAYMENT_STATUS.SUCCESS },
    { new: true }
  );

  const order = await Order.findByIdAndUpdate(
    order_id,
    { status: ORDER_STATUS.PAID },
    { new: true }
  );

  ok(res, { order, payment }, "Payment successful");
});
