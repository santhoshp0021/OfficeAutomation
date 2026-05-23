const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Weektable = require('../models/Weektable');
const BookingHistory = require('../models/BookingHistory');
const Facility = require('../models/Facility');
const SpecialWorkingDay = require('../models/SpecialWorkingDay');
const HolidayDay = require('../models/HolidayDay');
const { getWeekStart, propagatePeriodUpdate } = require('../utils');
const { auth } = require('../middleware/auth');

function parseLocalDate(dateStr) { return new Date(dateStr + 'T12:00:00'); }

// GET available facilities for a user at a given date and slot
router.get('/facilities/available', auth, async (req, res) => {
  const { date, slot, userId } = req.query;
  if (!date || slot === undefined || !userId) {
    return res.status(400).json({ error: 'Missing date, slot or userId' });
  }

  const dayNum = parseLocalDate(date).getDay();
  const slotNum = parseInt(slot, 10);
  if (slotNum < 0 || slotNum > 7) return res.status(400).json({ error: 'Invalid slot' });

  // Special Saturday: return all facilities with Saturday-specific booking check
  if (dayNum === 6) {
    const specialDay = await SpecialWorkingDay.findOne({ date });
    if (!specialDay) return res.status(400).json({ error: 'Not a special working day' });
    try {
      const periodId = `${slotNum + 1}-6`;
      const dateStart = new Date(date + 'T00:00:00');
      const dateEnd   = new Date(date + 'T23:59:59');
      const booked = await BookingHistory.find({ 'facility.free': false, periodId, usageDate: { $gte: dateStart, $lte: dateEnd } });
      const usedNames = new Set(booked.map(h => h.facility.name));
      const facilities = await Facility.find({ bookable: true });
      return res.json(facilities.map(f => ({ ...f.toObject(), free: !usedNames.has(f.name) })));
    } catch (err) {
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
  }

  if (dayNum < 1 || dayNum > 5) return res.status(400).json({ error: 'Invalid date (not a working day)' });

  const monday = getWeekStart(date);
  const index = (dayNum - 1) * 8 + slotNum;

  try {
    const facilities = await Facility.find({ bookable: true });
    const weektables = await Weektable.find({ weekStart: monday });

    const usedRooms = new Set();
    const usedLabs = new Set();
    const usedProjectors = new Set();
    let userPeriod;

    for (const wt of weektables) {
      const p = wt.periods[index];
      if (!p) continue;
      if (wt.userId === userId) userPeriod = p;
      if (!p.free) {
        if (p.roomNo) usedRooms.add(p.roomNo);
        if (p.lab) usedLabs.add(p.lab);
      }
      if (p.projector) usedProjectors.add(p.projector);
    }

    if (!userPeriod) {
      return res.status(404).json({ error: 'No period data for this user/week' });
    }

    // Period is booked and already has a projector — nothing more to book
    if (!userPeriod.free && userPeriod.projector) return res.json([]);

    // Period is booked but no projector — show only projectors
    if (!userPeriod.free && !userPeriod.projector) {
      return res.json(
        facilities.filter(f => f.type === 'projector').map(f => ({
          ...f.toObject(),
          free: !usedProjectors.has(f.name)
        }))
      );
    }

    // Period is free — show all facility types
    return res.json(
      facilities.map(f => {
        const isUsed =
          f.type === 'room' ? usedRooms.has(f.name) :
          f.type === 'lab' ? usedLabs.has(f.name) :
          f.type === 'projector' ? usedProjectors.has(f.name) : false;
        return { ...f.toObject(), free: !isUsed };
      })
    );
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST book a facility
router.post('/facilities/book', auth, async (req, res) => {
  const { date, slot, facility, type, userId } = req.body;
  if (!date || slot === undefined || !facility || !type || !userId) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // Block bookings on holidays
  const holiday = await HolidayDay.findOne({ date });
  if (holiday) return res.status(400).json({ error: `${date} is a holiday${holiday.label ? ': ' + holiday.label : ''}` });

  if (req.user.role === 'student_rep') {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = parseLocalDate(date); target.setHours(0, 0, 0, 0);
    const diffDays = (target - today) / 86400000;
    if (diffDays < 0 || diffDays > 6) {
      return res.status(400).json({ error: 'Student rep can only book within 7 days from today' });
    }
  }

  const dayNum = parseLocalDate(date).getDay(); // 0=Sun,1=Mon…6=Sat
  const slotNum = parseInt(slot, 10);
  if (slotNum < 0 || slotNum > 7) return res.status(400).json({ error: 'Invalid slot' });

  // ── Special Saturday ──────────────────────────────────────────────────────
  if (dayNum === 6) {
    const specialDay = await SpecialWorkingDay.findOne({ date });
    if (!specialDay) return res.status(400).json({ error: 'Not a special working day' });

    const periodId = `${slotNum + 1}-6`;
    const dateStart = new Date(date + 'T00:00:00');
    const dateEnd   = new Date(date + 'T23:59:59');

    try {
      const facilityDoc = await Facility.findOne({ name: facility, type });
      if (!facilityDoc) return res.status(404).json({ error: 'Facility not found' });

      const conflict = await BookingHistory.findOne({
        'facility.name': facility, 'facility.free': false, periodId,
        usageDate: { $gte: dateStart, $lte: dateEnd }
      });
      if (conflict) return res.status(409).json({ error: 'Already booked for this slot' });

      const user = await User.findOne({ userId });
      if (!user) return res.status(404).json({ error: 'User not found' });

      await BookingHistory.create({ userId: user._id, periodId, usageDate: dateStart, facility: { name: facility, type, free: false } });
      return res.json({ message: 'Facility booked for special working day' });
    } catch (err) {
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
  }

  // ── Regular Mon–Fri ───────────────────────────────────────────────────────
  if (dayNum < 1 || dayNum > 5) return res.status(400).json({ error: 'Invalid date (not a working day)' });

  const weekStart = getWeekStart(date);
  const dateObj = new Date(date + 'T00:00:00');
  const index = (dayNum - 1) * 8 + slotNum;
  const periodId = `${slotNum + 1}-${dayNum}`;

  try {
    const facilityDoc = await Facility.findOne({ name: facility, type });
    if (!facilityDoc) return res.status(404).json({ error: 'Facility not found' });

    const wt = await Weektable.findOne({ userId, weekStart });
    if (!wt) return res.status(404).json({ error: 'No Weektable for this user & week' });

    const slotData = wt.periods[index];
    if (!slotData) return res.status(404).json({ error: 'Period not found' });

    if ((type === 'room' || type === 'lab') && !slotData.free) {
      return res.status(409).json({ error: 'Already booked a room/lab for this slot' });
    }
    if (type === 'projector' && slotData.projector) {
      return res.status(409).json({ error: 'Already booked a projector for this slot' });
    }

    if (type === 'room') { slotData.roomNo = facility; slotData.free = false; }
    else if (type === 'lab') { slotData.lab = facility; slotData.free = false; }
    else if (type === 'projector') { slotData.projector = facility; }
    else return res.status(400).json({ error: 'Invalid facility type' });

    const courseCode = slotData.courseCode || '';
    await wt.save();

    await propagatePeriodUpdate(weekStart, periodId, courseCode, userId, p => {
      if (type === 'room') { p.roomNo = facility; p.free = false; }
      else if (type === 'lab') { p.lab = facility; p.free = false; }
      else if (type === 'projector') { p.projector = facility; }
    });

    const user = await User.findOne({ userId });
    await BookingHistory.create({ userId: user._id, periodId, usageDate: dateObj, facility: { name: facility, type, free: false } });
    res.json({ message: 'Facility booked successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error during booking', details: err.message });
  }
});

module.exports = router;
