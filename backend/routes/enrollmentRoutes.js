const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/courses', auth, async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    const enrollment = await Enrollment.findOne({ userId });
    res.json(enrollment ? enrollment.enrolled : []);
  } catch {
    res.status(500).json({ error: 'Error fetching enrolled courses' });
  }
});

router.get('/all', auth, adminOnly, async (req, res) => {
  try {
    res.json(await Enrollment.find({}));
  } catch {
    res.status(500).json({ error: 'Error fetching enrollments' });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
  const { userId, enrolled } = req.body;
  if (!userId || !Array.isArray(enrolled) || enrolled.length === 0) {
    return res.status(400).json({ error: 'userId and enrolled (array of courses) are required' });
  }
  for (const course of enrolled) {
    if (
      typeof course.courseCode !== 'string' ||
      typeof course.courseName !== 'string' ||
      typeof course.staffName !== 'string' ||
      typeof course.lab !== 'boolean'
    ) {
      return res.status(400).json({ error: 'Each course must have courseCode, courseName, staffName (string), and lab (boolean)' });
    }
  }
  try {
    let enrollment = await Enrollment.findOne({ userId });
    if (enrollment) {
      enrollment.enrolled = enrolled;
      await enrollment.save();
    } else {
      enrollment = await Enrollment.create({ userId, enrolled });
    }
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ error: 'Error updating enrollment', details: err.message });
  }
});

router.delete('/:userId', auth, adminOnly, async (req, res) => {
  try {
    const result = await Enrollment.deleteOne({ userId: req.params.userId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Enrollment not found' });
    res.json({ message: 'Enrollment deleted' });
  } catch {
    res.status(500).json({ error: 'Error deleting enrollment' });
  }
});

module.exports = router;
