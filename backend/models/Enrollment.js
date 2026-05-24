const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode:  { type: String, required: true },
  courseName:  { type: String, required: true },
  lab:         { type: Boolean, default: false },
  studentReps: [{ type: String }],
  students:    [{ type: String }],
});

const enrollmentSchema = new mongoose.Schema({
  facultyId: { type: String, required: true, unique: true },
  staffName: { type: String, required: true },   // display name, e.g. "Dr. Smith"
  courses:   { type: [courseSchema], default: [] },
});

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
module.exports = Enrollment;
