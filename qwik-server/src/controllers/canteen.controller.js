const Canteen = require("../models/Canteen.model");
const asyncHandler = require("../utils/asyncHandler");
const { ok, notFound } = require("../utils/apiResponse");

/**
 * Returns true if the current server time is within the canteen's
 * opening_time..closing_time window (HH:MM strings).
 * Returns false if either time is unset.
 */
function isWithinSchedule(canteen) {
  if (!canteen.opening_time || !canteen.closing_time) return false;

  const now = new Date();
  const [openH,  openM]  = canteen.opening_time.split(":").map(Number);
  const [closeH, closeM] = canteen.closing_time.split(":").map(Number);

  const nowMin   = now.getHours() * 60 + now.getMinutes();
  const openMin  = openH  * 60 + openM;
  const closeMin = closeH * 60 + closeM;

  // Handle overnight spans (e.g. 22:00 – 02:00)
  if (closeMin < openMin) {
    return nowMin >= openMin || nowMin < closeMin;
  }
  return nowMin >= openMin && nowMin < closeMin;
}

/**
 * Computes the effective is_open value for a canteen doc and attaches
 * helper fields so the frontend knows what mode it's in:
 *
 *   manual_override === true   → force open  (merchant explicitly opened)
 *   manual_override === false  → force closed (merchant explicitly closed)
 *   manual_override === null   → follow schedule automatically
 *
 * Also sets:
 *   schedule_open  — whether the clock is currently inside scheduled hours
 *   is_open        — the effective open/closed state shown to everyone
 */
function withComputedStatus(canteen) {
  const doc = canteen.toObject ? canteen.toObject() : { ...canteen };

  const scheduleOpen = isWithinSchedule(canteen);
  doc.schedule_open  = scheduleOpen;

  if (doc.manual_override === true) {
    doc.is_open = true;            // merchant forced open
  } else if (doc.manual_override === false) {
    doc.is_open = false;           // merchant forced closed
  } else {
    doc.is_open = scheduleOpen;    // follow the clock
  }

  return doc;
}

// GET /api/canteens — list all active canteens (customers & public)
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

// GET /api/canteens/mine — merchant gets their canteen(s)
exports.getMyCanteen = asyncHandler(async (req, res) => {
  const canteens = await Canteen.find({ manager_id: req.user._id, is_active: true });
  if (!canteens.length) return notFound(res, "No canteen assigned to you yet");
  ok(res, canteens.map(withComputedStatus));
});

/**
 * PUT /api/canteens/:id/status
 *
 * Body: { action: "open" | "close" | "auto" }
 *
 *   "open"  → manual_override = true  (force open, even outside schedule)
 *   "close" → manual_override = false (force closed, even inside schedule)
 *   "auto"  → manual_override = null  (go back to following the schedule)
 *
 * Legacy body { is_open: true/false } still supported for backwards compat.
 */
exports.updateStatus = asyncHandler(async (req, res) => {
  let manual_override;

  if ("action" in req.body) {
    const { action } = req.body;
    if (action === "open")       manual_override = true;
    else if (action === "close") manual_override = false;
    else if (action === "auto")  manual_override = null;
    else return notFound(res, "action must be 'open', 'close', or 'auto'");
  } else {
    // Legacy: { is_open: true/false } maps to force open / force closed
    manual_override = req.body.is_open ? true : false;
  }

  const canteen = await Canteen.findOneAndUpdate(
    { _id: req.params.id, manager_id: req.user._id },
    { manual_override },
    { new: true }
  );
  if (!canteen) return notFound(res, "Canteen not found or not yours");

  const result = withComputedStatus(canteen);
  ok(res, result, `Canteen is now ${result.is_open ? "open" : "closed"}`);
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
