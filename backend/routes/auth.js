const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const User = require("../models/User");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const { protect } = require("../middleware/authMiddleware");

// Utility to calculate current semester
function calculateSemester(joinYear) {
  const now = new Date();
  const joinStart = new Date(joinYear, 6); // July
  const monthsElapsed =
    (now.getFullYear() - joinStart.getFullYear()) * 12 +
    (now.getMonth() - joinStart.getMonth());
  return Math.floor(monthsElapsed / 6) + 1;
}

// @route   POST /api/auth/login
router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt for:", email,password);
  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Signup to continue" });
  console.log("User found:", user);
  const isMatch = await bcrypt.compare(password, user.password);
  console.log("Password match:", isMatch);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  const userRole = user.role;
  const userId = user._id;

  let enrichedData = {
    userId,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  // Enrich based on role
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

  const token = jwt.sign(
    { id: userId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.status(200).json({
    message: "Login successful",
    user: enrichedData,
    token,
  });
}));

// @route   POST /api/auth/register
router.post("/register", asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    // student-specific
    year,
    facultyAdvisor,
    registerNo,
    // faculty-specific
    designation,
    department,
    dob,
    dateOfJoining,
    phone,
    gender,
    qualifications,
    scaleOfPay,
    presentPay,
    natureOfAppointment,
  } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "Email already exists" });
  }
  console.log(password);
  const id = email;

  const userData = {
    id,
    name,
    email,
    password,
    role,
  };

  // Handle Student registration
  if (role === "student") {
    if (!year || !registerNo || !facultyAdvisor) {
      return res
        .status(400)
        .json({ message: "All student fields are required" });
    }

    const existingStudent = await Student.findOne({ registerNo });
    if (existingStudent) {
      return res
        .status(400)
        .json({ message: "Student with this Register Number already exists" });
    }

    const advisor = await User.findOne({
      _id: facultyAdvisor,
      role: "faculty",
    });
    if (!advisor) {
      return res
        .status(400)
        .json({ message: "Invalid faculty advisor selected" });
    }

    const student = await Student.create({
      id:registerNo,
      name,
      registerNo,
      year,
      facultyAdvisor,
      joined_year: Number(year),
      year: (new Date().getFullYear())- year,
      batch: `${year}-${parseInt(year) + 4}`,
      current_semester: 1,
      isFeedbackGiven: false,
    });

    userData.registerNo = registerNo;
    userData.studentRef = student._id;
  }

  const user = new User(userData);
  await user.save();

  // Handle Faculty or HOD registration
  if (role === "faculty" || role === "hod") {
    await Faculty.create({
      _id: user._id,
      facultyId: "FAC" + user._id.toString().slice(-3),
      name,
      designation: designation || (role === "hod" ? "Head of Department" : "Assistant Professor"),
      contactInfo: {
        email,
        phone: phone || "",
      },
      areasOfExpertise: qualifications
        ? qualifications.split(",").map((q) => q.trim())
        : [],
      preferredCourses: [],
      allocatedCourse: "",
      courseHandled: [],
      classesHandled: [],
      freeHours: {},
      dob: dob ? new Date(dob) : new Date("1990-01-01"),
      dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : new Date(),
      department: department || "",
      gender: gender || "",
      scaleOfPay: scaleOfPay || "",
      presentPay: presentPay || "",
      natureOfAppointment: natureOfAppointment || "Temporary",
      profilePicUrl: "",
      isActive: true,
    });

    user.facultyRef = user._id;
    await user.save();
  }

  return res.status(201).json({ message: "User registered successfully" });
}));

// @route   GET /api/auth/me
router.get("/me", protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
}));

// @route   GET /api/auth/password-hint/:id/:role
router.get("/password-hint/:id/:role", asyncHandler(async (req, res) => {
  const { id, role } = req.params;

  if (role === "student") {
    const student = await Student.findOne({ id });
    if (student) {
      const firstName = student.name.split(" ")[0].toLowerCase();
      return res.status(200).json({
        hint: `Your password is your first name (e.g., '${firstName}') followed by the last 4 digits of your ID.`,
      });
    }
    return res.status(404).json({ error: "Student not found" });
  }

  if (role === "faculty") {
    const faculty = await Faculty.findOne({ id });
    if (faculty) {
      const namePrefix = faculty.name.substring(0, 4).toLowerCase();
      return res.status(200).json({
        hint: `Your password is the first 4 letters of your name (e.g., '${namePrefix}'), your ID, and '123'.`,
      });
    }
    return res.status(404).json({ error: "Faculty not found" });
  }

  if (role === "admin") {
    return res.status(200).json({ hint: "Admin password is predefined" });
  }

  return res.status(400).json({ error: "Invalid role" });
}));

module.exports = router;
