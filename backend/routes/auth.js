import express from "express";
import User from "../models/user.js";
import Student from "../models/student.js";
import Faculty from "../models/faculty.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

const router = express.Router();

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

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { id, password, role } = req.body;

    if (!id || !password || !role) {
      return res
        .status(400)
        .json({ error: "ID, password, and role are required" });
    }

    const user = await User.findOne({ id, role });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Fetch additional information based on role
    let additionalInfo = {};

    if (role === "student") {
      const studentInfo = await Student.findById(user.studentRef);
      if (studentInfo) {
        // Calculate current semester
        const calculatedSemester = calculateSemester(
          studentInfo.joined_year || Number(studentInfo.name.slice(0, 4))
        );

        // Check if calculated semester differs from stored semester
        if (calculatedSemester !== studentInfo.current_semester) {
          // Update the student's semester and reset feedback status
          await Student.findByIdAndUpdate(user.studentRef, {
            current_semester: calculatedSemester,
            isFeedbackGiven: false,
          });

          // Update the studentInfo object for response
          studentInfo.current_semester = calculatedSemester;
          studentInfo.isFeedbackGiven = false;
        }

        additionalInfo = {
          batch: studentInfo.batch,
          current_semester: studentInfo.current_semester,
          joined_year: studentInfo.joined_year,
          isFeedbackGiven: studentInfo.isFeedbackGiven,
        };
      }
    } else if (role === "faculty") {
      const facultyInfo = await Faculty.findById(user.facultyRef);
      if (facultyInfo) {
        additionalInfo = {
          designation: facultyInfo.designation,
        };
      }
    }

    // Return user info without password, including additional role-specific data
    const { password: _, ...userInfo } = user.toObject();
    const responseData = {
      ...userInfo,
      ...additionalInfo,
    };

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: "Login successful",
      user: responseData,
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get password hint for a user
router.get("/password-hint/:id/:role", async (req, res) => {
  try {
    const { id, role } = req.params;

    if (role === "student") {
      const student = await Student.findOne({ id });
      if (student) {
        const firstName = student.name.split(" ")[0].toLowerCase();
        res.status(200).json({
          hint: `Your password is your first name (e.g., '${firstName}') followed by the last 4 digits of your ID.`,
        });
      } else {
        res.status(404).json({ error: "Student not found" });
      }
    } else if (role === "faculty") {
      const faculty = await Faculty.findOne({ id });
      if (faculty) {
        const namePrefix = faculty.name.substring(0, 4).toLowerCase();
        res.status(200).json({
          hint: `Your password is the first 4 letters of your name (e.g., '${namePrefix}'), your ID, and '123'.`,
        });
      } else {
        res.status(404).json({ error: "Faculty not found" });
      }
    } else if (role === "admin") {
      res.status(200).json({ hint: "Admin password is predefined" });
    } else {
      res.status(400).json({ error: "Invalid role" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
