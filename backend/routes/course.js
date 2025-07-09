import express from "express";
import Course from "../models/course.js";
import CourseFacultyAssignment from "../models/courseFacultyAssignment.js";
import multer from "multer";
import { parse } from "csv-parse";
import fs from "fs";
import { requireRole, verifyToken } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Get all courses
router.get("/",verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get courses by semester
router.get("/semester/:semester",verifyToken, async (req, res) => {
  try {
    const courses = await Course.find({ semester: req.params.semester });
    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get course by id
router.get("/:id",verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update course
router.put("/:id",verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { name, code, semester } = req.body;
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { name, code, semester },
      { new: true }
    );
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete course
router.delete("/:id",verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    
    // Delete related assignments
    const deletedAssignments = await CourseFacultyAssignment.deleteMany({ course: String(course._id) });
    
    res.status(200).json({ 
      message: "Course deleted successfully",
      deletedAssignments: deletedAssignments.deletedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk delete courses by semester
router.delete("/semester/:semester",verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const courses = await Course.find({ semester: req.params.semester });
    const courseCodes = courses.map(course => String(course._id));
    
    // Delete related assignments for all courses in this semester
    const deletedAssignments = await CourseFacultyAssignment.deleteMany({ 
      course: { $in: courseCodes } 
    });
    
    const result = await Course.deleteMany({ semester: req.params.semester });
    
    res.status(200).json({ 
      message: `${result.deletedCount} courses deleted from semester ${req.params.semester}`,
      deletedAssignments: deletedAssignments.deletedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk upload courses from CSV
router.post("/upload-csv",verifyToken, requireRole("admin"), upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  const courses = [];
  const headers = ["code", "name", "semester"];
  
  // Helper function to delete file
  const deleteFile = () => {
    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log(`Deleted file: ${req.file.path}`);
      }
    } catch (err) {
      console.error(`Error deleting file ${req.file.path}:`, err);
    }
  };

  fs.createReadStream(req.file.path)
    .pipe(parse({ columns: true, trim: true }))
    .on("data", (row) => {
      const courseData = {};
      headers.forEach((header) => {
        if (row[header] !== undefined) {
          if (header === "code") {
            courseData[header] = String(row[header]);
          } else if (header === "semester") {
            courseData[header] = Number(row[header]);
          } else {
            courseData[header] = row[header];
          }
        }
      });
      courses.push(courseData);
    })
    .on("end", async () => {
      try {
        const created = await Course.insertMany(courses);
        deleteFile(); // Delete file on success
        res
          .status(201)
          .json({ message: "Courses uploaded", courses: created });
      } catch (err) {
        deleteFile(); // Delete file on database error
        console.error("Database error:", err);
        res.status(500).json({ error: err.message });
      }
    })
    .on("error", (err) => {
      deleteFile(); // Delete file on parse error
      console.error("CSV parse error:", err);
      res.status(500).json({ error: err.message });
    });
});

export default router;

    