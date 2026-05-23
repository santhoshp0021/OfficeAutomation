const express = require('express');
const router = express.Router();
const { getCurrentWeekStart, localDateStr, checkHoliday, propagatePeriodUpdate } = require('../utils');
const User = require('../models/User');
const Weektable = require('../models/Weektable');
const BookingHistory = require('../models/BookingHistory');
const { auth } = require('../middleware/auth');

// Compute the actual calendar date for a periodId in the current week
function periodDate(periodId) {
  const day = parseInt(periodId.split('-')[1], 10); // 1=Mon…5=Fri
  const weekStart = getCurrentWeekStart();
  const d = new Date(weekStart);
  d.setDate(weekStart.getDate() + day - 1);
  return localDateStr(d);
}

// ── Projector ────────────────────────────────────────────────────────────────

router.post('/book-projector', auth, async (req, res) => {
  const { userId, periodId, projectorName } = req.body;
  if (!userId || !periodId || !projectorName?.trim()) {
    return res.status(400).json({ error: 'userId, periodId, and projectorName required' });
  }
  const holiday = await checkHoliday(periodDate(periodId));
  if (holiday) return res.status(400).json({ error: `${holiday.date} is a holiday${holiday.label ? ': ' + holiday.label : ''}` });
  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const weekStart = getCurrentWeekStart();
    const weektable = await Weektable.findOne({ userId, weekStart });
    if (!weektable) return res.status(404).json({ error: 'Weektable not found' });

    const period = weektable.periods.find(p => p.periodId === periodId);
    if (!period) return res.status(404).json({ error: 'Period not found in weektable' });
    if (period.projector) return res.status(409).json({ error: 'Projector already booked for this period' });

    const courseCode = period.courseCode || '';
    period.projector = projectorName.trim();
    await weektable.save();

    await propagatePeriodUpdate(weekStart, periodId, courseCode, userId, p => {
      p.projector = projectorName.trim();
    });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    await BookingHistory.create({
      userId: user._id, periodId, usageDate: today,
      facility: { name: projectorName.trim(), type: 'projector', free: false }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error booking projector', details: err.message });
  }
});

// ── Room ─────────────────────────────────────────────────────────────────────

router.post('/book-room', auth, async (req, res) => {
  const { userId, periodId, roomName, staffName, courseCode } = req.body;
  if (!userId || !periodId || !roomName) {
    return res.status(400).json({ error: 'userId, periodId, and roomName required' });
  }
  const holiday = await checkHoliday(periodDate(periodId));
  if (holiday) return res.status(400).json({ error: `${holiday.date} is a holiday${holiday.label ? ': ' + holiday.label : ''}` });
  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const weekStart = getCurrentWeekStart();
    const weektable = await Weektable.findOne({ userId, weekStart });
    if (!weektable) return res.status(404).json({ error: 'Weektable not found' });

    const period = weektable.periods.find(p => p.periodId === periodId);
    if (!period) return res.status(404).json({ error: 'Period not found in weektable' });

    const effectiveCourseCode = courseCode || period.courseCode || '';
    period.free = false;
    period.roomNo = roomName;
    period.staffName = staffName || '';
    period.courseCode = effectiveCourseCode;
    await weektable.save();

    await propagatePeriodUpdate(weekStart, periodId, effectiveCourseCode, userId, p => {
      p.free = false;
      p.roomNo = roomName;
      p.staffName = staffName || '';
    });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    await BookingHistory.create({
      userId: user._id, periodId, usageDate: today,
      facility: { name: roomName, type: 'room', free: false }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error booking room', details: err.message });
  }
});

// ── Lab ──────────────────────────────────────────────────────────────────────

router.post('/book-lab', auth, async (req, res) => {
  const { userId, periodId, labName, staffName, courseCode } = req.body;
  if (!userId || !periodId || !labName) {
    return res.status(400).json({ error: 'userId, periodId, and labName required' });
  }
  const holiday = await checkHoliday(periodDate(periodId));
  if (holiday) return res.status(400).json({ error: `${holiday.date} is a holiday${holiday.label ? ': ' + holiday.label : ''}` });
  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const weekStart = getCurrentWeekStart();
    const weektable = await Weektable.findOne({ userId, weekStart });
    if (!weektable) return res.status(404).json({ error: 'Weektable not found' });

    const period = weektable.periods.find(p => p.periodId === periodId);
    if (!period) return res.status(404).json({ error: 'Period not found in weektable' });

    const effectiveCourseCode = courseCode || period.courseCode || '';
    period.free = false;
    period.lab = labName;
    period.staffName = staffName || '';
    period.courseCode = effectiveCourseCode;
    await weektable.save();

    await propagatePeriodUpdate(weekStart, periodId, effectiveCourseCode, userId, p => {
      p.free = false;
      p.lab = labName;
      p.staffName = staffName || '';
    });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    await BookingHistory.create({
      userId: user._id, periodId, usageDate: today,
      facility: { name: labName, type: 'lab', free: false }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error booking lab', details: err.message });
  }
});

// ── Free period ───────────────────────────────────────────────────────────────

router.post('/free-period/:periodId', auth, async (req, res) => {
  const { periodId } = req.params;
  const { userId } = req.body;
  if (!userId || !periodId) return res.status(400).json({ error: 'userId and periodId required' });
  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const weekStart = getCurrentWeekStart();
    const weektable = await Weektable.findOne({ userId, weekStart });
    if (!weektable) return res.status(404).json({ error: 'Weektable not found' });

    const period = weektable.periods.find(p => p.periodId === periodId);
    if (!period) return res.status(404).json({ error: 'Period not found in weektable' });

    const facilityName = period.roomNo || period.lab || period.projector;
    const facilityType = period.roomNo ? 'room' : period.lab ? 'lab' : 'projector';
    const courseCode = period.courseCode || '';

    period.free = true;
    period.roomNo = '';
    period.lab = '';
    period.projector = '';
    period.staffName = '';
    // courseCode is a timetable property — not cleared on free
    await weektable.save();

    await propagatePeriodUpdate(weekStart, periodId, courseCode, userId, p => {
      p.free = true;
      p.roomNo = '';
      p.lab = '';
      p.projector = '';
      p.staffName = '';
    });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    await BookingHistory.create({
      userId: user._id, periodId, usageDate: today,
      facility: { name: facilityName, type: facilityType, free: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error freeing period', details: err.message });
  }
});

module.exports = router;
