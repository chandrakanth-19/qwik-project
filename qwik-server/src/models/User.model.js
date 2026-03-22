const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const { ROLES } = require("../config/constants");

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, "Name is required"],
      trim:     true,
    },
    // Students use IITK email; visitors may have null email
    email: {
      type:     String,
      unique:   true,
      sparse:   true,       // allows multiple null values
      lowercase: true,
      trim:     true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
    },
    // Visitors use phone; students may optionally add it
    phone: {
      type:   String,
      unique: true,
      sparse: true,
      trim:   true,
    },
    password: {
      type:     String,
      required: [true, "Password is required"],
      minlength: 6,
      select:   false,      // never returned in queries by default
    },
    role: {
      type:    String,
      enum:    Object.values(ROLES),
      default: ROLES.CUSTOMER,
    },
    // Customer-only fields
    hall_of_residence: {
      type: String,
      trim: true,
    },
    room_no: {          // ADD THIS
      type: String,
      trim: true,
    },
    profile_photo: {
      type: String,          // URL / S3 path
    },

    // Auth / security
    is_verified:  { type: Boolean, default: false },
    is_blocked:   { type: Boolean, default: false },

    // OTP fields (temporary, overwritten on each request)
    otp:            { type: String,  select: false },
    otp_expires_at: { type: Date,    select: false },
  },
  { timestamps: true }
);

// ── Hash password before save ────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Compare password helper ──────────────────────────────────
userSchema.methods.matchPassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// ── Validation: must have email OR phone ─────────────────────
userSchema.pre("validate", function (next) {
  if (!this.email && !this.phone) {
    return next(new Error("User must have either an email or a phone number"));
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
