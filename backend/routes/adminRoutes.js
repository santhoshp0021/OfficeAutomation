require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();
const User = require('../models/User');
const BookingHistory = require('../models/BookingHistory');
const Weektable = require('../models/Weektable');
const HallRequest = require('../models/HallRequest');
const SpecialWorkingDay = require('../models/SpecialWorkingDay');
const HolidayDay = require('../models/HolidayDay');
const { getWeekStart, PERIOD_TIMES, ensureWeektablesUntil } = require('../utils');
const { auth, adminOnly } = require('../middleware/auth');

// Use local date parts so timezone never shifts the date string
function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Parse a YYYY-MM-DD string safely at local noon (avoids any UTC-offset boundary issues)
function parseLocalDate(dateStr) {
  return new Date(dateStr + 'T12:00:00');
}

// ─── Mail ────────────────────────────────────────────────────────────────────

function createTransporter() {
  return nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS } });
}
async function sendMail(to, subject, text) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) return;
  try { await createTransporter().sendMail({ from: process.env.MAIL_USER, to, subject, text }); }
  catch (err) { console.warn('Email send failed:', err.message); }
}

// ─── Available dates ─────────────────────────────────────────────────────────

// Returns Mon-Fri dates from weektables PLUS special working Saturdays, MINUS holidays.
router.get('/available-week-dates', auth, async (req, res) => {
  try {
    const weekStarts = await Weektable.distinct('weekStart');
    const weekdayDates = weekStarts.flatMap(weekStart => {
      const monday = new Date(weekStart);
      return Array.from({ length: 5 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return localDateStr(d);
      });
    });

    const [specialDays, holidays] = await Promise.all([
      SpecialWorkingDay.find({}),
      HolidayDay.find({})
    ]);
    const holidaySet = new Set(holidays.map(h => h.date));
    const specialDates = specialDays.map(s => s.date).filter(d => !holidaySet.has(d));

    const unique = [...new Set([...weekdayDates, ...specialDates])]
      .filter(d => !holidaySet.has(d))
      .sort();
    res.json(unique);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Holidays / Off Days ──────────────────────────────────────────────────────

router.get('/holidays', auth, async (req, res) => {
  try { res.json(await HolidayDay.find({}).sort({ date: 1 })); }
  catch { res.status(500).json({ error: 'Server error' }); }
});

// Add single or bulk holidays: { dates: ['YYYY-MM-DD',...], label }
router.post('/holidays', auth, adminOnly, async (req, res) => {
  const { dates, label } = req.body;
  if (!Array.isArray(dates) || dates.length === 0) {
    return res.status(400).json({ error: 'dates array required' });
  }
  try {
    const results = { added: [], skipped: [] };
    for (const date of dates) {
      try {
        await HolidayDay.findOneAndUpdate({ date }, { date, label: label || '' }, { upsert: true });
        results.added.push(date);
      } catch { results.skipped.push(date); }
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.delete('/holidays/:date', auth, adminOnly, async (req, res) => {
  try {
    await HolidayDay.deleteOne({ date: req.params.date });
    res.json({ message: 'Holiday removed' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ─── Usage status ─────────────────────────────────────────────────────────────

router.get('/usage-status', auth, async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Missing date' });
  try {
    const usageMap = {};

    // Hall bookings always apply
    const halls = await HallRequest.find({ date, status: 'accepted' });
    for (const b of halls) {
      if (!usageMap[b.hallName]) usageMap[b.hallName] = { name: b.hallName, type: 'hall', usage: [] };
      usageMap[b.hallName].usage.push({ startTime: b.startTime, endTime: b.endTime, bookedBy: b.userId, eventName: b.eventName });
    }

    const dayOfWeek = parseLocalDate(date).getDay(); // 0=Sun,1=Mon…6=Sat

    if (dayOfWeek === 6) {
      // Special Saturday — period usage tracked in BookingHistory (periodId ends with "-6")
      const specialDay = await SpecialWorkingDay.findOne({ date });
      if (specialDay) {
        const dateStart = new Date(date + 'T00:00:00');
        const dateEnd = new Date(date + 'T23:59:59');
        const history = await BookingHistory.find({
          'facility.free': false,
          periodId: { $regex: /-6$/ },
          usageDate: { $gte: dateStart, $lte: dateEnd }
        }).populate('userId', 'userId');
        for (const h of history) {
          const name = h.facility.name;
          if (!usageMap[name]) usageMap[name] = { name, type: h.facility.type, usage: [] };
          const periodNo = parseInt(h.periodId.split('-')[0], 10);
          const times = PERIOD_TIMES[periodNo - 1] || {};
          usageMap[name].usage.push({ periodNo, startTime: times.startTime || '', endTime: times.endTime || '', bookedBy: h.userId?.userId || '?' });
        }
      }
    } else if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const weekStart = getWeekStart(date);
      const weektables = await Weektable.find({ weekStart });
      for (const wt of weektables) {
        for (const period of wt.periods) {
          if (period.day !== dayOfWeek || period.free) continue;
          const facList = [];
          if (period.roomNo) facList.push({ name: period.roomNo, type: 'room' });
          if (period.lab) facList.push({ name: period.lab, type: 'lab' });
          if (period.projector) facList.push({ name: period.projector, type: 'projector' });
          for (const fac of facList) {
            if (!usageMap[fac.name]) usageMap[fac.name] = { name: fac.name, type: fac.type, usage: [] };
            usageMap[fac.name].usage.push({ periodNo: period.periodNo, startTime: period.startTime, endTime: period.endTime, bookedBy: wt.userId });
          }
        }
      }
    }

    res.json(usageMap);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Special Working Days (Saturday) ─────────────────────────────────────────

router.get('/special-days', auth, async (req, res) => {
  try { res.json(await SpecialWorkingDay.find({}).sort({ date: 1 })); }
  catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/special-days', auth, adminOnly, async (req, res) => {
  const { date, followsDay, label } = req.body;
  if (!date) return res.status(400).json({ error: 'date required' });
  if (parseLocalDate(date).getDay() !== 6) {
    return res.status(400).json({ error: 'Only Saturdays can be special working days' });
  }
  if (followsDay != null && (followsDay < 1 || followsDay > 5)) {
    return res.status(400).json({ error: 'followsDay must be 1–5 or null' });
  }
  try {
    const doc = await SpecialWorkingDay.findOneAndUpdate(
      { date },
      { date, followsDay: followsDay ?? null, label: label || '' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.delete('/special-days/:date', auth, adminOnly, async (req, res) => {
  try {
    await SpecialWorkingDay.deleteOne({ date: req.params.date });
    res.json({ message: 'Special day removed' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ─── Generate weektables up to a date ────────────────────────────────────────

router.get('/weektable-coverage', auth, adminOnly, async (req, res) => {
  try {
    const latest = await Weektable.findOne({}).sort({ weekStart: -1 }).select('weekStart');
    res.json({ latestWeekStart: latest?.weekStart || null });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/generate-weektables', auth, adminOnly, async (req, res) => {
  const { tillDate } = req.body;
  if (!tillDate) return res.status(400).json({ error: 'tillDate required' });
  try {
    const result = await ensureWeektablesUntil(parseLocalDate(tillDate));
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// ─── Admin frees a period slot and notifies user ──────────────────────────────

router.post('/free-slot-period', auth, adminOnly, async (req, res) => {
  const { facilityName, type, date, periodNo, userId } = req.body;
  if (!facilityName || !type || !date || !periodNo || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const dateObj = new Date(date); dateObj.setHours(0, 0, 0, 0);
  const day = parseLocalDate(date).getDay();
  const periodId = `${periodNo}-${day}`;
  const weekStart = getWeekStart(date);
  try {
    const user = await User.findOne({ userId });
    if (!user?.email) return res.status(404).json({ error: 'User email not found' });
    const weektable = await Weektable.findOne({ userId, weekStart });
    if (!weektable) return res.status(404).json({ error: 'Weektable not found' });
    const idx = (day - 1) * 8 + (periodNo - 1);
    const p = weektable.periods[idx];
    if (p) {
      if (type === 'room') { p.free = true; p.roomNo = ''; }
      else if (type === 'lab') { p.free = true; p.lab = ''; }
      else if (type === 'projector') { p.projector = ''; }
    }
    await weektable.save();
    await BookingHistory.create({ userId: user._id, periodId, usageDate: dateObj, facility: { name: facilityName, type, free: true } });
    await sendMail(user.email, 'Slot Freed by Admin',
      `Booking cancelled:\nFacility: ${facilityName}\nType: ${type}\nDate: ${date}\nPeriod: ${periodNo}\n\nThe booking has been freed by the admin.`);
    res.json({ message: 'Slot freed and user notified.' });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

// ─── Admin frees a hall slot and notifies user ────────────────────────────────

router.post('/free-slot-hall', auth, adminOnly, async (req, res) => {
  const { hallName, date, startTime, endTime, userId } = req.body;
  if (!hallName || !date || !startTime || !endTime || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const hallReq = await HallRequest.findOneAndUpdate(
      { userId, hallName, date, startTime: { $lte: startTime }, endTime: { $gte: endTime }, status: 'accepted' },
      { $set: { status: 'withdrawn' } }, { new: true }
    );
    if (!hallReq) return res.status(404).json({ error: 'No matching accepted hall booking found' });
    const user = await User.findOne({ userId });
    if (!user?.email) return res.status(404).json({ error: 'User email not found' });
    await sendMail(user.email, 'Hall Slot Cancelled by Admin',
      `Hall: ${hallName}\nDate: ${date}\nTime: ${startTime} - ${endTime}\nEvent: ${hallReq.eventName}\n\nBooking has been withdrawn by the admin.`);
    res.json({ message: 'Hall booking withdrawn and user notified.' });
  } catch { res.status(500).json({ error: 'Internal server error' }); }
});

module.exports = router;
