const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  createRequest,
  addDocs,
  updateStatus,
  getAllRequests,
  getUserRequests,
  getUserRequestsByEmail,
  updateODDetails,
  generateODLetter
} = require("../controllers/FacultyODController");
const {
  verifyToken,
  requireRole,
  requireRoles,
} = require("../middleware/auth");
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// POST /api/odrequests (with files)
router.post(
  "/",
  upload.array("documents"),
  verifyToken, requireRole("faculty"),
  createRequest
);

// PUT /api/odrequests/:id/docs
router.put(
  "/:id/docs",
  upload.array("documents"),
  verifyToken, requireRole("faculty"),
  addDocs
);
router.put("/update-details/:id", updateODDetails);

router.put("/:id/:status", verifyToken, requireRoles("hod", "admin"), updateStatus);
router.get("/", verifyToken, requireRoles("hod", "admin"), getAllRequests);
router.get("/user/:userId", verifyToken, requireRoles("faculty"), getUserRequests);
router.get("/user/email/:email", verifyToken, requireRoles("faculty", "hod", "admin"), getUserRequestsByEmail);

router.get("/:id/generate-letter", verifyToken, requireRoles("faculty", "hod", "admin"), generateODLetter);

module.exports = router;
