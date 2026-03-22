const stripe  = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/Payment.model");
const Order   = require("../models/Order.model");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, badReq, notFound } = require("../utils/apiResponse");
const { ORDER_STATUS, PAYMENT_STATUS } = require("../config/constants");

// ── POST /api/payments/initiate/:orderId ─────────────────────
exports.initiatePayment = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.orderId,
    user_id: req.user._id
  });
  if (!order) return notFound(res, "Order not found");
  if (order.status !== ORDER_STATUS.ACCEPTED)
    return badReq(res, "Order must be accepted before payment");

  // Create Stripe Payment Intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount:   Math.round(order.total_amount * 100), // paise/cents
    currency: "inr",
    metadata: {
      order_id: order._id.toString(),
      user_id:  req.user._id.toString(),
    },
  });

  // Save payment record
  const payment = await Payment.create({
    order_id:        order._id,
    user_id:         req.user._id,
    amount:          order.total_amount,
    gateway_txn_id:  paymentIntent.id,
  });

  order.payment_id = payment._id;
  order.status     = ORDER_STATUS.PAYMENT_PENDING;
  await order.save();

  ok(res, {
    client_secret:    paymentIntent.client_secret,
    publishable_key:  process.env.STRIPE_PUBLISHABLE_KEY,
    payment_id:       payment._id,
    amount:           order.total_amount,
  });
});

// ── POST /api/payments/verify ────────────────────────────────
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { payment_intent_id, order_id } = req.body;

  // Retrieve payment intent from Stripe to confirm status
  const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

  if (paymentIntent.status !== "succeeded") {
    await Payment.findOneAndUpdate(
      { gateway_txn_id: payment_intent_id },
      { status: PAYMENT_STATUS.FAILED }
    );
    await Order.findByIdAndUpdate(order_id, { status: ORDER_STATUS.PAYMENT_FAILED });
    return badReq(res, "Payment not successful");
  }

  // Success — update payment and order
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