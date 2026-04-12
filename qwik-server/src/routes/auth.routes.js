const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/register",          ctrl.register);
router.post("/verify-otp",        ctrl.verifyOTP);
router.post("/login",             ctrl.login);
router.post("/admin-login",       ctrl.adminLogin);
router.post("/admin-register",    ctrl.adminRegister);
router.post("/forgot-password",   ctrl.forgotPassword);
router.post("/reset-password",    ctrl.resetPassword);
router.post("/logout",            ctrl.logout);
router.post("/resend-otp",        ctrl.resendVerificationOTP);

// FIX 4: In-session password change — requires auth token
router.post("/change-password", protect, ctrl.changePassword);

module.exports = router;
