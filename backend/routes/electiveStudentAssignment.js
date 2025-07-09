import express from "express";
import ElectiveStudentAssignment from "../models/electiveStudentAssignment.js";
import ElectiveCourse from "../models/electiveCourse.js";
import multer from "multer";
import { parse } from "csv-parse";
import fs from "fs";
import Student from "../models/student.js";
import { requireRole, requireRoles, verifyToken } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// GET /: Get all elective assignments with student and course details
router.get("/", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const assignments = await ElectiveStudentAssignment.find().populate(
      "electives.electiveCourse"
    );

    const results = [];
    for (const assignment of assignments) {
      const student = await Student.findOne({ id: assignment.s_id });
      if (student) {
        for (const elective of assignment.electives) {
          results.push({
            _id: `${student.id}-${elective.electiveCourse._id}`,
            electiveCourse: elective.electiveCourse,
            student: {
              _id: student._id,
              name: student.name,
              registerNumber: student.id,
              batch: elective.batch,
            },
          });
        }
      }
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /upload-csv: Assign students to an elective course via CSV
// Expects: multipart/form-data with 'file' (CSV) and 'electiveCourseId' (string)
router.post(
  "/upload-csv",
  upload.single("file"),
  verifyToken,
  requireRole("admin"),
  async (req, res) => {
    const electiveCourseId = req.body.electiveCourseId;
    if (!req.file || !electiveCourseId) {
      return res
        .status(400)
        .json({ error: "File and electiveCourseId are required" });
    }

    // Check if elective course exists
    const electiveCourse = await ElectiveCourse.findById(electiveCourseId);
    if (!electiveCourse) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Elective course not found" });
    }

    const assignments = [];
    fs.createReadStream(req.file.path)
      .pipe(parse({ columns: true, trim: true }))
      .on("data", (row) => {
        if (
          row.s_id &&
          row.batch &&
          Number(row.batch) >= 1 &&
          Number(row.batch) <= 5
        ) {
          assignments.push({
            s_id: String(row.s_id),
            batch: Number(row.batch),
          });
        }
      })
      .on("end", async () => {
        try {
          let successCount = 0;
          for (const { s_id, batch } of assignments) {
            await ElectiveStudentAssignment.findOneAndUpdate(
              { s_id },
              {
                $addToSet: {
                  electives: {
                    electiveCourse: electiveCourseId,
                    batch,
                  },
                },
              },
              { upsert: true, new: true }
            );
            successCount++;
          }
          fs.unlinkSync(req.file.path);
          res.status(201).json({
            message: "Student-elective assignments uploaded",
            count: successCount,
          });
        } catch (err) {
          fs.unlinkSync(req.file.path);
          res.status(500).json({ error: err.message });
        }
      })
      .on("error", (err) => {
        fs.unlinkSync(req.file.path);
        res.status(500).json({ error: err.message });
      });
  }
);

// PATCH: Update a student's elective assignment (batch or course)
router.patch(
  "/:studentId/:electiveCourseId",
  verifyToken,
  requireRole("admin"),
  async (req, res) => {
    const { studentId, electiveCourseId } = req.params;
    const { batch, newElectiveCourseId } = req.body;
    try {
      // Find the assignment
      const assignment = await ElectiveStudentAssignment.findOne({
        s_id: studentId,
      });
      if (!assignment)
        return res.status(404).json({ message: "Assignment not found" });
      const elective = assignment.electives.find(
        (e) => e.electiveCourse.toString() === electiveCourseId
      );
      if (!elective)
        return res
          .status(404)
          .json({ message: "Elective not found for this student" });
      // Update fields
      if (batch) elective.batch = batch;
      if (newElectiveCourseId) elective.electiveCourse = newElectiveCourseId;
      await assignment.save();
      res.json({ message: "Assignment updated" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// DELETE: Remove a student's elective assignment
router.delete(
  "/:studentId/:electiveCourseId",
  verifyToken,
  requireRole("admin"),
  async (req, res) => {
    const { studentId, electiveCourseId } = req.params;
    try {
      const assignment = await ElectiveStudentAssignment.findOne({
        s_id: studentId,
      });
      if (!assignment)
        return res.status(404).json({ message: "Assignment not found" });
      const initialLength = assignment.electives.length;
      assignment.electives = assignment.electives.filter(
        (e) => e.electiveCourse.toString() !== electiveCourseId
      );
      if (assignment.electives.length === initialLength) {
        return res
          .status(404)
          .json({ message: "Elective not found for this student" });
      }
      await assignment.save();
      res.json({ message: "Assignment deleted" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET elective courses for a particular student
router.get(
  "/student/:id",
  verifyToken,
  requireRoles("student", "admin"),
  async (req, res) => {
    const electiveCourses = await ElectiveStudentAssignment.find(
      {
        s_id: req.params.id,
      },
      { electives: 1 }
    ).populate("electives.electiveCourse");
    if (!electiveCourses)
      return res
        .status(404)
        .json({ error: "No Elective Courses found for the given student id" });

    return res.status(200).json(electiveCourses);
  }
);

export default router;
