import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  current_semester: { type: Number },
  batch: { type: String, required: true },
  joined_year: { type: Number },
  isFeedbackGiven: { type: Boolean, default: false },
});

export default mongoose.model("Student", studentSchema);
