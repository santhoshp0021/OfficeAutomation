const express = require("express");
const router = express.Router();
const {
  addPGScholar,
  getAllPGScholars,
  updatePGScholar,
  deletePGScholar,
} = require("../controllers/pgScholarController");
const {
  verifyToken,
  requireRole,
  requireRoles,
} = require("../middleware/auth");

// Route: /api/pgscholars
router.post("/", verifyToken, requireRole("faculty"), addPGScholar);
router.get(
  "/",
  verifyToken,
  requireRoles("faculty", "hod", "admin"),
  getAllPGScholars
);
router.put("/:id", verifyToken, requireRole("faculty"), updatePGScholar);
router.delete("/:id", verifyToken, requireRole("faculty"), deletePGScholar);

module.exports = router;
