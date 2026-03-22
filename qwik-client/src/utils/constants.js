export const ORDER_STATUS = {
  PENDING:            "PENDING",
  PARTIALLY_ACCEPTED: "PARTIALLY_ACCEPTED",
  AWAITING_RECONFIRM: "AWAITING_RECONFIRM",
  ACCEPTED:           "ACCEPTED",
  PAYMENT_PENDING:    "PAYMENT_PENDING",
  PAID:               "PAID",
  PREPARING:          "PREPARING",
  READY:              "READY",
  COMPLETED:          "COMPLETED",
  REJECTED:           "REJECTED",
  CANCELLED:          "CANCELLED",
  PAYMENT_FAILED:     "PAYMENT_FAILED",
};

export const TERMINAL_STATUSES = ["COMPLETED", "REJECTED", "CANCELLED", "PAYMENT_FAILED"];

export const ROLES = { CUSTOMER: "customer", MERCHANT: "merchant", ADMIN: "admin" };

export const STATUS_COLORS = {
  PENDING:            "bg-yellow-100 text-yellow-800",
  PARTIALLY_ACCEPTED: "bg-orange-100 text-orange-800",
  AWAITING_RECONFIRM: "bg-orange-100 text-orange-800",
  ACCEPTED:           "bg-blue-100 text-blue-800",
  PAYMENT_PENDING:    "bg-purple-100 text-purple-800",
  PAID:               "bg-indigo-100 text-indigo-800",
  PREPARING:          "bg-brand-50 text-brand-600",
  READY:              "bg-green-100 text-green-800",
  COMPLETED:          "bg-gray-100 text-gray-700",
  REJECTED:           "bg-red-100 text-red-700",
  CANCELLED:          "bg-gray-100 text-gray-500",
  PAYMENT_FAILED:     "bg-red-100 text-red-700",
};
