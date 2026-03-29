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
      // FIX 1: pending = verified email but not yet admin-approved (is_approved false/missing)
      User.countDocuments({ role: ROLES.MERCHANT, is_verified: true, is_approved: { $ne: true } }),
    ]);

  ok(res, { totalUsers, totalMerchants, totalCanteens, totalOrders, pendingMerchants });
});

// ── GET /api/admin/merchants/pending ─────────────────────────
// FIX 1: Pending = verified their email OTP but not yet admin-approved
exports.getPendingMerchants = asyncHandler(async (req, res) => {
  const merchants = await User.find({
    role: ROLES.MERCHANT,
    is_verified: true,
    is_approved: { $ne: true },
  });
  ok(res, merchants);
});

// ── PUT /api/admin/merchants/:id/approve ─────────────────────
// FIX 1: Only sets is_approved=true here; canteen created with provided details
exports.approveMerchant = asyncHandler(async (req, res) => {
  const { canteen_name, hall, location, opening_time, closing_time, contact } = req.body;

  const merchant = await User.findOneAndUpdate(
    { _id: req.params.id, role: ROLES.MERCHANT },
    { is_approved: true },
    { new: true }
  );
  if (!merchant) return notFound(res, "Merchant not found");

  // Create canteen only if one doesn't already exist for this merchant
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
  const merchant = await User.findOneAndDelete({
    _id: req.params.id,
    role: ROLES.MERCHANT,
    is_approved: { $ne: true },
  });
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
// FIX 2: Admin can directly add a canteen and assign a merchant
exports.addCanteen = asyncHandler(async (req, res) => {
  const { name, hall, location, opening_time, closing_time, contact, manager_id } = req.body;
  if (!name) return badReq(res, "Canteen name is required");
  if (!manager_id) return badReq(res, "A merchant (manager) must be assigned");

  // Verify the merchant exists and is approved
  const merchant = await User.findOne({ _id: manager_id, role: ROLES.MERCHANT, is_approved: true });
  if (!merchant) return badReq(res, "Merchant not found or not yet approved");

  // Prevent assigning a second canteen to the same merchant
  const existing = await Canteen.findOne({ manager_id });
  if (existing) return badReq(res, "This merchant already manages a canteen. A merchant can only be assigned to one canteen.");

  const canteen = await Canteen.create({ name, hall, location, opening_time, closing_time, contact, manager_id });
  created(res, canteen, "Canteen created and assigned");
});

// ── GET /api/admin/canteens ──────────────────────────────────
exports.getAllCanteens = asyncHandler(async (req, res) => {
  const canteens = await Canteen.find().populate("manager_id", "name email");
  ok(res, canteens);
});

// ── PUT /api/admin/canteens/:id ──────────────────────────────
// FIX 2: Admin can update canteen including re-assigning merchant and editing timings
exports.updateCanteen = asyncHandler(async (req, res) => {
  const { name, hall, location, opening_time, closing_time, contact, manager_id } = req.body;
  const update = { name, hall, location, opening_time, closing_time, contact };

  if (manager_id) {
    const merchant = await User.findOne({ _id: manager_id, role: ROLES.MERCHANT, is_approved: true });
    if (!merchant) return badReq(res, "Merchant not found or not approved");
    // Prevent assigning merchant who already manages a different canteen
    const conflict = await Canteen.findOne({ manager_id, _id: { $ne: req.params.id } });
    if (conflict) return badReq(res, "This merchant already manages another canteen. A merchant can only be assigned to one canteen.");
    update.manager_id = manager_id;
  }

  const canteen = await Canteen.findByIdAndUpdate(req.params.id, update, { new: true }).populate("manager_id", "name email");
  if (!canteen) return notFound(res, "Canteen not found");
  ok(res, canteen, "Canteen updated");
});

// ── DELETE /api/admin/canteens/:id ───────────────────────────
exports.deleteCanteen = asyncHandler(async (req, res) => {
  const canteen = await Canteen.findByIdAndUpdate(req.params.id, { is_active: false }, { new: true });
  if (!canteen) return notFound(res, "Canteen not found");
  ok(res, null, "Canteen deactivated");
});

// ── GET /api/admin/merchants/approved ────────────────────────
exports.getApprovedMerchants = asyncHandler(async (req, res) => {
  const merchants = await User.find({ role: ROLES.MERCHANT, is_approved: true });
  const result = await Promise.all(
    merchants.map(async (m) => {
      const canteens = await Canteen.find({ manager_id: m._id });
      return { ...m.toObject(), canteens };
    })
  );
  ok(res, result);
});

// ── PUT /api/admin/merchants/:id/block ───────────────────────
exports.toggleBlockMerchant = asyncHandler(async (req, res) => {
  const merchant = await User.findOne({ _id: req.params.id, role: ROLES.MERCHANT });
  if (!merchant) return notFound(res, "Merchant not found");
  merchant.is_blocked = !merchant.is_blocked;
  await merchant.save();
  ok(res, merchant, `Merchant ${merchant.is_blocked ? "blocked" : "unblocked"}`);
});

// ── DELETE /api/admin/merchants/:id ──────────────────────────
exports.removeMerchant = asyncHandler(async (req, res) => {
  const merchant = await User.findOne({ _id: req.params.id, role: ROLES.MERCHANT });
  if (!merchant) return notFound(res, "Merchant not found");

  // Deactivate their canteen(s) but keep manager_id so the record is traceable
  // manager_id will point to a deleted user — MongoDB has no FK enforcement
  await Canteen.updateMany({ manager_id: req.params.id }, { is_active: false });

  // Permanently delete the merchant User from DB
  await User.deleteOne({ _id: req.params.id });

  ok(res, null, "Merchant permanently deleted and canteen(s) deactivated");
});

// ── PUT /api/admin/canteens/:id/reactivate ───────────────────
exports.reactivateCanteen = asyncHandler(async (req, res) => {
  const { manager_id } = req.body;
  if (!manager_id) return badReq(res, "You must assign a merchant to reactivate a canteen");

  const merchant = await User.findOne({ _id: manager_id, role: ROLES.MERCHANT, is_approved: true });
  if (!merchant) return badReq(res, "Merchant not found or not approved");

  // Prevent assigning a merchant who already manages an active canteen
  const conflict = await Canteen.findOne({ manager_id, is_active: true, _id: { $ne: req.params.id } });
  if (conflict) return badReq(res, "This merchant already manages an active canteen");

  const canteen = await Canteen.findByIdAndUpdate(
    req.params.id,
    { is_active: true, manager_id },
    { new: true }
  ).populate("manager_id", "name email");

  if (!canteen) return notFound(res, "Canteen not found");
  ok(res, canteen, "Canteen reactivated and merchant assigned");
});

// ── DELETE /api/admin/canteens/:id/hard ──────────────────────
// Only allowed when canteen is already deactivated
exports.hardDeleteCanteen = asyncHandler(async (req, res) => {
  const canteen = await Canteen.findById(req.params.id);
  if (!canteen) return notFound(res, "Canteen not found");
  if (canteen.is_active) return badReq(res, "Cannot permanently delete an active canteen. Deactivate it first.");

  await Canteen.deleteOne({ _id: req.params.id });
  ok(res, null, "Canteen permanently deleted");
});

// ── PUT /api/admin/merchants/:id ─────────────────────────────
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

// ── POST /api/admin/merchants ────────────────────────────────
// Admin directly adds a pre-approved merchant
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

// ── PUT /api/admin/canteens/:canteenId/reassign ──────────────
exports.reassignCanteen = asyncHandler(async (req, res) => {
  const { manager_id } = req.body;
  // Prevent assigning merchant who already manages a different canteen
  const conflict = await Canteen.findOne({ manager_id, _id: { $ne: req.params.canteenId } });
  if (conflict) return badReq(res, "This merchant already manages another canteen. A merchant can only be assigned to one canteen.");
  const canteen = await Canteen.findByIdAndUpdate(
    req.params.canteenId,
    { manager_id },
    { new: true }
  );
  if (!canteen) return notFound(res, "Canteen not found");
  ok(res, canteen, "Canteen reassigned");
});