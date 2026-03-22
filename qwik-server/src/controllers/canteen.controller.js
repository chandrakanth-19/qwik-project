const Canteen = require("../models/Canteen.model");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, badReq, notFound } = require("../utils/apiResponse");

// GET /api/canteens — list all active canteens
exports.getAllCanteens = asyncHandler(async (req, res) => {
  const canteens = await Canteen.find({ is_active: true }).populate("manager_id", "name email phone");
  ok(res, canteens);
});

// GET /api/canteens/:id
exports.getCanteen = asyncHandler(async (req, res) => {
  const canteen = await Canteen.findById(req.params.id).populate("manager_id", "name email");
  if (!canteen) return notFound(res, "Canteen not found");
  ok(res, canteen);
});

// PUT /api/canteens/:id/status — merchant toggles open/closed
exports.updateStatus = asyncHandler(async (req, res) => {
  const { is_open } = req.body;
  const canteen = await Canteen.findOneAndUpdate(
    { _id: req.params.id, manager_id: req.user._id },
    { is_open },
    { new: true }
  );
  if (!canteen) return notFound(res, "Canteen not found or not yours");
  ok(res, canteen, `Canteen marked ${is_open ? "open" : "closed"}`);
});

// PUT /api/canteens/:id — update canteen details (merchant)
exports.updateCanteen = asyncHandler(async (req, res) => {
  const { name, location, hall, opening_time, closing_time, contact, unavailable_days } = req.body;
  const canteen = await Canteen.findOneAndUpdate(
    { _id: req.params.id, manager_id: req.user._id },
    { name, location, hall, opening_time, closing_time, contact, unavailable_days },
    { new: true, runValidators: true }
  );
  if (!canteen) return notFound(res, "Canteen not found or not yours");
  ok(res, canteen, "Canteen updated");
});

// GET /api/canteens/mine — merchant gets their own canteen
exports.getMyCanteen = asyncHandler(async (req, res) => {
  const canteen = await Canteen.findOne({ manager_id: req.user._id });
  if (!canteen) return notFound(res, "No canteen assigned to you yet");
  ok(res, canteen);
});
