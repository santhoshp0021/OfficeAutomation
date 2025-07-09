import express from "express";
import Grievance from "../models/grievance.js";
import Notification from "../models/notification.js";
import { requireRole, verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Submit grievance
router.post("/", verifyToken, requireRole("student"), async (req, res) => {
  try {
    const {
      student,
      faculty,
      course,
      batch,
      semester,
      category,
      subject,
      grievanceText,
    } = req.body;

    const grievance = new Grievance({
      student,
      faculty,
      course,
      batch,
      semester,
      category,
      subject,
      grievanceText,
    });

    await grievance.save();
    res.status(201).json({
      message: "Grievance submitted successfully",
      grievance,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all grievances (for admin)
router.get("/", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const grievances = await Grievance.find()
      .populate("student", "name id")
      .populate("faculty", "name designation")
      .populate("course", "name code")
      .sort({ createdAt: -1 });

    res.json(grievances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get grievances by student
router.get("/student/:studentId",verifyToken,requireRole("admin"),async (req, res) => {
    try {
      const { studentId } = req.params;
      const grievances = await Grievance.find({ student: studentId })
        .populate("faculty", "name designation")
        .populate("course", "name code")
        .sort({ createdAt: -1 });

      res.json(grievances);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get grievance by ID
router.get("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id)
      .populate("student", "name rollNumber")
      .populate("faculty", "name designation")
      .populate("course", "name code");

    if (!grievance) {
      return res.status(404).json({ error: "Grievance not found" });
    }

    res.json(grievance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update grievance status (admin only)
router.put("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const { id } = req.params;

    // For resolved or rejected, create notification and delete
    if (status === "Resolved" || status === "Rejected") {
      const grievance = await Grievance.findById(id);

      if (!grievance) {
        return res.status(404).json({ error: "Grievance not found" });
      }

      // Create a notification
      const notification = new Notification({
        student: grievance.student,
        grievanceId: grievance._id,
        message: `Your grievance regarding "${grievance.subject}" has been ${status}. Response: ${adminResponse}`,
      });
      await notification.save();

      // Delete the grievance
      await Grievance.findByIdAndDelete(id);

      return res.status(200).json({
        message: `Grievance has been ${status} and student notified. The grievance is now deleted.`,
      });
    }

    // For other status updates (like 'In Progress')
    const updatedGrievance = await Grievance.findByIdAndUpdate(
      id,
      { status, adminResponse },
      { new: true }
    )
      .populate("student", "name rollNumber email")
      .populate("faculty", "name designation")
      .populate("course", "name code");

    if (!updatedGrievance) {
      return res.status(404).json({ error: "Grievance not found" });
    }

    res.json({
      message: "Grievance updated successfully",
      grievance: updatedGrievance,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete grievance (admin only)
router.delete("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const grievance = await Grievance.findByIdAndDelete(req.params.id);

    if (!grievance) {
      return res.status(404).json({ error: "Grievance not found" });
    }

    res.json({ message: "Grievance deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get grievance statistics (for dashboard)
router.get("/stats/overview", verifyToken,requireRole("admin"),async (req, res) => {
    try {
      const totalGrievances = await Grievance.countDocuments();
      const pendingGrievances = await Grievance.countDocuments({
        status: "Pending",
      });
      const inProgressGrievances = await Grievance.countDocuments({
        status: "In Progress",
      });
      const resolvedGrievances = await Grievance.countDocuments({
        status: "Resolved",
      });
      const rejectedGrievances = await Grievance.countDocuments({
        status: "Rejected",
      });

      res.json({
        total: totalGrievances,
        pending: pendingGrievances,
        inProgress: inProgressGrievances,
        resolved: resolvedGrievances,
        rejected: rejectedGrievances,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
