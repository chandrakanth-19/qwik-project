// ── Roles ───────────────────────────────────────────────────
const ROLES = {
  CUSTOMER: "customer",
  MERCHANT: "merchant",
  ADMIN:    "admin",
};

// ── Order status enum ────────────────────────────────────────
// Full lifecycle as finalized in blueprint
const ORDER_STATUS = {
  PENDING:              "PENDING",
  PARTIALLY_ACCEPTED:   "PARTIALLY_ACCEPTED",   // merchant marked some items unavailable
  AWAITING_RECONFIRM:   "AWAITING_RECONFIRM",   // waiting for user to reconfirm reduced cart
  ACCEPTED:             "ACCEPTED",
  PAYMENT_PENDING:      "PAYMENT_PENDING",
  PAID:                 "PAID",
  PREPARING:            "PREPARING",
  READY:                "READY",
  COMPLETED:            "COMPLETED",
  REJECTED:             "REJECTED",
  CANCELLED:            "CANCELLED",
  PAYMENT_FAILED:       "PAYMENT_FAILED",
};

// ── Reservation status ───────────────────────────────────────
const RESERVATION_STATUS = {
  PENDING:   "PENDING",
  APPROVED:  "APPROVED",
  REJECTED:  "REJECTED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
};

// ── Reservation type ─────────────────────────────────────────
const RESERVATION_TYPE = {
  TABLE:      "table",
  CAKE_ORDER: "cake_order",
};

// ── Payment status ───────────────────────────────────────────
const PAYMENT_STATUS = {
  PENDING:  "PENDING",
  SUCCESS:  "SUCCESS",
  FAILED:   "FAILED",
  REFUNDED: "REFUNDED",
};

// ── Payment method ───────────────────────────────────────────
const PAYMENT_METHOD = {
  UPI:        "upi",
  CARD:       "card",
  NETBANKING: "netbanking",
};

// ── Cake booking minimum lead time (hours) ───────────────────
const CAKE_MIN_ADVANCE_HOURS = 4;

module.exports = {
  ROLES,
  ORDER_STATUS,
  RESERVATION_STATUS,
  RESERVATION_TYPE,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  CAKE_MIN_ADVANCE_HOURS,
};
