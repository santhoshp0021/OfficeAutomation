import express from "express";
import ElectiveCourseFacultyAssignment from "../models/electiveCourseFacultyAssignment.js";
import ElectiveCourse from "../models/electiveCourse.js";
import Faculty from "../models/faculty.js";
import { requireRole, requireRoles, verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Get all assignments
router.get("/",verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const assignments = await ElectiveCourseFacultyAssignment.find()
      .populate("electiveCourse")
      .populate("faculty");
    res.status(200).json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get elective assignments by faculty
router.get("/faculty/:facultyId",verifyToken, requireRoles("faculty", "admin"), async (req, res) => {
  const facultyId = String(req.params.facultyId);
  // console.log(facultyId);
  try {
    const electiveAssignments = await ElectiveCourseFacultyAssignment.find({
      faculty: facultyId,
    })
      .populate("faculty")
      .populate("electiveCourse");

    return res.status(200).json(electiveAssignments);
  } catch (err) {
    console.log(err);
  }
});

// Assign faculty to elective course and batch
router.post("/assign",verifyToken, requireRole("admin"), async (req, res) => {
  const { electiveCourse, faculty, batch } = req.body;
  if (!electiveCourse || !faculty || !batch) {
    return res.status(400).json({ error: "All fields are required" });
  }
  try {
    // Prevent duplicate assignment for same electiveCourse, faculty, and batch
    const existing = await ElectiveCourseFacultyAssignment.findOne({
      electiveCourse,
      faculty,
      batch,
    });
    if (existing) {
      return res.status(400).json({ error: "Assignment already exists" });
    }
    const assignment = new ElectiveCourseFacultyAssignment({
      electiveCourse,
      faculty,
      batch,
    });
    await assignment.save();
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete assignment
router.delete("/:id",verifyToken, requireRole("admin"), async (req, res) => {
  try {
    await ElectiveCourseFacultyAssignment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Assignment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get faculties assigned to elective courses by batch
router.get("/electiveCourse/:electiveId/batch/:batch",verifyToken, async (req, res) => {
  const electiveId = String(req.params.electiveId);
  const batch = Number(req.params.batch);
  const faculty = await ElectiveCourseFacultyAssignment.find({
    electiveCourse: electiveId,
    batch: batch,
  }).populate("faculty");
  if (!faculty)
    return res.status(404).json({
      error: "Faculty Not Assigned for give elective course and batch",
    });

  return res.status(200).json(faculty);
});

export default router;
