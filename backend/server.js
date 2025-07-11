const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const PORT = process.env.PORT || 5000;
const path=require("path")

const facultyRoutes = require("./routes/facultyRoutes");
const pgScholarRoutes = require("./routes/pgScholarRoutes");
const publicationRoutes = require("./routes/publicationRoutes");
const authRoutes = require("./routes/authRoutes");
const odRoutes = require("./routes/ODRoutes");
const crReportRoutes = require("./routes/crRoutes");

const studentRoutes = require("./routes/student");
const facultyNewRoutes = require("./routes/faculty"); // renamed to avoid duplicate
const courseRoutes = require("./routes/course");
const courseFacultyAssignmentRoutes = require("./routes/courseFacultyAssignment");
const authNewRoutes = require("./routes/auth"); // renamed to avoid duplicate
const feedbackRoutes = require("./routes/feedback");
const grievanceRoutes = require("./routes/grievance");
const notificationRoutes = require("./routes/notification");
const electiveCourseRoutes = require("./routes/electiveCourse");
const electiveStudentAssignmentRoutes = require("./routes/electiveStudentAssignment");
const electiveCourseFacultyAssignmentRoutes = require("./routes/electiveCourseFacultyAssignment");

dotenv.config();
connectDB();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.send("Faculty Portal Backend Running");
});
// Temporary middleware to simulate login
// app.use((req, res, next) => {
//   req.user = {
//     _id: '6845c010f4d7457e793dfd3d', // faculty
//     role: 'faculty',
//     // _id: "6845bcc003d9421f7b3a4cd0", // admin
//     // role: "admin",
//     // _id: "6845c02cf4d7457e793dfd41", // hod
//     // role: "hod",
//   };
//   next();
// });

app.use("/api/faculty", facultyRoutes);
app.use("/api/pgscholars", pgScholarRoutes);
app.use("/api/publications", publicationRoutes);
// app.use("/api/auth", authRoutes);
app.use("/uploads", express.static("uploads", {
  setHeaders: (res, path) => {
    if (path.endsWith(".pdf")) {
      res.setHeader("Content-Type", "application/pdf");
    }
    if (path.endsWith(".docx")) {
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    }
  },
}));
app.use('/static', express.static(path.join(__dirname, 'assets')))
app.use("/api/odrequests", odRoutes);
app.use("/api/crreport", crReportRoutes);

const createAdminUser = async () => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = new User({
        id: 'admin',
        name: 'Administrator',
        role: 'admin',
        password: hashedPassword,
      });
      await adminUser.save();
      console.log('Admin user created successfully.');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};
app.use("/api/students", studentRoutes);
app.use("/api/faculties", facultyNewRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/assignments", courseFacultyAssignmentRoutes);
app.use("/api/auth", authNewRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/grievances", grievanceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/electives", electiveCourseRoutes);
app.use('/api/elective-student-assignments', electiveStudentAssignmentRoutes);
app.use('/api/electiveCourseFacultyAssignment', electiveCourseFacultyAssignmentRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
