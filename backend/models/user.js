import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["student", "faculty", "admin"], required: true },
  password: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  // Reference to the actual student/faculty document
  studentRef: { type: String, ref: "Student" },
  facultyRef: { type: String, ref: "Faculty" },
});

export default mongoose.model("User", userSchema); 