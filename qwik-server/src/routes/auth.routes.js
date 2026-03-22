const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");

router.post("/register",         ctrl.register);
router.post("/verify-otp",       ctrl.verifyOTP);
router.post("/login",            ctrl.login);
router.post("/admin-login",      ctrl.adminLogin);
router.post("/admin-register",   ctrl.adminRegister);
router.post("/forgot-password",  ctrl.forgotPassword);
router.post("/reset-password",   ctrl.resetPassword);
router.post("/logout",           ctrl.logout);

module.exports = router;
