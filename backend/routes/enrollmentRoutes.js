const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const { auth, adminOnly } = require('../middleware/auth');
const { regenerateWeektablesForUser } = require('../utils');

// GET courses visible to a userId
//   faculty  → their own courses (courseCode, courseName, lab, staffName)
//   student/rep → all courses they appear in across any faculty enrollment
router.get('/courses', auth, async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    const facultyDoc = await Enrollment.findOne({ facultyId: userId });
    if (facultyDoc) {
      return res.json(facultyDoc.courses.map(c => ({
        courseCode: c.courseCode,
        courseName: c.courseName,
        lab: c.lab,
        staffName: facultyDoc.staffName,
      })));
    }

    // student / rep — collect all courses they appear in
    const docs = await Enrollment.find({
      $or: [{ 'courses.students': userId }, { 'courses.studentReps': userId }],
    });
    const result = [];
    for (const doc of docs) {
      for (const c of doc.courses) {
        if (c.students.includes(userId) || c.studentReps.includes(userId)) {
          result.push({
            courseCode: c.courseCode,
            courseName: c.courseName,
            lab: c.lab,
            staffName: doc.staffName,
          });
        }
      }
    }
    return res.json(result);
  } catch {
    res.status(500).json({ error: 'Error fetching courses' });
  }
});

// GET all enrollment docs (admin)
router.get('/all', auth, adminOnly, async (req, res) => {
  try {
    res.json(await Enrollment.find({}));
  } catch {
    res.status(500).json({ error: 'Error fetching enrollments' });
  }
});

// GET propagation groups — one entry per (faculty, course) pair that has members
router.get('/course-groups', auth, adminOnly, async (req, res) => {
  try {
    const docs = await Enrollment.find({});
    const groups = [];
    for (const doc of docs) {
      for (const c of doc.courses) {
        groups.push({
          facultyId: doc.facultyId,
          staffName: doc.staffName,
          courseCode: c.courseCode,
          courseName: c.courseName,
          lab: c.lab,
          studentReps: c.studentReps,
          students: c.students,
        });
      }
    }
    res.json(groups);
  } catch {
    res.status(500).json({ error: 'Error fetching course groups' });
  }
});

// POST create or fully replace a faculty's enrollment
// Body: { facultyId, staffName, courses: [{ courseCode, courseName, lab, studentReps?, students? }] }
router.post('/', auth, adminOnly, async (req, res) => {
  const { facultyId, staffName, courses } = req.body;
  if (!facultyId || !staffName || !Array.isArray(courses) || courses.length === 0) {
    return res.status(400).json({ error: 'facultyId, staffName, and courses array are required' });
  }
  for (const c of courses) {
    if (!c.courseCode || !c.courseName || typeof c.lab !== 'boolean') {
      return res.status(400).json({ error: 'Each course needs courseCode, courseName, and lab (boolean)' });
    }
    if (!Array.isArray(c.studentReps)) c.studentReps = [];
    if (!Array.isArray(c.students)) c.students = [];
  }
  try {
    const doc = await Enrollment.findOneAndUpdate(
      { facultyId },
      { facultyId, staffName, courses },
      { upsert: true, new: true }
    );

    // Regenerate weektables for all members so their periods reflect the enrollment
    const memberIds = new Set();
    for (const c of courses) {
      c.studentReps.forEach(id => memberIds.add(id));
      c.students.forEach(id => memberIds.add(id));
    }
    for (const memberId of memberIds) {
      await regenerateWeektablesForUser(memberId);
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Error updating enrollment', details: err.message });
  }
});

// PATCH add/remove members from one specific course
// Body: { addStudents?, removeStudents?, addReps?, removeReps? }
router.patch('/:facultyId/courses/:courseCode', auth, adminOnly, async (req, res) => {
  const { facultyId, courseCode } = req.params;
  const { addStudents = [], removeStudents = [], addReps = [], removeReps = [] } = req.body;
  try {
    const doc = await Enrollment.findOne({ facultyId });
    if (!doc) return res.status(404).json({ error: 'Enrollment not found' });
    const course = doc.courses.find(c => c.courseCode === courseCode);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    addReps.forEach(id => { if (!course.studentReps.includes(id)) course.studentReps.push(id); });
    course.studentReps = course.studentReps.filter(id => !removeReps.includes(id));

    addStudents.forEach(id => { if (!course.students.includes(id)) course.students.push(id); });
    course.students = course.students.filter(id => !removeStudents.includes(id));

    await doc.save();

    // Regenerate for newly added members
    const newMembers = [...addStudents, ...addReps];
    for (const memberId of newMembers) {
      await regenerateWeektablesForUser(memberId);
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Error updating course members', details: err.message });
  }
});

// DELETE all enrollment for a faculty
router.delete('/:facultyId', auth, adminOnly, async (req, res) => {
  try {
    const result = await Enrollment.deleteOne({ facultyId: req.params.facultyId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Enrollment not found' });
    res.json({ message: 'Enrollment deleted' });
  } catch {
    res.status(500).json({ error: 'Error deleting enrollment' });
  }
});

module.exports = router;
