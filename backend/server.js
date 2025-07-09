import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import studentRoutes from "./routes/student.js";
import facultyRoutes from "./routes/faculty.js";
import courseRoutes from "./routes/course.js";
import courseFacultyAssignmentRoutes from "./routes/courseFacultyAssignment.js";
import authRoutes from "./routes/auth.js";
import feedbackRoutes from "./routes/feedback.js";
import grievanceRoutes from "./routes/grievance.js";
import notificationRoutes from "./routes/notification.js";
import electiveCourseRoutes from "./routes/electiveCourse.js";
import electiveStudentAssignmentRoutes from './routes/electiveStudentAssignment.js';
import electiveCourseFacultyAssignmentRoutes from './routes/electiveCourseFacultyAssignment.js';
import cors from "cors";
import User from './models/user.js';
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

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

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    createAdminUser();
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB", err);
  });

app.use("/api/students", studentRoutes);
app.use("/api/faculties", facultyRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/assignments", courseFacultyAssignmentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/grievances", grievanceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/electives", electiveCourseRoutes);
app.use('/api/elective-student-assignments', electiveStudentAssignmentRoutes);
app.use('/api/electiveCourseFacultyAssignment', electiveCourseFacultyAssignmentRoutes);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
