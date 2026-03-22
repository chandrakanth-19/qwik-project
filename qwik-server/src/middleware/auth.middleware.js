const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const asyncHandler = require("../utils/asyncHandler");
const { unauth } = require("../utils/apiResponse");

const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return unauth(res, "Not authenticated");

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select("-password");
  if (!user) return unauth(res, "User no longer exists");
  if (user.is_blocked) return unauth(res, "Your account has been blocked");

  req.user = user;
  next();
});

module.exports = { protect };
