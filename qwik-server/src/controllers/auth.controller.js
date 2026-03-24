const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const { ROLES } = require("../config/constants");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, badReq, unauth, serverErr } = require("../utils/apiResponse");
const {
  generateOTP, sendEmailOTP, sendSMSOTP,
  saveOTPToUser, verifyOTPForUser, clearOTP,
} = require("../services/otp.service");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// ── POST /api/auth/register ──────────────────────────────────
exports.register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, hall_of_residence } = req.body;

  if (!email && !phone) return badReq(res, "Provide email or phone number");
  if (email && !email.endsWith("@iitk.ac.in") && role !== ROLES.MERCHANT)
    return badReq(res, "Students must use an @iitk.ac.in email");

  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) return badReq(res, "Account already exists with this email or phone");

  const user = await User.create({ name, email, phone, password, role: role || ROLES.CUSTOMER, hall_of_residence });

  const otp = generateOTP();
  await saveOTPToUser(user, otp);

  if (email) await sendEmailOTP(email, otp);
  else await sendSMSOTP(phone, otp);

  created(res, { user_id: user._id }, "Account created. Check your email/phone for the OTP.");
});

// ── POST /api/auth/verify-otp ────────────────────────────────
exports.verifyOTP = asyncHandler(async (req, res) => {
  const { user_id, otp } = req.body;
  const user = await User.findById(user_id).select("+otp +otp_expires_at");
  if (!user) return badReq(res, "User not found");

  const result = verifyOTPForUser(user, otp);
  if (!result.valid) return badReq(res, result.reason);

  user.is_verified = true;
  await clearOTP(user);

  const token = signToken(user._id);
  ok(res, {
  token,
  role: user.role,
  user: { _id: user._id, name: user.name, email: user.email, role: user.role },
}, "Account verified successfully");
});

// ── POST /api/auth/login ─────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;
  if (!password || (!email && !phone))
    return badReq(res, "Provide email/phone and password");

  const query = email ? { email } : { phone };
  const user = await User.findOne(query).select("+password");
  if (!user || !(await user.matchPassword(password)))
    return unauth(res, "Invalid credentials");
  if (!user.is_verified) return unauth(res, "Please verify your account first");
  if (user.is_blocked) return unauth(res, "Your account has been blocked");

  const token = signToken(user._id);
  ok(res, {
    token,
    role: user.role,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
  }, "Login successful");
});

// ── POST /api/auth/admin-login ───────────────────────────────
exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return badReq(res, "Email and password required");

  const user = await User.findOne({ email, role: ROLES.ADMIN }).select("+password");
  if (!user || !(await user.matchPassword(password)))
    return unauth(res, "Invalid admin credentials");

  const token = signToken(user._id);
  ok(res, { token, role: user.role, user: { _id: user._id, name: user.name } }, "Admin login successful");
});

// ── POST /api/auth/admin-register ────────────────────────────
exports.adminRegister = asyncHandler(async (req, res) => {
  const { name, email, password, invite_code } = req.body;
  if (invite_code !== process.env.ADMIN_INVITE_CODE)
    return unauth(res, "Invalid invite code");

  const existing = await User.findOne({ email });
  if (existing) return badReq(res, "Email already registered");

  const user = await User.create({ name, email, password, role: ROLES.ADMIN, is_verified: true });
  const token = signToken(user._id);
  created(res, { token, role: user.role }, "Super admin account created");
});

// ── POST /api/auth/forgot-password ──────────────────────────
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email, phone } = req.body;
  const query = email ? { email } : { phone };
  const user = await User.findOne(query);
  if (!user) return badReq(res, "No account found");

  const otp = generateOTP();
  await saveOTPToUser(user, otp);
  if (email) await sendEmailOTP(email, otp);
  else await sendSMSOTP(phone, otp);

  ok(res, { user_id: user._id }, "OTP sent for password reset");
});

// ── POST /api/auth/reset-password ────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
  const { user_id, otp, new_password } = req.body;
  const user = await User.findById(user_id).select("+otp +otp_expires_at");
  if (!user) return badReq(res, "User not found");

  const result = verifyOTPForUser(user, otp);
  if (!result.valid) return badReq(res, result.reason);

  user.password = new_password;
  await user.save();
  await clearOTP(user);

  ok(res, null, "Password reset successful");
});

// ── POST /api/auth/logout ────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  // JWT is stateless; client discards token. Return confirmation.
  ok(res, null, "Logged out successfully");
});

// ── POST /api/auth/resend-otp ─────────────────────────────────
exports.resendVerificationOTP = asyncHandler(async (req, res) => {
  const { email, phone } = req.body;
  const query = email ? { email } : { phone };

  const user = await User.findOne(query);
  if (!user) return badReq(res, "No account found with this email or phone");
  if (user.is_verified) return badReq(res, "Account is already verified");

  const otp = generateOTP();
  await saveOTPToUser(user, otp);

  if (email) await sendEmailOTP(email, otp);
  else await sendSMSOTP(phone, otp);

  ok(res, { user_id: user._id }, "OTP sent successfully");
});