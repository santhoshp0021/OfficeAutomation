const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Student = require("../models/student");
const Faculty = require("../models/Faculty");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { register } = require("../controllers/authController");

router.post("/register", register);
// Utility to calculate current semester
function calculateSemester(joinYear) {
  const now = new Date();
  const joinStart = new Date(joinYear, 6); // July
  const monthsElapsed =
    (now.getFullYear() - joinStart.getFullYear()) * 12 +
    (now.getMonth() - joinStart.getMonth());
  return Math.floor(monthsElapsed / 6) + 1;
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // 2. Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const userRole = user.role;
    const userId = user._id;

    let enrichedData = {
      userId,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // 3. Role-specific logic
    if (userRole === "student") {
      const student = await Student.findById(user.studentRef);
      if (student) {
        const calculatedSemester = calculateSemester(
          student.joined_year || Number(student.name.slice(0, 4))
        );

        if (student.current_semester !== calculatedSemester) {
          await Student.findByIdAndUpdate(student._id, {
            current_semester: calculatedSemester,
            isFeedbackGiven: false,
          });

          student.current_semester = calculatedSemester;
          student.isFeedbackGiven = false;
        }

        enrichedData = {
          ...enrichedData,
          studentId: student._id,
          batch: student.batch,
          current_semester: student.current_semester,
          joined_year: student.joined_year,
          isFeedbackGiven: student.isFeedbackGiven,
        };
      }
    } else if (userRole === "faculty" || userRole === "hod") {
      const faculty = await Faculty.findById(user.facultyRef || user._id);
      if (faculty) {
        enrichedData = {
          ...enrichedData,
          facultyId: faculty.facultyId,
          designation: faculty.designation,
          department: faculty.department,
          facultyProfile: faculty,
        };
      }
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { id: userId, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // 5. Respond with token + user data
    res.status(200).json({
      message: "Login successful",
      user: enrichedData,
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
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

module.exports = router;
