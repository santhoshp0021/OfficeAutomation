import express from "express";
import Faculty from "../models/faculty.js";
import User from "../models/user.js";
import CourseFacultyAssignment from "../models/courseFacultyAssignment.js";
import ElectiveCourseFacultyAssignment from "../models/electiveCourseFacultyAssignment.js";
import multer from "multer";
import { parse } from "csv-parse";
import fs from "fs";
import Feedback from "../models/feedback.js";
import bcrypt from "bcrypt";
import { verifyToken, requireRole, requireRoles, allowSelfOrAdmin } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Get all faculties
router.get("/", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const faculties = await Faculty.find();
    res.status(200).json(faculties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get faculty by id
router.get("/:id",verifyToken,requireRoles("faculty", "admin"),allowSelfOrAdmin(Faculty, 'id'),
  async (req, res) => {
    try {
      const faculty = await Faculty.findById(req.params.id);
      res.status(200).json(faculty);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Update faculty
router.put("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { name, designation } = req.body;
    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      { name, designation },
      { new: true }
    );
    if (!faculty) {
      return res.status(404).json({ error: "Faculty not found" });
    }

    // Also update the user's name if it has changed
    await User.findOneAndUpdate(
      { id: faculty.id, role: "faculty" },
      { name: faculty.name }
    );

    res.status(200).json(faculty);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete faculty
router.delete("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const facultyId = req.params.id;
    const faculty = await Faculty.findById(facultyId);

    if (!faculty) {
      return res.status(404).json({ error: "Faculty not found" });
    }

    // Delete User account
    await User.findOneAndDelete({ id: faculty.id, role: "faculty" });

    // Delete Feedback
    await Feedback.deleteMany({ faculty: facultyId });

    // Delete Course Assignments
    await CourseFacultyAssignment.deleteMany({ faculty: facultyId });

    // Delete Elective Course Assignments
    await ElectiveCourseFacultyAssignment.deleteMany({ faculty: facultyId });

    // Finally, delete the faculty
    await Faculty.findByIdAndDelete(facultyId);

    res.status(200).json({
      message: "Faculty and all associated data deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk upload faculties from CSV
router.post("/upload-csv",verifyToken,requireRole("admin"),upload.single("file"),(req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const facultiesToInsert = [];
    const allFacultyIdsInCsv = [];

    const processFile = async () => {
      const parser = fs
        .createReadStream(req.file.path)
        .pipe(parse({ columns: true, trim: true }));

      parser.on("data", (row) => {
        // Map frontend headers to backend schema fields
        const facultyData = {
          id: row["Faculty_ID"] || row["id"],
          name: row["Faculty_Name"] || row["name"],
          email: row["Email"] || row["email"],
          designation: row["Designation"] || row["designation"],
        };

        if (facultyData.id) {
          allFacultyIdsInCsv.push(facultyData.id);
          facultiesToInsert.push(facultyData);
        }
      });

      parser.on("end", async () => {
        try {
          // Find existing faculties from the CSV in one query
          const existingFaculties = await Faculty.find({
            id: { $in: allFacultyIdsInCsv },
          }).select("id");

          const existingFacultyIds = new Set(
            existingFaculties.map((f) => f.id)
          );

          // Filter out faculties that already exist
          const newFaculties = facultiesToInsert.filter(
            (faculty) => !existingFacultyIds.has(faculty.id)
          );

          if (newFaculties.length > 0) {
            const createdFaculties = await Faculty.insertMany(newFaculties, {
              ordered: false,
            });

            // Now, create user accounts for these new faculties
            const facultyUsers = await Promise.all(
              createdFaculties.map(async (faculty) => {
                const plainPassword = `${faculty.name
                  .substring(0, 4)
                  .toLowerCase()}${faculty.id}123`;
                const hashedPassword = await bcrypt.hash(plainPassword, 10);

                return {
                  id: faculty.id,
                  name: faculty.name,
                  role: "faculty",
                  password: hashedPassword,
                  facultyRef: faculty._id,
                };
              })
            );

            await User.insertMany(facultyUsers, { ordered: false });

            res.status(201).json({
              message: `${createdFaculties.length} new faculties uploaded and user accounts created.`,
              faculties: createdFaculties,
            });
          } else {
            res.status(200).json({
              message:
                "No new faculties to upload. All faculties in the CSV already exist.",
            });
          }
        } catch (err) {
          console.error("Database error:", err);
          res
            .status(500)
            .json({ error: "Failed to insert faculties into database." });
        } finally {
          // Clean up the uploaded file
          fs.unlinkSync(req.file.path);
        }
      });

      parser.on("error", (err) => {
        console.error("CSV parse error:", err);
        fs.unlinkSync(req.file.path);
        res.status(500).json({ error: "Error parsing CSV file." });
      });
    };

    processFile();
  }
);

// Get faculty performance (self-view)
router.get("/:id/performance",verifyToken,requireRoles("admin", "faculty"),async (req, res) => {
    try {
      const facultyId = String(req.params.id);
      const faculty = await Faculty.findById(facultyId);
      if (!faculty) {
        return res.status(404).json({ error: "Faculty not found" });
      }

      // Get average score
      const feedbacks = await Feedback.find({ faculty: facultyId });
      let avgScore = 0;
      if (feedbacks.length > 0) {
        avgScore =
          feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length;
      }

      // Get average ratings for each question
      let questionRatings = [];
      let questionTexts = [];
      if (feedbacks.length > 0) {
        const questionCount = feedbacks[0].questionRating.length;
        for (let i = 0; i < questionCount; i++) {
          const totalRating = feedbacks.reduce((sum, feedback) => {
            return sum + (feedback.questionRating[i]?.rating || 0);
          }, 0);
          questionRatings[i] = totalRating / feedbacks.length;
        }
        questionTexts = feedbacks[0].questionRating.map((q) => q.question);
      }

      // Get courses taken
      const assignments = await CourseFacultyAssignment.find({
        faculty: facultyId,
      }).populate("course", "name code");
      const courses = assignments.map((a) => ({
        name: a.course?.name,
        code: a.course?.code,
        semester: a.semester,
        batch: a.batch,
      }));

      // Yearly performance
      const yearlyData = {};
      feedbacks.forEach((feedback) => {
        const year = new Date(feedback.createdAt).getFullYear();
        if (!yearlyData[year]) yearlyData[year] = [];
        yearlyData[year].push(feedback.score);
      });
      const yearlyPerformance = {};
      Object.keys(yearlyData).forEach((year) => {
        const scores = yearlyData[year];
        const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        yearlyPerformance[year] = Math.round(avg * 100) / 100;
      });

      res.json({
        faculty: {
          id: faculty.id,
          name: faculty.name,
          designation: faculty.designation,
        },
        avgScore,
        questionRatings,
        questionTexts,
        courses,
        yearlyPerformance,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  }
);

// Get faculty performance (self-view) along with their course and Batch
router.get("/:id/performance/course/:courseId/batch/:batch", verifyToken,requireRoles("admin", "faculty"),async (req, res) => {
    if(req.user.id)
    try {
      const facultyId = String(req.params.id);
      const courseId = String(req.params.courseId);
      const faculty = await Faculty.findById(facultyId);
      if (!faculty) {
        return res.status(404).json({ error: "Faculty not found" });
      }

      // Get average score
      const feedbacks = await Feedback.find({
        faculty: facultyId,
        course: courseId,
        batch: req.params.batch,
      });
      let avgScore = 0;
      if (feedbacks.length > 0) {
        avgScore =
          feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length;
      }

      // Get average ratings for each question
      let questionRatings = [];
      let questionTexts = [];
      if (feedbacks.length > 0) {
        const questionCount = feedbacks[0].questionRating.length;
        for (let i = 0; i < questionCount; i++) {
          const totalRating = feedbacks.reduce((sum, feedback) => {
            return sum + (feedback.questionRating[i]?.rating || 0);
          }, 0);
          questionRatings[i] = totalRating / feedbacks.length;
        }
        questionTexts = feedbacks[0].questionRating.map((q) => q.question);
      }

      res.json({
        faculty: {
          id: faculty.id,
          name: faculty.name,
          designation: faculty.designation,
        },
        avgScore,
        questionRatings,
        questionTexts,
        totalFeedbacks: feedbacks.length,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
