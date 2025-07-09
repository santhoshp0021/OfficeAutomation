import mongoose from "mongoose";

const questionRatingSchema = new mongoose.Schema({
  question: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
}, { _id: false });

const feedbackSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  batch: { type: String, required: true },
  semester: { type: Number, required: true },
  questionRating: [questionRatingSchema],
  additionalComments: { type: String },
  score: { type: Number, min: 0, max: 25, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Feedback", feedbackSchema);
