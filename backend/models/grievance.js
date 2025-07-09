import mongoose from "mongoose";

const grievanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  batch: { type: String, required: true },
  semester: { type: Number, required: true },
  category: { type: String, required: true },
  subject: { type: String, required: true },
  grievanceText: { type: String, required: true },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Resolved", "Rejected"],
    default: "Pending",
  },
  adminResponse: { type: String },
  resolvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Grievance", grievanceSchema);