const express = require('express');
const router = express.Router();
const HallRequest = require('../models/HallRequest');
const HolidayDay = require('../models/HolidayDay');
const multer = require('multer');
const { auth, adminOnly } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  }
});

// Submit a hall booking request
router.post('/hall-request', auth, upload.single('pdf'), async (req, res) => {
  const { userId, hallName, date, startTime, endTime, eventName } = req.body;
  if (!userId || !hallName || !date || !startTime || !endTime || !eventName) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Supporting PDF is required' });
  }

  const holiday = await HolidayDay.findOne({ date });
  if (holiday) return res.status(400).json({ error: `${date} is a holiday${holiday.label ? ': ' + holiday.label : ''}` });

  if (req.user.role === 'student_rep') {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(date + 'T12:00:00'); target.setHours(0, 0, 0, 0);
    const diffDays = (target - today) / 86400000;
    if (diffDays < 0 || diffDays > 6) {
      return res.status(400).json({ error: 'Student rep can only book halls within 7 days from today' });
    }
  }

  try {
    const overlap = await HallRequest.findOne({
      hallName,
      date,
      status: 'accepted',
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }]
    });
    if (overlap) return res.status(409).json({ error: 'Hall already booked for this time slot' });

    await HallRequest.create({
      userId,
      hallName,
      date,
      startTime,
      endTime,
      eventName,
      pdf: { data: req.file.buffer, contentType: req.file.mimetype }
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Could not create hall request' });
  }
});

// Get hall requests (with optional status/userId filters)
router.get('/hall-requests', auth, async (req, res) => {
  const { status, userId } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (userId) filter.userId = userId;
  try {
    const requests = await HallRequest.find(filter).sort({ bookedAt: -1 });
    const result = requests.map(r => {
      const obj = r.toObject();
      if (obj.pdf?.data) {
        const buf = obj.pdf.data.buffer ? obj.pdf.data.buffer : obj.pdf.data;
        obj.pdf.data = Buffer.from(buf).toString('base64');
      }
      return obj;
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Could not fetch hall requests' });
  }
});

// Filter hall requests by hallName / date
router.get('/hall-requests/filter', auth, async (req, res) => {
  const filter = {};
  if (req.query.hallName) filter.hallName = { $regex: req.query.hallName, $options: 'i' };
  if (req.query.date) filter.date = req.query.date;
  try {
    const requests = await HallRequest.find(filter).sort({ bookedAt: -1 });
    res.json(requests);
  } catch {
    res.status(500).json({ error: 'Could not fetch filtered hall requests' });
  }
});

// Update status of a hall request (admin)
router.post('/hall-requests/:id/status', auth, adminOnly, async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected', 'withdrawn'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    await HallRequest.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Could not update status' });
  }
});

// Get accepted bookings for a hall on a date
router.get('/hall-requests/slots', auth, async (req, res) => {
  const { hallName, date } = req.query;
  if (!hallName || !date) return res.status(400).json({ error: 'hallName and date are required' });
  try {
    const bookings = await HallRequest.find({ hallName, date, status: 'accepted' });
    const result = bookings.map(r => {
      const obj = r.toObject();
      if (obj.pdf?.data) {
        const buf = obj.pdf.data.buffer ? obj.pdf.data.buffer : obj.pdf.data;
        obj.pdf.data = Buffer.from(buf).toString('base64');
      }
      return obj;
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
