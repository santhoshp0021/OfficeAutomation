const mongoose = require('mongoose');

const holidayDaySchema = new mongoose.Schema({
  date:  { type: String, required: true, unique: true }, // YYYY-MM-DD
  label: { type: String, default: '' }, // e.g. "Diwali", "Independence Day"
});

module.exports = mongoose.model('HolidayDay', holidayDaySchema);
