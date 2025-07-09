import express from "express";
import Student from "../models/student.js";
import User from "../models/user.js";
import multer from "multer";
import { parse } from "csv-parse";
import fs from "fs";
import bcrypt from "bcrypt";
import { verifyToken, requireRole, requireRoles, allowSelfOrAdmin } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Protect all routes

// getSemester Function
function calculateSemester(joinYear) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-based month

  // Treat July of join year as semester 1
  const joinStart = new Date(joinYear, 6); // July = month 6 (0-based)
  const monthsElapsed =
    (now.getFullYear() - joinStart.getFullYear()) * 12 +
    (now.getMonth() - joinStart.getMonth());

  // Every 6 months = 1 semester
  const semester = Math.floor(monthsElapsed / 6) + 1;

  return semester; // cap at 8
}

// get all students
router.get("/", verifyToken, requireRole("admin"), async (req, res) => {
  // Only admin can view all students
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get student by id
router.get("/:id",verifyToken,requireRoles("student", "admin"),allowSelfOrAdmin(Student, 'id'),
  async (req, res) => {
    try {
      const student = await Student.findById(req.params.id);
      res.status(200).json(student);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// update student
router.put("/:id", verifyToken, requireRoles("admin", "student"), allowSelfOrAdmin(Student, 'id'), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      String(req.params.id),
      req.body,
      {
        new: true,
      }
    );
    res.status(200).json({ message: "Student updated", student });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

// delete student
router.delete("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    // also delete user
    await User.findOneAndDelete({ id: student.id, role: "student" });
    res.status(200).json({ message: "Student deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk delete students by semester
router.delete("/semester/:semester",verifyToken,requireRole("admin"),
  async (req, res) => {
    try {
      const studentsToDelete = await Student.find({
        current_semester: req.params.semester,
      }).select("id");
      const studentIdsToDelete = studentsToDelete.map((s) => s.id);

      // Delete students
      const result = await Student.deleteMany({
        current_semester: req.params.semester,
      });

      // Delete corresponding users
      if (studentIdsToDelete.length > 0) {
        await User.deleteMany({
          id: { $in: studentIdsToDelete },
          role: "student",
        });
      }

      res.status(200).json({
        message: `${result.deletedCount} students deleted from semester ${req.params.semester}`,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Bulk upload students from CSV
router.post("/upload-csv",verifyToken,requireRole("admin"),upload.single("file"),(req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const studentsToInsert = [];
    const allStudentIdsInCsv = [];

    const processFile = async () => {
      const parser = fs
        .createReadStream(req.file.path)
        .pipe(parse({ columns: true, trim: true }));

      parser.on("data", (row) => {
        // Only process the columns: id, name, batch, joined_year
        const idValue = row["id"];
        const studentData = {
          id: idValue !== undefined ? String(idValue) : undefined,
          name: row["name"] || undefined,
          batch: row["batch"] || undefined,
          joined_year: row["joined_year"] || undefined,
          current_semester: calculateSemester(Number(row["joined_year"])),
        };

        if (studentData.id) {
          allStudentIdsInCsv.push(studentData.id);
          studentsToInsert.push(studentData);
        }
      });

      parser.on("end", async () => {
        try {
          // Find existing students from the CSV in one query
          const existingStudents = await Student.find({
            id: { $in: allStudentIdsInCsv },
          }).select("id");

          const existingStudentIds = new Set(
            existingStudents.map((s) => String(s.id))
          );

          // Filter out students that already exist
          const newStudents = studentsToInsert.filter(
            (student) => !existingStudentIds.has(String(student.id))
          );

          if (newStudents.length > 0) {
            const createdStudents = await Student.insertMany(newStudents, {
              ordered: false,
            });

            // Now, create user accounts for these new students
            const studentUsers = await Promise.all(
              createdStudents.map(async (student) => {
                const firstName = student.name.split(" ")[0].toLowerCase();
                const lastFourOfId = student.id.slice(-4);
                const plainPassword = `${firstName}${lastFourOfId}`;
                const hashedPassword = await bcrypt.hash(plainPassword, 10);

                return {
                  id: student.id,
                  name: student.name,
                  role: "student",
                  password: hashedPassword,
                  studentRef: student._id,
                };
              })
            );

            await User.insertMany(studentUsers, { ordered: false });

            res.status(201).json({
              message: `${createdStudents.length} new students uploaded and user accounts created.`,
              students: createdStudents,
            });
          } else {
            res.status(200).json({
              message:
                "No new students to upload. All students in the CSV already exist.",
            });
          }
        } catch (err) {
          console.error("Database error:", err);
          res
            .status(500)
            .json({ error: "Failed to insert students into database." });
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

export default router;
