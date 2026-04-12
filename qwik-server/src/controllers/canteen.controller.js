const Canteen = require("../models/Canteen.model");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, badReq, notFound } = require("../utils/apiResponse");

/**
 * Returns true if the current time falls within the canteen's
 * opening_time..closing_time window (HH:MM strings, server local time).
 * If either time is unset we fall back to the manually-toggled is_open flag.
 */
function isWithinOpeningHours(canteen) {
  if (!canteen.opening_time || !canteen.closing_time) return canteen.is_open;

  const now = new Date();
  const [openH,  openM]  = canteen.opening_time.split(":").map(Number);
  const [closeH, closeM] = canteen.closing_time.split(":").map(Number);

  const nowMinutes   = now.getHours() * 60 + now.getMinutes();
  const openMinutes  = openH  * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  // Handle overnight spans (e.g. 22:00 – 02:00)
  if (closeMinutes < openMinutes) {
    return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
  }
  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}

/**
 * Attaches a computed is_open:
 *   - false  if merchant has manually closed the canteen
 *   - false  if current time is outside the configured opening/closing window
 *   - true   only when merchant says open AND clock is within the window
 */
function withComputedStatus(canteen) {
  const doc = canteen.toObject ? canteen.toObject() : { ...canteen };
  if (!doc.is_open) return doc;           // merchant closed it — honour that
  doc.is_open = isWithinOpeningHours(canteen);
  return doc;
}

// GET /api/canteens — list all active canteens
exports.getAllCanteens = asyncHandler(async (req, res) => {
  const canteens = await Canteen.find({ is_active: true }).populate("manager_id", "name email phone");
  ok(res, canteens.map(withComputedStatus));
});

// GET /api/canteens/:id
exports.getCanteen = asyncHandler(async (req, res) => {
  const canteen = await Canteen.findById(req.params.id).populate("manager_id", "name email phone");
  if (!canteen) return notFound(res, "Canteen not found");
  ok(res, withComputedStatus(canteen));
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
  ok(res, withComputedStatus(canteen), `Canteen marked ${is_open ? "open" : "closed"}`);
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
  ok(res, withComputedStatus(canteen), "Canteen updated");
});

// GET /api/canteens/mine — merchant gets ALL their canteens
exports.getMyCanteen = asyncHandler(async (req, res) => {
  const canteens = await Canteen.find({ manager_id: req.user._id, is_active: true });
  if (!canteens.length) return notFound(res, "No canteen assigned to you yet");
  ok(res, canteens.map(withComputedStatus));
});
