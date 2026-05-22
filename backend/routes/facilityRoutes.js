const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/allFacilities', auth, async (req, res) => {
  try {
    const facilities = await Facility.find({ bookable: true });
    res.json(facilities);
  } catch {
    res.status(500).json({ error: 'Failed to fetch facilities' });
  }
});

router.get('/facilities/projectors', auth, async (req, res) => {
  try {
    const projectors = await Facility.find({ type: 'projector', bookable: true }).select('name type -_id');
    res.json(projectors);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/Facilities', auth, async (req, res) => {
  try {
    const all = await Facility.find();
    res.json(all);
  } catch {
    res.status(500).json({ error: 'Failed to fetch facilities' });
  }
});

router.post('/facilities', auth, adminOnly, async (req, res) => {
  try {
    const { name, type, bookable } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type required' });
    const facility = new Facility({ name, type, bookable: bookable !== false });
    await facility.save();
    res.status(201).json(facility);
  } catch (err) {
    res.status(400).json({ error: 'Failed to add facility', details: err.message });
  }
});

router.put('/facilities/:id', auth, adminOnly, async (req, res) => {
  try {
    const { bookable } = req.body;
    const updated = await Facility.findByIdAndUpdate(
      req.params.id,
      { bookable },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Facility not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update facility', details: err.message });
  }
});

router.delete('/facilities/:id', auth, adminOnly, async (req, res) => {
  try {
    const deleted = await Facility.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Facility not found' });
    res.json({ message: 'Facility deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete facility', details: err.message });
  }
});

module.exports = router;
