const router = require("express").Router();
const ctrl   = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");
const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB

router.use(protect);
router.get("/me",        ctrl.getMe);
router.put("/me",        ctrl.updateMe);
router.post("/me/photo", upload.single("photo"), ctrl.uploadPhoto);

module.exports = router;
