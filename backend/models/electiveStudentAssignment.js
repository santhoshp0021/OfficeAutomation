import mongoose from "mongoose";

const electiveStudentAssignmentSchema = new mongoose.Schema({
  s_id: { type: String, required: true },
  electives: [
    {
      electiveCourse: { type: mongoose.Schema.Types.ObjectId, ref: "ElectiveCourse", required: true },
      batch: { type: Number, required: true, min: 1, max: 5 }
    }
  ]
});

const ElectiveStudentAssignment = mongoose.model("ElectiveStudentAssignment", electiveStudentAssignmentSchema);
export default ElectiveStudentAssignment;
