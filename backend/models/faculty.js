const mongoose = require('mongoose');

const CourseHandledSchema = new mongoose.Schema({
  courseCode: { type: String, required: true },
  role: {
    type: String,
    enum: ['Theory Teacher', 'Lab Incharge', 'Lab Assistant'],
    required: true,
  },
  batch: { type: String, required: true },
}, { _id: false });

const ClassSchema = new mongoose.Schema({
  courseCode: String,
  courseName: String,
  semester: String,
  year: Number,
}, { _id: false });

const FacultySchema = new mongoose.Schema({
  facultyId: { type: String, required: true, unique: true },

  name: { type: String, required: true },
  dob: { type: Date, default: null },
  dateOfJoining: { type: Date, default: null },
  gender: { type: String, default: '' },

  contactInfo: {
    email: { type: String, required: false }, 
    phone: { type: String, required: false },
  },

  department: { type: String, default: '' },
  designation: {
    type: String,
    enum: ['Professor', 'Assistant Professor', 'Associate Professor','Guest Faculty','Emeritus Professor'],
    default: '',
  },

  preferredCourses: [{ type: String }],
  allocatedCourse: { type: String, default: '' },

  courseHandled: {
    type: [CourseHandledSchema],
    default: [],
  },
  classesHandled: {
    type: [ClassSchema],
    default: [],
  },

  freeHours: {
    type: Object,
    default: {},
  },

  areasOfExpertise: {
    type: [String],
    default: [],
  },

  profilePicUrl: { type: String, default: '' },
  isActive: { type: Boolean, default: true },

  scaleOfPay: { type: String, default: '' },
  presentPay: { type: String, default: '' },

  natureOfAppointment: {
    type: String,
    enum: ['', 'Temporary', 'Probationer', 'Approved Probationer', 'Permanent'],
    default: '',
  },

  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.Faculty || mongoose.model("Faculty", FacultySchema);
