const MenuItem = require("../models/MenuItem.model");
const Canteen  = require("../models/Canteen.model");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, badReq, notFound, forbidden } = require("../utils/apiResponse");

// GET /api/canteens/:id/menu?search=&category=&is_veg=
exports.getMenu = asyncHandler(async (req, res) => {
  const { search, category, is_veg } = req.query;
  const filter = { canteen_id: req.params.id };
  if (search) filter.name = { $regex: search, $options: "i" };
  if (category) filter.category = category;
  if (is_veg !== undefined) filter.is_veg = is_veg === "true";

  const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
  ok(res, items);
});

// POST /api/canteens/:id/menu — merchant adds item
exports.addItem = asyncHandler(async (req, res) => {
  const canteen = await Canteen.findOne({ _id: req.params.id, manager_id: req.user._id });
  if (!canteen) return forbidden(res, "Not your canteen");

  const item = await MenuItem.create({ ...req.body, canteen_id: req.params.id });
  created(res, item, "Menu item added");
});

// PUT /api/menu/:itemId — update item
exports.updateItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.itemId);
  if (!item) return notFound(res, "Item not found");

  const canteen = await Canteen.findOne({ _id: item.canteen_id, manager_id: req.user._id });
  if (!canteen) return forbidden(res, "Not your canteen");

  Object.assign(item, req.body);
  await item.save();
  ok(res, item, "Item updated");
});

// DELETE /api/menu/:itemId
exports.deleteItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.itemId);
  if (!item) return notFound(res, "Item not found");

  const canteen = await Canteen.findOne({ _id: item.canteen_id, manager_id: req.user._id });
  if (!canteen) return forbidden(res, "Not your canteen");

  await item.deleteOne();
  ok(res, null, "Item removed");
});

// PUT /api/menu/:itemId/availability
exports.toggleAvailability = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.itemId);
  if (!item) return notFound(res, "Item not found");

  const canteen = await Canteen.findOne({ _id: item.canteen_id, manager_id: req.user._id });
  if (!canteen) return forbidden(res, "Not your canteen");

  item.is_available = req.body.is_available ?? !item.is_available;
  await item.save();
  ok(res, item, `Item marked ${item.is_available ? "available" : "unavailable"}`);
});

// POST /api/menu/:itemId/photo — upload item image
exports.uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) return badReq(res, "No file uploaded");
  const item = await MenuItem.findByIdAndUpdate(
    req.params.itemId,
    { photo_url: `/uploads/${req.file.filename}` },
    { new: true }
  );
  ok(res, { photo_url: item.photo_url }, "Photo updated");
});
