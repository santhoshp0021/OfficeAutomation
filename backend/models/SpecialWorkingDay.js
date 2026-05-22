const mongoose = require('mongoose');

const specialWorkingDaySchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // YYYY-MM-DD (Saturday)
  followsDay: { type: Number, default: null }, // 1=Mon…5=Fri, null=open (no timetable)
  label: { type: String, default: '' }, // optional note e.g. "compensatory for holiday"
});

module.exports = mongoose.model('SpecialWorkingDay', specialWorkingDaySchema);
