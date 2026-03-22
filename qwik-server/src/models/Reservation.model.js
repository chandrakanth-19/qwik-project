const mongoose = require("mongoose");
const { RESERVATION_STATUS, RESERVATION_TYPE } = require("../config/constants");

const reservationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    canteen_id: { type: mongoose.Schema.Types.ObjectId, ref: "Canteen", required: true },
    type: {
      type: String,
      enum: Object.values(RESERVATION_TYPE),
      required: true,
    },
    date: { type: Date, required: true },
    time_slot: { type: String, required: true }, // "HH:MM"

    // Table reservation fields
    party_size: { type: Number, default: null },

    // Cake order fields
    cake_details: {
      flavor: { type: String, default: "" },
      message: { type: String, default: "" },
      size: { type: String, default: "" }, // "500g", "1kg", etc.
    },

    status: {
      type: String,
      enum: Object.values(RESERVATION_STATUS),
      default: RESERVATION_STATUS.PENDING,
    },
    merchant_note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reservation", reservationSchema);
