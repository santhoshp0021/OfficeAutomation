const express = require('express');
const router = express.Router();
const AuditoriumRequest = require('../models/AuditoriumRequest');
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

router.post('/audi-request', auth, upload.single('pdf'), async (req, res) => {
  try {
    const { userId, date, startTime, endTime, eventName, venue, additionalInfo } = req.body;
    if (!userId || !date || !startTime || !endTime || !eventName || !venue) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (endTime <= startTime) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Supporting PDF is required' });
    }
    await AuditoriumRequest.create({
      userId, date, startTime, endTime, eventName, venue, additionalInfo,
      pdf: { data: req.file.buffer, contentType: req.file.mimetype }
    });
    res.json({ message: 'Booking submitted successfully' });
  } catch (err) {
    if (err.message?.includes('PDF')) return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

router.get('/audi-requests', auth, async (req, res) => {
  const { status, userId } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (userId) filter.userId = userId;
  try {
    const requests = await AuditoriumRequest.find(filter).sort({ bookedAt: -1 });
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
    res.status(500).json({ error: 'Could not fetch audi requests' });
  }
});

router.post('/audi-requests/:id/status', auth, adminOnly, async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    await AuditoriumRequest.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Could not update status' });
  }
});

module.exports = router;
