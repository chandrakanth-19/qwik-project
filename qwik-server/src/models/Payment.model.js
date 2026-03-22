const mongoose = require("mongoose");
const { PAYMENT_STATUS, PAYMENT_METHOD } = require("../config/constants");

const paymentSchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: Object.values(PAYMENT_METHOD) },
    gateway_txn_id: { type: String, default: "" }, // RazorPay txn id
    razorpay_order_id: { type: String, default: "" },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
