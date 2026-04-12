const User    = require("../models/User.model");
const Order   = require("../models/Order.model");
const Canteen = require("../models/Canteen.model");
const asyncHandler  = require("../utils/asyncHandler");
const { ok, badReq, notFound, forbidden } = require("../utils/apiResponse");
const { ROLES } = require("../config/constants");

// ── GET /api/users/me ─────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  ok(res, req.user);
});

// ── PUT /api/users/me ─────────────────────────────────────────
exports.updateMe = asyncHandler(async (req, res) => {
  const { name, phone, hall_of_residence, room_no } = req.body;
  // FIX 4: email is intentionally excluded — no role may change their email
  // through this endpoint (prevents accidental or malicious email updates).
  const updates = {};
  if (name)              updates.name              = name;
  if (phone)             updates.phone             = phone;
  if (hall_of_residence) updates.hall_of_residence = hall_of_residence;
  if (room_no)           updates.room_no           = room_no;

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  ok(res, user, "Profile updated");
});

// ── POST /api/users/me/photo ──────────────────────────────────
exports.uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) return badReq(res, "No file uploaded");
  const photo_url = `/uploads/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user._id, { profile_photo: photo_url }, { new: true });
  ok(res, { profile_photo: user.profile_photo }, "Photo updated");
});

// ── GET /api/users/canteen-customers ─────────────────────────
exports.getCanteenCustomers = asyncHandler(async (req, res) => {
  const canteen = await Canteen.findOne({ manager_id: req.user._id, is_active: true });
  if (!canteen) return notFound(res, "No canteen found for this merchant");

  const customerIds = await Order.distinct("user_id", { canteen_id: canteen._id });

  const customers = await User.find({
    _id:  { $in: customerIds },
    role: ROLES.CUSTOMER,
  }).select("name email phone hall_of_residence room_no is_blocked createdAt");

  ok(res, customers);
});

// ── PUT /api/users/:id/merchant-block ────────────────────────
exports.merchantToggleBlock = asyncHandler(async (req, res) => {
  const canteen = await Canteen.findOne({ manager_id: req.user._id, is_active: true });
  if (!canteen) return notFound(res, "No canteen found for this merchant");

  const hasOrdered = await Order.exists({ canteen_id: canteen._id, user_id: req.params.id });
  if (!hasOrdered)
    return forbidden(res, "You can only block customers who have ordered from your canteen");

  const customer = await User.findOne({ _id: req.params.id, role: ROLES.CUSTOMER });
  if (!customer) return notFound(res, "Customer not found");

  customer.is_blocked = !customer.is_blocked;
  await customer.save();

  ok(res, customer, `Customer ${customer.is_blocked ? "blocked" : "unblocked"}`);
});
