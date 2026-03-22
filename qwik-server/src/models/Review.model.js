const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    item_id: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

// One review per item per order
reviewSchema.index({ user_id: 1, item_id: 1, order_id: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
