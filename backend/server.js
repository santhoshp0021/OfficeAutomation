require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Weektable = require('./models/Weektable');
const Timetable = require('./models/Timetable');
const Period = require('./models/Period');
const BookingHistory = require('./models/BookingHistory');
const HallRequest = require('./models/HallRequest');
const AuditoriumRequest = require('./models/AuditoriumRequest');
const Enrollment = require('./models/Enrollment');

const { auth, adminOnly } = require('./middleware/auth');
const { getCurrentWeekStart, ensureWeektablesForAllUsers, regenerateWeektablesForUser } = require('./utils');

const availabilityRoutes = require('./routes/availabilityRoutes');
const bookRoutes = require('./routes/bookRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const hallRoutes = require('./routes/hallRoutes');
const audiRoutes = require('./routes/audiRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', availabilityRoutes);
app.use('/api', bookRoutes);
app.use('/api', facilityRoutes);
app.use('/api', hallRoutes);
app.use('/api', audiRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);

// ─── Auth ────────────────────────────────────────────────────────────────────

app.post('/api/login', async (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ error: 'userId and password required' });
  }
  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(401).json({ error: 'Invalid userId or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid userId or password' });

    const token = jwt.sign(
      { userId: user.userId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ success: true, token, userId: user.userId, role: user.role });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

app.post('/api/register', auth, adminOnly, async (req, res) => {
  const { userId, password, role, email } = req.body;
  if (!userId || !password || !role || !email) {
    return res.status(400).json({ message: 'All fields required' });
  }
  const validRoles = ['student', 'student_rep', 'faculty', 'secretary', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  try {
    const existing = await User.findOne({ userId });
    if (existing) return res.status(400).json({ message: 'userId already registered' });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ userId, password: hashed, role, email });
    await ensureWeektablesForAllUsers();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// ─── Periods ─────────────────────────────────────────────────────────────────

app.get('/api/weekperiod-details', auth, async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const weekStart = getCurrentWeekStart();
    const weektable = await Weektable.findOne({ userId: user.userId, weekStart });
    if (!weektable || !Array.isArray(weektable.periods)) return res.json([]);

    res.json(weektable.periods);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching week periods', details: err.message });
  }
});

// ─── Booking History ─────────────────────────────────────────────────────────

app.get('/api/booking-history', auth, async (req, res) => {
  try {
    const { facilityName, date } = req.query;
    const filter = {};
    if (facilityName) filter['facility.name'] = { $regex: facilityName, $options: 'i' };
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }
    const history = await BookingHistory.find(filter)
      .populate('userId', 'userId')
      .sort({ date: -1 });
    res.json(history);
  } catch {
    res.status(500).json({ error: 'Could not fetch booking history' });
  }
});

// ─── Users ───────────────────────────────────────────────────────────────────

app.get('/api/users/:userId', auth, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ userId: user.userId, role: user.role, email: user.email });
  } catch {
    res.status(500).json({ error: 'Error fetching user' });
  }
});

app.get('/api/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, 'userId role email');
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// ─── Cascade delete helper ────────────────────────────────────────────────────
async function deleteUserCascade(userId) {
  const user = await User.findOne({ userId });
  if (!user) return;
  // Timetable → Period docs
  const timetable = await Timetable.findOne({ userId });
  if (timetable) {
    await Period.deleteMany({ _id: { $in: timetable.periods } });
    await Timetable.deleteOne({ userId });
  }
  await Weektable.deleteMany({ userId });
  await Enrollment.deleteOne({ userId });
  await BookingHistory.deleteMany({ userId: user._id });
  await HallRequest.deleteMany({ userId });
  await AuditoriumRequest.deleteMany({ userId });
  await User.deleteOne({ userId });
}

// DELETE single user + all their data (admin only, cannot delete self)
app.delete('/api/users/:userId', auth, adminOnly, async (req, res) => {
  const { userId } = req.params;
  if (userId === req.user.userId) return res.status(400).json({ error: 'Cannot delete your own account' });
  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    await deleteUserCascade(userId);
    res.json({ message: `User ${userId} and all associated data deleted` });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
});

// POST bulk delete users (admin only)
app.post('/api/users/bulk-delete', auth, adminOnly, async (req, res) => {
  const { userIds } = req.body;
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'userIds array required' });
  }
  const filtered = userIds.filter(id => id !== req.user.userId);
  const results = { deleted: [], failed: [] };
  for (const userId of filtered) {
    try {
      const user = await User.findOne({ userId });
      if (!user) { results.failed.push({ userId, reason: 'Not found' }); continue; }
      await deleteUserCascade(userId);
      results.deleted.push(userId);
    } catch (err) {
      results.failed.push({ userId, reason: err.message });
    }
  }
  res.json(results);
});

// POST bulk register users (admin only)
app.post('/api/register/bulk', auth, adminOnly, async (req, res) => {
  const { users } = req.body;
  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ error: 'users array required' });
  }
  const validRoles = ['student', 'student_rep', 'faculty', 'secretary', 'admin'];
  const results = { created: [], failed: [] };
  for (const u of users) {
    const { userId, password, role, email } = u;
    if (!userId || !password || !role || !email) {
      results.failed.push({ userId: userId || '?', reason: 'Missing fields' }); continue;
    }
    if (!validRoles.includes(role)) {
      results.failed.push({ userId, reason: `Invalid role: ${role}` }); continue;
    }
    try {
      const exists = await User.findOne({ userId });
      if (exists) { results.failed.push({ userId, reason: 'Already exists' }); continue; }
      const hashed = await bcrypt.hash(password, 10);
      await User.create({ userId, password: hashed, role, email });
      results.created.push(userId);
    } catch (err) {
      results.failed.push({ userId, reason: err.message });
    }
  }
  if (results.created.length > 0) await ensureWeektablesForAllUsers();
  res.json(results);
});

// ─── Timetable ───────────────────────────────────────────────────────────────

app.post('/api/timetable', auth, adminOnly, async (req, res) => {
  const { userId, periods } = req.body;
  if (!userId || !Array.isArray(periods) || periods.length !== 40) {
    return res.status(400).json({ error: 'userId and exactly 40 periods required' });
  }
  for (const p of periods) {
    if (
      typeof p.periodNo !== 'number' || p.periodNo < 1 || p.periodNo > 8 ||
      typeof p.day !== 'number' || p.day < 1 || p.day > 5
    ) {
      return res.status(400).json({ error: 'Each period must have periodNo 1–8 and day 1–5' });
    }
  }
  try {
    await Timetable.deleteOne({ userId });
    const periodDocs = await Period.insertMany(periods);
    const timetable = await Timetable.create({
      userId,
      periods: periodDocs.map(p => p._id)
    });
    await regenerateWeektablesForUser(userId);
    res.json({ success: true, timetable });
  } catch (err) {
    res.status(500).json({ error: 'Error creating timetable', details: err.message });
  }
});

// ─── DB + Start ───────────────────────────────────────────────────────────────

async function seedAdminUser() {
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await User.create({
      userId: process.env.ADMIN_USERID || 'admin',
      password: hashed,
      role: 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@anna.edu'
    });
    console.log(`Default admin created → userId: ${process.env.ADMIN_USERID || 'admin'} / password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
  }
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await seedAdminUser();
    await ensureWeektablesForAllUsers();
  })
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
