const mongoose = require("mongoose");
const { ORDER_STATUS } = require("../config/constants");

const orderItemSchema = new mongoose.Schema(
  {
    item_id: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    is_available: { type: Boolean, default: true }, // merchant flips this on partial accept
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    canteen_id: { type: mongoose.Schema.Types.ObjectId, ref: "Canteen", required: true },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
    subtotal: { type: Number, required: true },
    tax_amount: { type: Number, default: 0 },
    total_amount: { type: Number, required: true },
    merchant_note: { type: String, default: "" }, // reason for partial/full reject
    payment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null },
    is_rated: { type: Boolean, default: false },
    placed_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
