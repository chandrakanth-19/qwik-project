const router = require("express").Router();
const ctrl   = require("../controllers/order.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.use(protect);

router.post("/",                           authorize("customer"), ctrl.placeOrder);
router.get("/me",                          authorize("customer"), ctrl.myOrders);
router.get("/canteen/:canteenId",          authorize("merchant"), ctrl.getCanteenOrders);
router.get("/:id",                         ctrl.getOrder);
router.put("/:id/cancel",                  authorize("customer"), ctrl.cancelOrder);
router.put("/:id/reconfirm",               authorize("customer"), ctrl.reconfirmOrder);
router.put("/:id/status",                  authorize("merchant"), ctrl.updateOrderStatus);
router.post("/:id/review",                 authorize("customer"), ctrl.submitReview);

module.exports = router;
