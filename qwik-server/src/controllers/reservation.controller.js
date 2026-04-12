const Reservation = require("../models/Reservation.model");
const Canteen     = require("../models/Canteen.model");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, badReq, notFound, forbidden } = require("../utils/apiResponse");
const { RESERVATION_STATUS, RESERVATION_TYPE, CAKE_MIN_ADVANCE_HOURS } = require("../config/constants");

// ── POST /api/reservations ───────────────────────────────────
exports.create = asyncHandler(async (req, res) => {
  const { canteen_id, type, date, time_slot, party_size, cake_details } = req.body;

  const canteen = await Canteen.findById(canteen_id);
  if (!canteen || !canteen.is_active) return badReq(res, "Canteen not available");

  // Enforce 4-hour minimum advance for cake orders.
  // FIX: `${date}T${time_slot}:00` is treated as LOCAL time by the JS Date
  // constructor only when it contains an explicit offset. Without one, V8
  // treats the combined string as LOCAL — but to be safe and portable we
  // parse date/time components manually so the comparison is always in the
  // same timezone (server local, which matches what the user typed).
  if (type === RESERVATION_TYPE.CAKE_ORDER) {
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute]     = time_slot.split(":").map(Number);
    // Build Date in local time explicitly
    const reservationDateTime = new Date(year, month - 1, day, hour, minute, 0, 0);
    const hoursAhead = (reservationDateTime - Date.now()) / (1000 * 60 * 60);
    if (hoursAhead < CAKE_MIN_ADVANCE_HOURS)
      return badReq(res, `Cake orders must be placed at least ${CAKE_MIN_ADVANCE_HOURS} hours in advance`);
  }

  const reservation = await Reservation.create({
    user_id: req.user._id,
    canteen_id,
    type,
    date,
    time_slot,
    party_size: party_size || null,
    cake_details: cake_details || {},
  });

  created(res, reservation, "Reservation request sent to merchant");
});

// ── GET /api/reservations/me ─────────────────────────────────
exports.myReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ user_id: req.user._id })
    .populate("canteen_id", "name hall")
    .sort({ createdAt: -1 });
  ok(res, reservations);
});

// ── PUT /api/reservations/:id/cancel ────────────────────────
exports.cancel = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findOne({ _id: req.params.id, user_id: req.user._id });
  if (!reservation) return notFound(res, "Reservation not found");
  if (reservation.status !== RESERVATION_STATUS.PENDING)
    return badReq(res, "Only pending reservations can be cancelled");

  reservation.status = RESERVATION_STATUS.CANCELLED;
  await reservation.save();
  ok(res, reservation, "Reservation cancelled");
});

// ── GET /api/reservations/canteen/:canteenId — merchant view ─
exports.getCanteenReservations = asyncHandler(async (req, res) => {
  const canteen = await Canteen.findOne({ _id: req.params.canteenId, manager_id: req.user._id });
  if (!canteen) return forbidden(res, "Not your canteen");

  const reservations = await Reservation.find({ canteen_id: req.params.canteenId })
    .populate("user_id", "name email phone room_no hall_of_residence")
    .sort({ date: 1, time_slot: 1 });
  ok(res, reservations);
});

// ── PUT /api/reservations/:id/status — merchant approve/reject
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, merchant_note } = req.body;
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) return notFound(res, "Reservation not found");

  const canteen = await Canteen.findOne({ _id: reservation.canteen_id, manager_id: req.user._id });
  if (!canteen) return forbidden(res, "Not your canteen");

  reservation.status = status;
  if (merchant_note) reservation.merchant_note = merchant_note;
  await reservation.save();
  ok(res, reservation, `Reservation ${status.toLowerCase()}`);
});
