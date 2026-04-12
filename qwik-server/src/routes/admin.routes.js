const router = require("express").Router();
const ctrl   = require("../controllers/admin.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.use(protect, authorize("admin"));

router.get("/dashboard",                ctrl.getDashboard);
router.get("/merchants/pending",        ctrl.getPendingMerchants);
router.put("/merchants/:id/approve",    ctrl.approveMerchant);
router.put("/merchants/:id/reject",     ctrl.rejectMerchant);
router.get("/merchants/approved",        ctrl.getApprovedMerchants);
router.put("/merchants/:id/block",        ctrl.toggleBlockMerchant);
router.delete("/merchants/:id",           ctrl.removeMerchant);
router.put("/merchants/:id",              ctrl.updateMerchant);
router.post("/merchants",                 ctrl.addMerchant);
router.put("/canteens/:canteenId/reassign", ctrl.reassignCanteen);
router.get("/users",                    ctrl.getAllUsers);
router.put("/users/:id/block",          ctrl.toggleBlockUser);
router.get("/canteens",                 ctrl.getAllCanteens);
router.post("/canteens",                ctrl.addCanteen);
router.put("/canteens/:id",             ctrl.updateCanteen);
router.put("/canteens/:id/reactivate",  ctrl.reactivateCanteen);
router.delete("/canteens/:id",          ctrl.deleteCanteen);
router.delete("/canteens/:id/hard",     ctrl.hardDeleteCanteen);


module.exports = router;


