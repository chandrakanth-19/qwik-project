const router = require("express").Router();
const ctrl = require("../controllers/canteen.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.get("/", ctrl.getAllCanteens);
router.get("/mine", protect, authorize("merchant"), ctrl.getMyCanteen);
router.get("/:id", ctrl.getCanteen);
router.put("/:id", protect, authorize("merchant"), ctrl.updateCanteen);
router.put("/:id/status", protect, authorize("merchant"), ctrl.updateStatus);

module.exports = router;
