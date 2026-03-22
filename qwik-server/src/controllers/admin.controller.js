const User     = require("../models/User.model");
const Canteen  = require("../models/Canteen.model");
const Order    = require("../models/Order.model");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, badReq, notFound } = require("../utils/apiResponse");
const { ROLES } = require("../config/constants");

// ── GET /api/admin/dashboard ─────────────────────────────────
exports.getDashboard = asyncHandler(async (req, res) => {
  const [totalUsers, totalMerchants, totalCanteens, totalOrders, pendingMerchants] =
    await Promise.all([
      User.countDocuments({ role: ROLES.CUSTOMER }),
      User.countDocuments({ role: ROLES.MERCHANT, is_verified: true }),
      Canteen.countDocuments({ is_active: true }),
      Order.countDocuments(),
      User.countDocuments({ role: ROLES.MERCHANT, is_verified: false }),
    ]);

  ok(res, { totalUsers, totalMerchants, totalCanteens, totalOrders, pendingMerchants });
});

// ── GET /api/admin/merchants/pending ─────────────────────────
exports.getPendingMerchants = asyncHandler(async (req, res) => {
  const merchants = await User.find({ role: ROLES.MERCHANT, is_verified: false });
  ok(res, merchants);
});

// ── PUT /api/admin/merchants/:id/approve ─────────────────────
exports.approveMerchant = asyncHandler(async (req, res) => {
  const { canteen_name, hall, location, opening_time, closing_time, contact } = req.body;

  const merchant = await User.findOneAndUpdate(
    { _id: req.params.id, role: ROLES.MERCHANT },
    { is_verified: true },
    { new: true }
  );
  if (!merchant) return notFound(res, "Merchant not found");

  // Create canteen for this merchant if it doesn't exist yet
  let canteen = await Canteen.findOne({ manager_id: merchant._id });
  if (!canteen) {
    canteen = await Canteen.create({
      name:         canteen_name || `${merchant.name}'s Canteen`,
      manager_id:   merchant._id,
      hall,
      location,
      opening_time,
      closing_time,
      contact,
    });
  }

  ok(res, { merchant, canteen }, "Merchant approved and canteen created");
});

// ── PUT /api/admin/merchants/:id/reject ──────────────────────
exports.rejectMerchant = asyncHandler(async (req, res) => {
  const merchant = await User.findOneAndDelete({ _id: req.params.id, role: ROLES.MERCHANT, is_verified: false });
  if (!merchant) return notFound(res, "Merchant not found");
  ok(res, null, "Merchant rejected and removed");
});

// ── GET /api/admin/users ─────────────────────────────────────
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: ROLES.CUSTOMER }).sort({ createdAt: -1 });
  ok(res, users);
});

// ── PUT /api/admin/users/:id/block ───────────────────────────
exports.toggleBlockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return notFound(res, "User not found");

  user.is_blocked = !user.is_blocked;
  await user.save();
  ok(res, user, `User ${user.is_blocked ? "blocked" : "unblocked"}`);
});

// ── POST /api/admin/canteens ─────────────────────────────────
exports.addCanteen = asyncHandler(async (req, res) => {
  const canteen = await Canteen.create(req.body);
  created(res, canteen, "Canteen added");
});

// ── GET /api/admin/canteens ──────────────────────────────────
exports.getAllCanteens = asyncHandler(async (req, res) => {
  const canteens = await Canteen.find().populate("manager_id", "name email");
  ok(res, canteens);
});

// ── PUT /api/admin/canteens/:id ──────────────────────────────
exports.updateCanteen = asyncHandler(async (req, res) => {
  const canteen = await Canteen.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!canteen) return notFound(res, "Canteen not found");
  ok(res, canteen, "Canteen updated");
});

// ── DELETE /api/admin/canteens/:id ───────────────────────────
exports.deleteCanteen = asyncHandler(async (req, res) => {
  const canteen = await Canteen.findByIdAndUpdate(req.params.id, { is_active: false }, { new: true });
  if (!canteen) return notFound(res, "Canteen not found");
  ok(res, null, "Canteen deactivated");
});

// exports.getApprovedMerchants = asyncHandler(async (req, res) => {
//   const merchants = await User.find({ role: ROLES.MERCHANT, is_approved: true });
//   ok(res, merchants);
// });

// Get all approved merchants with their canteen
exports.getApprovedMerchants = asyncHandler(async (req, res) => {
    const merchants = await User.find({ 
      role: ROLES.MERCHANT,
      is_verified: true,
      $or: [{ is_approved: true }, { is_approved: { $exists: false } }]
    });
  // attach canteen info to each merchant
  const Canteen = require("../models/Canteen.model");
  const result = await Promise.all(
    merchants.map(async (m) => {
      const canteen = await Canteen.findOne({ manager_id: m._id });
      return { ...m.toObject(), canteen };
    })
  );
  ok(res, result);
});

// Block / unblock merchant
exports.toggleBlockMerchant = asyncHandler(async (req, res) => {
  const merchant = await User.findOne({ _id: req.params.id, role: ROLES.MERCHANT });
  if (!merchant) return notFound(res, "Merchant not found");
  merchant.is_blocked = !merchant.is_blocked;
  await merchant.save();
  ok(res, merchant, `Merchant ${merchant.is_blocked ? "blocked" : "unblocked"}`);
});

// Remove / deactivate merchant
exports.removeMerchant = asyncHandler(async (req, res) => {
  const Canteen = require("../models/Canteen.model");
  await User.findByIdAndUpdate(req.params.id, { is_blocked: true, is_approved: false });
  await Canteen.findOneAndUpdate({ manager_id: req.params.id }, { is_active: false });
  ok(res, null, "Merchant deactivated");
});

// Update merchant details
exports.updateMerchant = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;
  const merchant = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, phone },
    { new: true, runValidators: true }
  );
  if (!merchant) return notFound(res, "Merchant not found");
  ok(res, merchant, "Merchant updated");
});

// Reassign canteen to different merchant
exports.reassignCanteen = asyncHandler(async (req, res) => {
  const Canteen = require("../models/Canteen.model");
  const { manager_id } = req.body;
  const canteen = await Canteen.findByIdAndUpdate(
    req.params.canteenId,
    { manager_id },
    { new: true }
  );
  if (!canteen) return notFound(res, "Canteen not found");
  ok(res, canteen, "Canteen reassigned");
});

// Add new merchant directly (admin adds without registration flow)
exports.addMerchant = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) return badReq(res, "Email or phone already registered");
  const merchant = await User.create({
    name, email, phone, password,
    role: ROLES.MERCHANT,
    is_verified: true,
    is_approved: true,
  });
  created(res, merchant, "Merchant added successfully");
});