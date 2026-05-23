const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
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

// Returns each course with all enrolled users and their roles.
// Only courses that have at least one student AND at least one rep/faculty are returned,
// because those are the groups where a booking by the rep/faculty will propagate to students.
router.get('/course-groups', auth, adminOnly, async (req, res) => {
  try {
    const [enrollments, users] = await Promise.all([
      Enrollment.find({}),
      User.find({}, 'userId role')
    ]);
    const roleMap = Object.fromEntries(users.map(u => [u.userId, u.role]));

    const groups = {};
    for (const enroll of enrollments) {
      for (const course of enroll.enrolled) {
        if (!groups[course.courseCode]) {
          groups[course.courseCode] = {
            courseCode: course.courseCode,
            courseName: course.courseName,
            staffName: course.staffName,
            lab: course.lab,
            users: []
          };
        }
        groups[course.courseCode].users.push({
          userId: enroll.userId,
          role: roleMap[enroll.userId] || 'unknown'
        });
      }
    }

    // Only emit groups where a rep or faculty exists alongside students
    const result = Object.values(groups).filter(g =>
      g.users.some(u => u.role === 'student') &&
      g.users.some(u => u.role === 'student_rep' || u.role === 'faculty')
    );

    res.json(result);
  } catch {
    res.status(500).json({ error: 'Error fetching course groups' });
  }
});

module.exports = router;
