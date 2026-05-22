const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');
const Weektable = require('../models/Weektable');
const { getCurrentWeekStart } = require('../utils');
const { auth } = require('../middleware/auth');

router.get('/rooms', auth, async (req, res) => {
  const { periodId } = req.query;
  if (!periodId) return res.status(400).json({ error: 'periodId required' });
  try {
    const weekStart = getCurrentWeekStart();
    const weektables = await Weektable.find({ weekStart });
    const usedRooms = new Set();
    for (const wt of weektables) {
      for (const p of wt.periods) {
        if (p.periodId === periodId && p.roomNo) usedRooms.add(p.roomNo.trim().toLowerCase());
      }
    }
    const allRooms = await Facility.find({ type: 'room', bookable: true });
    res.json(allRooms.map(r => ({
      name: r.name,
      type: r.type,
      free: !usedRooms.has(r.name.trim().toLowerCase())
    })));
  } catch (err) {
    res.status(500).json({ error: 'Error fetching rooms', details: err.message });
  }
});

router.get('/labs', auth, async (req, res) => {
  const { periodId } = req.query;
  if (!periodId) return res.status(400).json({ error: 'periodId required' });
  try {
    const weekStart = getCurrentWeekStart();
    const weektables = await Weektable.find({ weekStart });
    const usedLabs = new Set();
    for (const wt of weektables) {
      for (const p of wt.periods) {
        if (p.periodId === periodId && p.lab) usedLabs.add(p.lab.trim().toLowerCase());
      }
    }
    const allLabs = await Facility.find({ type: 'lab', bookable: true });
    res.json(allLabs.map(l => ({
      name: l.name,
      type: l.type,
      free: !usedLabs.has(l.name.trim().toLowerCase())
    })));
  } catch (err) {
    res.status(500).json({ error: 'Error fetching labs', details: err.message });
  }
});

router.get('/projectors', auth, async (req, res) => {
  const { periodId } = req.query;
  if (!periodId) return res.status(400).json({ error: 'periodId required' });
  try {
    const weekStart = getCurrentWeekStart();
    const weektables = await Weektable.find({ weekStart });
    const usedProjectors = new Set();
    for (const wt of weektables) {
      for (const p of wt.periods) {
        if (p.periodId === periodId && p.projector?.trim()) {
          usedProjectors.add(p.projector.trim().toLowerCase());
        }
      }
    }
    res.json(Array.from(usedProjectors).map(name => ({ name, type: 'projector' })));
  } catch (err) {
    res.status(500).json({ error: 'Error fetching projector status', details: err.message });
  }
});

module.exports = router;
