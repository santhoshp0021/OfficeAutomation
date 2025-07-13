const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { errorHandler } = require("./middleware/errorMiddleware");
const mongoose = require("mongoose");

dotenv.config();
console.log("JWT_SECRET loaded:", process.env.JWT_SECRET ? "Yes" : "No");

connectDB();
const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root
app.get("/", (req, res) => {
  res.send("Faculty Portal Backend Running");
});

// Route imports (from both files)
const facultyRoutes = require("./routes/facultyRoutes");
const pgScholarRoutes = require("./routes/pgScholarRoutes");
const publicationRoutes = require("./routes/publicationRoutes");
const authRoutes = require("./routes/authRoutes");
const odRoutes = require("./routes/FacultyODRoutes");
const crReportRoutes = require("./routes/crRoutes");
const studentRoutes = require("./routes/student");
const facultyNewRoutes = require("./routes/faculty"); // renamed to avoid duplicate
const courseRoutes = require("./routes/course");
const courseFacultyAssignmentRoutes = require("./routes/courseFacultyAssignment");
const authNewRoutes = require("./routes/auth"); // same as previous
const feedbackRoutes = require("./routes/feedback");
const grievanceRoutes = require("./routes/grievance");
const notificationRoutes = require("./routes/notification");
const electiveCourseRoutes = require("./routes/electiveCourse");
const electiveStudentAssignmentRoutes = require("./routes/electiveStudentAssignment");
const electiveCourseFacultyAssignmentRoutes = require("./routes/electiveCourseFacultyAssignment");

const usersRoutes = require("./routes/users");
const odRequestRoutes = require("./routes/odRequests");
const adminRoutes = require("./routes/admin");
const settingsRoutes = require("./routes/settings");

// API Routes
app.use("/api/faculty", facultyRoutes);
app.use("/api/pgscholars", pgScholarRoutes);
app.use("/api/publications", publicationRoutes);
// app.use("/api/auth", authRoutes); // redundant with next line
app.use("/api/auth", authNewRoutes);
app.use("/api/odrequests", odRoutes);
app.use("/api/od-requests", odRequestRoutes); // From second file
app.use("/api/crreport", crReportRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/faculties", facultyNewRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/assignments", courseFacultyAssignmentRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/grievances", grievanceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/electives", electiveCourseRoutes);
app.use("/api/elective-student-assignments", electiveStudentAssignmentRoutes);
app.use("/api/electiveCourseFacultyAssignment", electiveCourseFacultyAssignmentRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/settings", settingsRoutes);

// Static file serving
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, path) => {
      // CORS + MIME types
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Cross-Origin-Resource-Policy", "cross-origin");

      if (path.endsWith(".pdf")) {
        res.setHeader("Content-Type", "application/pdf");
      }
      if (path.endsWith(".docx")) {
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      }
    },
  })
);

app.use("/static", express.static(path.join(__dirname, "assets")));

// Optional: Create default admin user
// const createAdminUser = async () => {
//   try {
//     const existingAdmin = await User.findOne({ role: 'admin' });
//     if (!existingAdmin) {
//       const hashedPassword = await bcrypt.hash('admin123', 10);
//       const adminUser = new User({
//         id: 'admin',
//         name: 'Administrator',
//         role: 'admin',
//         password: hashedPassword,
//       });
//       await adminUser.save();
//       console.log('Admin user created successfully.');
//     }
//   } catch (error) {
//     console.error('Error creating admin user:', error);
//   }
// };

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
