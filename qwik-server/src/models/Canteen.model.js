const mongoose = require("mongoose");

const canteenSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, "Canteen name is required"],
      trim:     true,
    },
    // The approved merchant who manages this canteen
    manager_id: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    location: {
      type: String,
      trim: true,
    },
    hall: {
      type: String,           // e.g. "Hall 5", "Main Dining Hall"
      trim: true,
    },
    opening_time: {
      type:  String,          // "HH:MM" format
      match: [/^\d{2}:\d{2}$/, "Use HH:MM format"],
    },
    closing_time: {
      type:  String,
      match: [/^\d{2}:\d{2}$/, "Use HH:MM format"],
    },
    // Merchant toggles this in real time
    is_open: {
      type:    Boolean,
      default: false,
    },
    // Array of ISO date strings: ["2026-04-14", "2026-04-15"]
    unavailable_days: {
      type:    [String],
      default: [],
    },
    contact: {
      type: String,
      trim: true,
    },
    // Admin enables / disables the canteen on the platform
    is_active: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Canteen", canteenSchema);
