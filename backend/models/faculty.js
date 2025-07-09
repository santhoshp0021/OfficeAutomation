import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  designation: { type: String},
});

export default mongoose.model("Faculty", facultySchema);