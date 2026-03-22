const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    canteen_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, trim: true, default: "general" },
    is_veg: { type: Boolean, default: true },
    photo_url: { type: String, default: "" },
    is_available: { type: Boolean, default: true },
    avg_rating: { type: Number, default: 0, min: 0, max: 5 },
    rating_count: { type: Number, default: 0 },
    prep_time_mins: { type: Number, default: 15 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MenuItem", menuItemSchema);
