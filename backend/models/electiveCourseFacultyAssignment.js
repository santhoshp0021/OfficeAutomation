import mongoose from "mongoose";

const electiveCourseFacultyAssignmentSchema = new mongoose.Schema({
  electiveCourse: { type: mongoose.Schema.Types.ObjectId, ref: "ElectiveCourse", required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
  batch: { type: Number, required: true, min: 1, max: 5 },
});

const ElectiveCourseFacultyAssignment = mongoose.model("ElectiveCourseFacultyAssignment", electiveCourseFacultyAssignmentSchema);
export default ElectiveCourseFacultyAssignment; 