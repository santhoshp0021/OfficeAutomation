import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  semester: { type: Number, required: true, min: 1, max: 8 },
});

export default mongoose.model("Course", courseSchema);