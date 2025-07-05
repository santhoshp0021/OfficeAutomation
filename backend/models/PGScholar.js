const mongoose = require("mongoose");

const pgScholarSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
  },
  contactInfo: {
    email: {
      type: String,
      required: false,
      trim: true,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
    },
  },
  areaOfResearch: {
    type: String,
    required: true,
    trim: true,
  },

  // supervisor is now a reference to faculty
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  dateOfJoining: {
    type: Date,
    required: false,
  },

  dateOfCompletion: {
    type: Date,
    required: false,
  },

  semester: {
    type: String,
    required: true,
    trim: true,
  },
  program: {
    type: String,
    required: true,
    enum: ['UG', 'PG Diploma', 'M.Phil.', 'Ph.D.'],
    trim: true,
  },
});

module.exports = mongoose.model("PGScholar", pgScholarSchema);
