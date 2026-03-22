const router = require("express").Router();
const ctrl   = require("../controllers/reservation.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.use(protect);

router.post("/",                               authorize("customer"), ctrl.create);
router.get("/me",                              authorize("customer"), ctrl.myReservations);
router.put("/:id/cancel",                      authorize("customer"), ctrl.cancel);
router.get("/canteen/:canteenId",              authorize("merchant"), ctrl.getCanteenReservations);
router.put("/:id/status",                      authorize("merchant"), ctrl.updateStatus);

module.exports = router;
