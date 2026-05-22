const mongoose = require('mongoose');

const bookingHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  periodId: { type: String, required: true },
  facility: {
    name: { type: String },
    type: { type: String },
    free: { type: Boolean }
  },
  usageDate: { type: Date, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BookingHistory', bookingHistorySchema);
