const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  facultyId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  course: {
    type: String,
    required: true,
    trim: true
  },
  courseCode: {
    type: String,
    trim: true
  },
  // Newly added fields
  position: {
    type: String
  },
  contactInfo: {
    email: { type: String },
    phone: { type: String }
  },
  areasOfExpertise: [{
    type: String
  }],
  classesHandled: [{
    subject: { type: String },
    semester: { type: String },
    section: { type: String },
    year: { type: String }
  }],
  dob: {
    type: Date
  },
  dateOfJoining: {
    type: Date
  },
  department: {
    type: String
  },
  gender: {
    type: String
  },
  profilePicUrl: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  scaleOfPay: {
    type: String
  },
  presentPay: {
    type: String
  },
  natureOfAppointment: {
    type: String,
    enum: ['Temporary', 'Probationer', 'Approved Probationer', 'Permanent']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Faculty', facultySchema); 