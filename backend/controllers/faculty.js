const Faculty = require('../models/Faculty');

const addFaculty = async (req, res) => {
  try {
    const faculty = new Faculty(req.body);
    const savedFaculty = await faculty.save();
    res.status(201).json(savedFaculty);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getAllFaculty = async (req, res) => {
  try {
    const facultyList = await Faculty.find();
    res.json(facultyList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFacultyById = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    res.json(faculty);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateFaculty = async (req, res) => {
  try {
    const updated = await Faculty.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: 'Faculty not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteFaculty = async (req, res) => {
  try {
    const deleted = await Faculty.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Faculty not found' });
    res.json({ message: 'Faculty deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  addFaculty,
  getAllFaculty,
  getFacultyById,
  updateFaculty,
  deleteFaculty
};
