const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const { ROLES } = require("../config/constants");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, badReq, unauth } = require("../utils/apiResponse");
const {
  generateOTP, sendEmailOTP, sendSMSOTP,
  saveOTPToUser, verifyOTPForUser, clearOTP,
} = require("../services/otp.service");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// ── POST /api/auth/register ──────────────────────────────────
// FIX 1: Two-phase registration.
// Phase 1 (this endpoint): validate inputs, send OTP, store a TEMPORARY
//   unverified record — but only if one doesn't already exist.
//   We keep the record soft-deleted (is_verified:false) until Phase 2 succeeds.
//   Crucially we NEVER let an unverified record permanently lock a phone/email:
//   if the user re-registers with the same contact and is still unverified,
//   we overwrite the old pending record instead of returning PHONE_TAKEN.
exports.register = asyncHandler(async (req, res) => {
  const {
    name, email, phone, password, role,
    hall_of_residence, room_no, canteen_name, canteen_hall,
  } = req.body;

  if (!email && !phone) return badReq(res, "Provide email or phone number");
  if (email && !email.endsWith("@iitk.ac.in") && role !== ROLES.MERCHANT)
    return badReq(res, "Students must use an @iitk.ac.in email");

  // Check if the contact is already taken by a VERIFIED account
  if (email) {
    const taken = await User.findOne({ email, is_verified: true });
    if (taken) return badReq(res, "EMAIL_TAKEN");
  }
  if (phone) {
    const taken = await User.findOne({ phone, is_verified: true });
    if (taken) return badReq(res, "PHONE_TAKEN");
  }

  // Remove any previous unverified (pending) record for this contact so we
  // don't accumulate stale records or hit the sparse-unique index.
  const orClause = [];
  if (email) orClause.push({ email });
  if (phone) orClause.push({ phone });
  if (orClause.length) {
    await User.deleteMany({ $or: orClause, is_verified: false });
  }

  const userData = {
    name, email, phone, password,
    role: role || ROLES.CUSTOMER,
    hall_of_residence,
    room_no,
    is_verified: false,
  };
  if (role === ROLES.MERCHANT && (canteen_name || canteen_hall)) {
    userData.canteen_request = { canteen_name, canteen_hall };
  }

  const user = await User.create(userData);

  // Send OTP — if email delivery fails we delete the pending record so the
  // user can try again without hitting a stale lock.
  const otp = generateOTP();
  try {
    await saveOTPToUser(user, otp);
    if (email) await sendEmailOTP(email, otp);
    else await sendSMSOTP(phone, otp);
  } catch (err) {
    await User.deleteOne({ _id: user._id });
    return badReq(res, "Failed to send OTP. Please check your email address and try again.");
  }

  created(res, { user_id: user._id }, "OTP sent. Check your email/phone.");
});

// ── POST /api/auth/verify-otp ────────────────────────────────
// Phase 2: mark the user verified only after a correct OTP.
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

  if (!user) return unauth(res, "No account found with this email. Please register.");
  if (!(await user.matchPassword(password)))
    return unauth(res, "Invalid credentials. Please check your password.");

  if (user.role === ROLES.ADMIN) return unauth(res, "Admins must use the admin login page.");
  if (!user.is_verified) return unauth(res, "Please verify your account first");

  if (user.role === ROLES.MERCHANT && !user.is_approved)
    return unauth(res, "PENDING_ADMIN_APPROVAL");

  if (user.is_blocked) return unauth(res, "Your account has been blocked by the admin");

  const token = signToken(user._id);
  ok(res, {
    token, role: user.role,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
  }, "Login successful");
});

// ── POST /api/auth/admin-login ───────────────────────────────
exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return badReq(res, "Email and password required");

  const user = await User.findOne({ email, role: ROLES.ADMIN }).select("+password");
  if (!user) return unauth(res, "No admin account found with this email.");
  if (!(await user.matchPassword(password)))
    return unauth(res, "Invalid admin credentials. Please check your password.");

  const token = signToken(user._id);
  ok(res, { token, role: user.role, user: { _id: user._id, name: user.name, email: user.email } }, "Admin login successful");
});

// ── POST /api/auth/admin-register ────────────────────────────
exports.adminRegister = asyncHandler(async (req, res) => {
  const { name, email, password, invite_code } = req.body;
  if (invite_code !== process.env.ADMIN_INVITE_CODE)
    return unauth(res, "Invalid invite code");
  if (!email) return badReq(res, "Admin email is required");

  const existing = await User.findOne({ email });
  if (existing) return badReq(res, "Email already registered");

  const user = await User.create({ name, email, password, role: ROLES.ADMIN, is_verified: false });

  const otp = generateOTP();
  try {
    await saveOTPToUser(user, otp);
    await sendEmailOTP(email, otp);
  } catch (err) {
    await User.deleteOne({ _id: user._id });
    return badReq(res, "Failed to send OTP. Please check your email address and try again.");
  }

  created(res, { user_id: user._id }, "Admin account created. Check your email for the OTP.");
});

// ── POST /api/auth/forgot-password ───────────────────────────
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email, phone } = req.body;
  const query = email ? { email } : { phone };
  const user = await User.findOne(query);
  if (!user) return badReq(res, "No account found");

  const otp = generateOTP();
  try {
    await saveOTPToUser(user, otp);
    if (email) await sendEmailOTP(email, otp);
    else await sendSMSOTP(phone, otp);
  } catch (err) {
    return badReq(res, "Failed to send OTP. Please check your email address and try again.");
  }

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

// ── POST /api/auth/logout ─────────────────────────────────────
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
  try {
    await saveOTPToUser(user, otp);
    if (email) await sendEmailOTP(email, otp);
    else await sendSMSOTP(phone, otp);
  } catch (err) {
    return badReq(res, "Failed to send OTP. Please check your email address and try again.");
  }

  ok(res, { user_id: user._id }, "OTP sent successfully");
});

// ── POST /api/auth/change-password ───────────────────────────
// FIX 4: In-session password change for ALL roles (customer, merchant, admin).
// Requires the current password for verification — no OTP needed since the
// user is already authenticated.
exports.changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password)
    return badReq(res, "Provide current_password and new_password");
  if (new_password.length < 6)
    return badReq(res, "New password must be at least 6 characters");

  const user = await User.findById(req.user._id).select("+password");
  if (!user) return badReq(res, "User not found");

  if (!(await user.matchPassword(current_password)))
    return unauth(res, "Current password is incorrect");

  user.password = new_password;
  await user.save();
  ok(res, null, "Password changed successfully");
});
