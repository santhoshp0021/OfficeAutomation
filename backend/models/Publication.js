const mongoose = require("mongoose");

const publicationSchema = new mongoose.Schema({
  citation_id: {
    type: String,
    unique: true,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  authors: {
    type: [String],
    required: true,
  },
  publicationDate: {
    type: Date,
    required: true,
  },
  journal: {
    type: String,
    trim: true,
  },
  doi: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Publication", publicationSchema);
