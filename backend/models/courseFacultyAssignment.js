import mongoose from "mongoose";

const courseFacultyAssignmentSchema = new mongoose.Schema({
  course: { type: String, ref: "Course", required: true },
  faculty: { type: String, ref: "Faculty", required: true },
  semester: { type: Number, required: true, min: 1, max: 8 },
  batch: { type: String, required: true },
});

export default mongoose.model(
  "CourseFacultyAssignment",
  courseFacultyAssignmentSchema
);
