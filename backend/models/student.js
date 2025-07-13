const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    registerNo: {
      type: String,
      required: true,
      unique: true,
    },
    current_semester: {
      type: Number,
    },
    batch: {
      type: String,
      required: true,
    },
    joined_year: {
      type: Number,
    },
    year: {
      type: String,
      required: true,
    },
    facultyAdvisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isFeedbackGiven: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

if (process.env.NODE_ENV === "development" && mongoose.models.Student) {
  delete mongoose.models.Student;
}

module.exports = mongoose.model("Student", studentSchema);
