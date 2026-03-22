  const User = require("../models/User.model");
const asyncHandler = require("../utils/asyncHandler");
const { ok, badReq } = require("../utils/apiResponse");

exports.getMe = asyncHandler(async (req, res) => {
  ok(res, req.user);
});

exports.updateMe = asyncHandler(async (req, res) => {
  const { name, phone, hall_of_residence, room_no } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  if (hall_of_residence) updates.hall_of_residence = hall_of_residence;
  if (room_no) updates.room_no = room_no;

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  ok(res, user, "Profile updated");
});

exports.uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) return badReq(res, "No file uploaded");
  const photo_url = `/uploads/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user._id, { profile_photo: photo_url }, { new: true });
  ok(res, { profile_photo: user.profile_photo }, "Photo updated");
});
