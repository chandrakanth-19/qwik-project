const router = require("express").Router();
const ctrl   = require("../controllers/payment.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.use(protect);
router.post("/initiate/:orderId", authorize("customer"), ctrl.initiatePayment);
router.post("/verify",           authorize("customer"), ctrl.verifyPayment);

module.exports = router;
