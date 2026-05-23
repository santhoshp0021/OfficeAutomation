require('dotenv').config();
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const HallRequest = require('../models/HallRequest');
const HolidayDay = require('../models/HolidayDay');
const User = require('../models/User');
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

function buildReceiptPDF(booking) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Hall Booking Confirmation', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').fillColor('#555555')
      .text('Your hall booking request has been approved.', { align: 'center' });
    doc.moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(1);

    // Details table
    const rows = [
      ['Booking Reference', String(booking._id)],
      ['Hall', booking.hallName],
      ['Event', booking.eventName],
      ['Date', booking.date],
      ['Time', `${booking.startTime} – ${booking.endTime}`],
      ['Booked By', booking.userId],
      ['Status', 'CONFIRMED'],
      ['Issued On', new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
    ];

    rows.forEach(([label, value]) => {
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333').text(label + ':', { continued: true, width: 180 });
      doc.font('Helvetica').fillColor('#000000').text('  ' + value);
      doc.moveDown(0.3);
    });

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(1);

    doc.fontSize(10).font('Helvetica').fillColor('#888888')
      .text('Please carry this receipt when using the hall. This is a system-generated document.', { align: 'center' });

    doc.end();
  });
}

async function sendReceiptEmail(toEmail, booking) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) return;
  const pdfBuffer = await buildReceiptPDF(booking);
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
  });
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: toEmail,
    subject: `Hall Booking Confirmed — ${booking.hallName} on ${booking.date}`,
    text: `Your booking for ${booking.hallName} on ${booking.date} (${booking.startTime}–${booking.endTime}) has been confirmed. Please find the receipt attached.`,
    attachments: [{ filename: 'HallBookingReceipt.pdf', content: pdfBuffer, contentType: 'application/pdf' }]
  });
}

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
// Accepting auto-rejects overlapping pending requests and emails a PDF receipt to the user
router.post('/hall-requests/:id/status', auth, adminOnly, async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected', 'withdrawn'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const target = await HallRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!target) return res.status(404).json({ error: 'Request not found' });

    if (status === 'accepted') {
      // Auto-reject overlapping pending requests for the same hall+date
      await HallRequest.updateMany(
        {
          _id: { $ne: target._id },
          hallName: target.hallName,
          date: target.date,
          status: 'pending',
          startTime: { $lt: target.endTime },
          endTime: { $gt: target.startTime },
        },
        { status: 'rejected' }
      );

      // Email PDF receipt to the user (fire-and-forget, don't block the response)
      User.findOne({ userId: target.userId }).then(user => {
        if (user?.email) sendReceiptEmail(user.email, target).catch(() => {});
      }).catch(() => {});
    }

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
