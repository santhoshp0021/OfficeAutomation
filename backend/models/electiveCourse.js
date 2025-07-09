import mongoose from "mongoose";

const electiveCourseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  semester: { type: Number, required: true },
});

const ElectiveCourse = mongoose.model("ElectiveCourse", electiveCourseSchema);
export default ElectiveCourse;
