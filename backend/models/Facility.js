const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, required: true, enum: ['room', 'lab', 'projector', 'hall'] },
  free: { type: Boolean, default: true },
  bookedBy: { type: String, default: '' },
  bookable: { type: Boolean, default: true }
});

module.exports = mongoose.model('Facility', facilitySchema);
