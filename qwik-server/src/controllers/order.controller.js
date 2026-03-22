const Order    = require("../models/Order.model");
const MenuItem = require("../models/MenuItem.model");
const Review   = require("../models/Review.model");
const Canteen  = require("../models/Canteen.model");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, badReq, notFound, forbidden } = require("../utils/apiResponse");
const { ORDER_STATUS } = require("../config/constants");

const TAX_RATE = 0.05; // 5%

// ── POST /api/orders — customer places order ─────────────────
exports.placeOrder = asyncHandler(async (req, res) => {
  const { canteen_id, items } = req.body; // items: [{item_id, qty}]
  if (!items?.length) return badReq(res, "Cart is empty");

  const canteen = await Canteen.findById(canteen_id);
  if (!canteen || !canteen.is_active) return badReq(res, "Canteen not available");
  if (!canteen.is_open) return badReq(res, "Canteen is currently closed");

  // Fetch menu items and build order items
  const orderItems = [];
  let subtotal = 0;

  for (const { item_id, qty } of items) {
    const menuItem = await MenuItem.findById(item_id);
    if (!menuItem || menuItem.canteen_id.toString() !== canteen_id)
      return badReq(res, `Invalid item: ${item_id}`);

    orderItems.push({
      item_id: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      qty,
      is_available: menuItem.is_available,
    });
    subtotal += menuItem.price * qty;
  }

  const tax_amount   = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const total_amount = parseFloat((subtotal + tax_amount).toFixed(2));

  const order = await Order.create({
    user_id: req.user._id,
    canteen_id,
    items: orderItems,
    subtotal,
    tax_amount,
    total_amount,
    status: ORDER_STATUS.PENDING,
  });

  created(res, order, "Order placed. Waiting for merchant confirmation.");
});

// ── GET /api/orders/:id — get single order (polling endpoint) ─
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("canteen_id", "name hall")
    .populate("user_id", "name");
  if (!order) return notFound(res, "Order not found");

  // Only owner or merchant of that canteen can view
  const isOwner    = order.user_id._id.toString() === req.user._id.toString();
  const canteen    = await Canteen.findOne({ _id: order.canteen_id, manager_id: req.user._id });
  const isMerchant = !!canteen;

  if (!isOwner && !isMerchant && req.user.role !== "admin")
    return forbidden(res, "Access denied");

  ok(res, order);
});

// ── GET /api/orders/me — customer order history ───────────────
exports.myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user_id: req.user._id })
    .populate("canteen_id", "name hall")
    .sort({ createdAt: -1 });
  ok(res, orders);
});

// ── PUT /api/orders/:id/cancel — customer cancels pending order
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user_id: req.user._id });
  if (!order) return notFound(res, "Order not found");

  const cancellable = [ORDER_STATUS.PENDING, ORDER_STATUS.AWAITING_RECONFIRM];
  if (!cancellable.includes(order.status))
    return badReq(res, `Cannot cancel an order with status: ${order.status}`);

  order.status = ORDER_STATUS.CANCELLED;
  await order.save();
  ok(res, order, "Order cancelled");
});

// ── PUT /api/orders/:id/reconfirm — user reconfirms after partial accept
exports.reconfirmOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user_id: req.user._id });
  if (!order) return notFound(res, "Order not found");
  if (order.status !== ORDER_STATUS.AWAITING_RECONFIRM)
    return badReq(res, "Order is not awaiting reconfirmation");

  // Recalculate total based on available items only
  const availableItems = order.items.filter((i) => i.is_available);
  if (!availableItems.length) {
    order.status = ORDER_STATUS.CANCELLED;
    await order.save();
    return ok(res, order, "No available items left. Order cancelled.");
  }

  let subtotal = 0;
  availableItems.forEach((i) => (subtotal += i.price * i.qty));
  const tax_amount   = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const total_amount = parseFloat((subtotal + tax_amount).toFixed(2));

  order.items        = availableItems;
  order.subtotal     = subtotal;
  order.tax_amount   = tax_amount;
  order.total_amount = total_amount;
  order.status       = ORDER_STATUS.ACCEPTED;
  await order.save();

  ok(res, order, "Order reconfirmed. Proceed to payment.");
});

// ── GET /api/orders/canteen/:canteenId — merchant sees orders ─
exports.getCanteenOrders = asyncHandler(async (req, res) => {
  const canteen = await Canteen.findOne({ _id: req.params.canteenId, manager_id: req.user._id });
  if (!canteen) return forbidden(res, "Not your canteen");

  const { status } = req.query;
  const filter = { canteen_id: req.params.canteenId };
  if (status) filter.status = status;

  const orders = await Order.find(filter)
    .populate("user_id", "name email phone")
    .sort({ createdAt: -1 });
  ok(res, orders);
});

// ── PUT /api/orders/:id/status — merchant updates order status ─
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, merchant_note, unavailable_item_ids } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return notFound(res, "Order not found");

  const canteen = await Canteen.findOne({ _id: order.canteen_id, manager_id: req.user._id });
  if (!canteen) return forbidden(res, "Not your canteen");

  // Handle partial accept — mark specific items unavailable
  if (status === ORDER_STATUS.PARTIALLY_ACCEPTED && unavailable_item_ids?.length) {
    order.items = order.items.map((item) => ({
      ...item.toObject(),
      is_available: !unavailable_item_ids.includes(item.item_id.toString()),
    }));
    order.status = ORDER_STATUS.PARTIALLY_ACCEPTED;
    order.merchant_note = merchant_note || "";

    // Flip to awaiting user reconfirmation
    order.status = ORDER_STATUS.AWAITING_RECONFIRM;
    await order.save();
    return ok(res, order, "Partial accept sent to customer for reconfirmation");
  }

  order.status = status;
  if (merchant_note) order.merchant_note = merchant_note;
  await order.save();
  ok(res, order, "Order status updated");
});

// ── POST /api/orders/:id/review — submit review after COMPLETED
exports.submitReview = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user_id: req.user._id });
  if (!order) return notFound(res, "Order not found");
  if (order.status !== ORDER_STATUS.COMPLETED)
    return badReq(res, "You can only review completed orders");
  if (order.is_rated) return badReq(res, "You have already reviewed this order");

  const { ratings } = req.body; // [{item_id, rating, comment}]
  if (!ratings?.length) return badReq(res, "Provide at least one rating");

  for (const { item_id, rating, comment } of ratings) {
    const review = await Review.create({
      user_id:  req.user._id,
      item_id,
      order_id: order._id,
      rating,
      comment,
    });

    // Update avg_rating on MenuItem
    const allReviews = await Review.find({ item_id });
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await MenuItem.findByIdAndUpdate(item_id, {
      avg_rating:   parseFloat(avg.toFixed(1)),
      rating_count: allReviews.length,
    });
  }

  order.is_rated = true;
  await order.save();
  ok(res, null, "Thank you for your review!");
});
