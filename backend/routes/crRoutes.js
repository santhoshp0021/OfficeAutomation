const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const {
  getOrCreateCRReport,
  updateSelfAssessment,
  updateHODSection,
  finalizeReport,
  downloadReport,
  getAllReports,
  updateFull,
  downloadCRPDF,
  deleteReport,
} = require("../controllers/CRController");
const {
  verifyToken,
  requireRole,
  requireRoles,
} = require("../middleware/auth");
const CRReport = require("../models/CRReport");
const Faculty = require("../models/Faculty");

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

router.get("/", verifyToken, requireRoles("faculty", "admin", "hod"), getAllReports);
// Get or create CR report for a faculty (faculty or HOD)
router.get("/:facultyId", verifyToken, requireRole("faculty"), getOrCreateCRReport);

router.get(
  "/report/:reportId",
  verifyToken, requireRoles("faculty", "hod","admin"),
  async (req, res) => {
    try {
      const report = await CRReport.findById(req.params.reportId);
      if (!report) {
        return res.status(404).json({ message: "CR Report not found" });
      }
      // Fetch the faculty user to get the _id and email
      const facultyUser = await Faculty.findOne({ facultyId: report.faculty.facultyId });
      
      // Merge faculty user data with report faculty data
      if (facultyUser) {
        report.faculty = {
          ...report.faculty.toObject(),
          _id: facultyUser._id,
          userId: facultyUser._id,
          email: facultyUser.contactInfo?.email
        };
      }
      res.json(report);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// Update self-assessment (faculty only)
router.post(
  "/:reportId/self-assessment",
  verifyToken, requireRole("faculty"),
  updateSelfAssessment
);

router.patch("/:reportId/update-full", updateFull);

router.post(
  "/:reportId/self-assessment/attachments",
  verifyToken, requireRole("faculty"),
  upload.array("attachments"),
  async (req, res) => {
    try {
      const CRReport = require("../models/CRReport");
      const report = await CRReport.findById(req.params.reportId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      if (!report.selfAssessment) {
        report.selfAssessment = { attachments: [] };
      } else if (!Array.isArray(report.selfAssessment.attachments)) {
        report.selfAssessment.attachments = [];
      }

      // Safely append new attachments
      report.selfAssessment.attachments = [
        ...(report.selfAssessment.attachments || []),
        ...req.files.map((f) => ({
          filename: f.filename,
          url: `/uploads/${f.filename}`,
        })),
      ];

      await report.save();

      res.json({ selfAssessment: report.selfAssessment });
    } catch (err) {
      console.error("Self-assessment upload error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

// Update HOD section (HOD only)
router.post("/:reportId/hod-section", verifyToken, requireRole("hod"), updateHODSection);

// Finalize report (HOD only)
router.post("/:reportId/finalize", verifyToken, requireRole("hod"), finalizeReport);

// Download final report (faculty or HOD)
router.get("/:reportId/download", verifyToken, requireRoles("faculty", "hod","admin"), downloadCRPDF);

// List all CRs    HOD review (HOD only)
router.get("/pending/hod", verifyToken, requireRole("hod"), async (req, res) => {
  try {
    const CRReport = require("../models/CRReport");
    const reports = await CRReport.find({ status: "pending_hod_review" });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:reportId",verifyToken, requireRole("faculty"),deleteReport);
module.exports = router;
