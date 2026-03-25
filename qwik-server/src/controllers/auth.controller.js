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
  const { name, email, phone, password, role, hall_of_residence, canteen_name, canteen_hall } = req.body;

  if (!email && !phone) return badReq(res, "Provide email or phone number");
  if (email && !email.endsWith("@iitk.ac.in") && role !== ROLES.MERCHANT)
    return badReq(res, "Students must use an @iitk.ac.in email");

  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) return badReq(res, "Account already exists with this email or phone");

  const userData = { name, email, phone, password, role: role || ROLES.CUSTOMER, hall_of_residence };
  if (role === ROLES.MERCHANT && (canteen_name || canteen_hall)) {
    userData.canteen_request = { canteen_name, canteen_hall };
  }
  const user = await User.create(userData);

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
  ok(res, { token, role: user.role, user: { _id: user._id, name: user.name, email: user.email, role: user.role } }, "Account verified successfully");
});

// ── POST /api/auth/login ─────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;
  if (!password || (!email && !phone))
    return badReq(res, "Provide email/phone and password");

  const query = email ? { email } : { phone };
  const user = await User.findOne(query).select("+password");

  // FIX 3: Distinguish "no account" from "wrong password" clearly
  if (!user) return unauth(res, "No account found with this email. Please register.");
  if (!(await user.matchPassword(password))) return unauth(res, "Invalid credentials. Please check your password.");

  if (user.role === ROLES.ADMIN) return unauth(res, "Admins must use the admin login page.");
  if (!user.is_verified) return unauth(res, "Please verify your account first");

  // FIX 1: Merchant must be admin-approved (is_approved=true) to login
  if (user.role === ROLES.MERCHANT && !user.is_approved) {
    return unauth(res, "PENDING_ADMIN_APPROVAL");
  }

  if (user.is_blocked) return unauth(res, "Your account has been blocked by the admin");

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
  // FIX 3: Same clear distinction for admin
  if (!user) return unauth(res, "No admin account found with this email.");
  if (!(await user.matchPassword(password))) return unauth(res, "Invalid admin credentials. Please check your password.");

  const token = signToken(user._id);
  ok(res, { token, role: user.role, user: { _id: user._id, name: user.name, email: user.email } }, "Admin login successful");
});

// ── POST /api/auth/admin-register ────────────────────────────
// FIX 4: Admin register now sends OTP — does NOT auto-login
exports.adminRegister = asyncHandler(async (req, res) => {
  const { name, email, password, invite_code } = req.body;
  if (invite_code !== process.env.ADMIN_INVITE_CODE)
    return unauth(res, "Invalid invite code");
  if (!email) return badReq(res, "Admin email is required");

  const existing = await User.findOne({ email });
  if (existing) return badReq(res, "Email already registered");

  // Create unverified — OTP will verify them
  const user = await User.create({ name, email, password, role: ROLES.ADMIN, is_verified: false });

  const otp = generateOTP();
  await saveOTPToUser(user, otp);
  await sendEmailOTP(email, otp);

  created(res, { user_id: user._id }, "Admin account created. Check your email for the OTP.");
});

// ── POST /api/auth/forgot-password ──────────────────────────
// FIX 4: Works for all roles including admin
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
