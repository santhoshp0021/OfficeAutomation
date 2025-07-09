import express from "express";
import CourseFacultyAssignment from "../models/courseFacultyAssignment.js";
import { requireRole, requireRoles, verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Get all assignments
router.get("/", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const assignments = await CourseFacultyAssignment.find()
      .populate("course", "name code semester")
      .populate("faculty", "name designation");
    res.status(200).json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get assignments by semester and batch
router.get(
  "/semester/:semester/batch/:batch",
  verifyToken,
  async (req, res) => {
    try {
      const semester = Number(req.params.semester);
      const batch = req.params.batch;

      // Validate semester
      if (isNaN(semester) || semester < 1 || semester > 8) {
        return res
          .status(400)
          .json({ error: "Invalid semester. Must be 1-8." });
      }

      console.log(
        `Fetching assignments for semester: ${semester}, batch: ${batch}`
      );

      const assignments = await CourseFacultyAssignment.find({
        semester: semester,
        batch: batch,
      })
        .populate("course", "name code semester")
        .populate("faculty", "name designation");

      console.log(`Found ${assignments.length} assignments`);
      res.status(200).json(assignments);
    } catch (err) {
      console.error("Error in semester/batch route:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// Assign faculty to course for a semester and batch
router.post("/assign", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { course, faculty, semester, batch } = req.body;
    if (!course || !faculty || !semester || !batch) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const existingAssignment = await CourseFacultyAssignment.findOne({
      course: String(course),
      faculty: String(faculty),
      semester: Number(semester),
      batch: String(batch),
    });
    if (existingAssignment) {
      return res
        .status(400)
        .json({ error: "Faculty already assigned to this course" });
    }
    const assignment = new CourseFacultyAssignment({
      course: String(course),
      faculty: String(faculty),
      semester: Number(semester),
      batch: String(batch),
    });
    await assignment.save();
    res.status(201).json({ message: "Faculty assigned to course", assignment });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

// Update assignment
router.put("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { course, faculty, semester, batch } = req.body;

    if (!course || !faculty || !semester || !batch) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if the new assignment already exists (excluding current assignment)
    const existingAssignment = await CourseFacultyAssignment.findOne({
      course: String(course),
      faculty: String(faculty),
      semester: Number(semester),
      batch: String(batch),
      _id: { $ne: req.params.id },
    });

    if (existingAssignment) {
      return res.status(400).json({
        error:
          "Faculty already assigned to this course for this semester and batch",
      });
    }

    const assignment = await CourseFacultyAssignment.findByIdAndUpdate(
      req.params.id,
      {
        course: String(course),
        faculty: String(faculty),
        semester: Number(semester),
        batch: String(batch),
      },
      { new: true }
    )
      .populate("course", "name code semester")
      .populate("faculty", "name designation");

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res
      .status(200)
      .json({ message: "Assignment updated successfully", assignment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete assignment
router.delete("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const assignment = await CourseFacultyAssignment.findByIdAndDelete(
      req.params.id
    );

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.status(200).json({ message: "Assignment deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete assignments by course (for cascading delete)
router.delete("/course/:courseId",verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const result = await CourseFacultyAssignment.deleteMany({
      course: req.params.courseId,
    });
    res.status(200).json({
      message: `${result.deletedCount} assignments deleted for course ${req.params.courseId}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete assignments by faculty (for cascading delete)
router.delete("/faculty/:facultyId",verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const result = await CourseFacultyAssignment.deleteMany({
      faculty: req.params.facultyId,
    });
    res.status(200).json({
      message: `${result.deletedCount} assignments deleted for faculty ${req.params.facultyId}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get assignments by faculty
router.get("/faculty/:facultyId",verifyToken, async (req, res) => {
  try {
    const { facultyId } = req.params;
    const removeDup = req.query.removedup === "true";

    let assignments = await CourseFacultyAssignment.find({
      faculty: facultyId,
    })
      .populate("course", "name code semester")
      .populate("faculty", "name designation")
      .sort({ semester: 1, batch: 1 });

    if (removeDup) {
      const courseBatches = [];
      for (const assignment of assignments) {
        const courses = await CourseFacultyAssignment.find({
          faculty: facultyId,
          course: assignment.course._id,
        })
          .populate("course", "name code semester")
          .sort({ semester: 1, batch: 1 });

        if (!courses.length) continue;

        // Check if this course is already in courseBatches
        let existing = courseBatches.find(
          (cb) => cb.course._id.toString() === courses[0].course._id.toString()
        );
        if (!existing) {
          courseBatches.push({
            course: courses[0].course,
            batches: courses.map((c) => c.batch),
          });
        }
      }
      console.log(courseBatches);
      return res.status(200).json(courseBatches);
    }

    res.status(200).json(assignments);
  } catch (err) {
    console.error("Error getting faculty assignments:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
