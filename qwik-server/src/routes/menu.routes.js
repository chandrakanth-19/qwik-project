const router = require("express").Router();
const ctrl   = require("../controllers/menu.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const multer = require("multer");
const path   = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../../uploads")),
  filename:    (req, file, cb) => cb(null, `item-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

// Canteen-scoped menu
router.get("/canteen/:id",    ctrl.getMenu);
router.post("/canteen/:id",   protect, authorize("merchant"), ctrl.addItem);

// Item-level operations
router.put("/:itemId",              protect, authorize("merchant"), ctrl.updateItem);
router.delete("/:itemId",           protect, authorize("merchant"), ctrl.deleteItem);
router.put("/:itemId/availability", protect, authorize("merchant"), ctrl.toggleAvailability);
router.post("/:itemId/photo",       protect, authorize("merchant"), upload.single("photo"), ctrl.uploadPhoto);

module.exports = router;
