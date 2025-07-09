import express from "express";
import Notification from "../models/notification.js";
import { requireRole, verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Get notifications for a student
router.get("/student/:studentId",verifyToken,requireRole("student"),async (req, res) => {
    try {
      const notifications = await Notification.find({
        student: req.params.studentId,
      }).sort({ createdAt: -1 });
      res.status(200).json(notifications);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Mark a notification as read
router.put("/:id/read",verifyToken,requireRole("student"),async (req, res) => {
    try {
      const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        { isRead: true },
        { new: true }
      );
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.status(200).json(notification);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Mark all notifications as read for a student
router.put("/student/:studentId/read-all",verifyToken,requireRole("student"),async (req, res) => {
    try {
      await Notification.updateMany(
        { student: req.params.studentId, isRead: false },
        { isRead: true }
      );
      res.status(200).json({ message: "All notifications marked as read" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Delete a notification
router.delete("/:id", verifyToken, requireRole("student"), async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
