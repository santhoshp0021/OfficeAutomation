const PGScholar = require("../models/PGScholar");

const addPGScholar = async (req, res) => {
  try {
    const scholar = new PGScholar({
      ...req.body,
      supervisor: req.body.supervisor,
    });
    const savedScholar = await scholar.save();
    res.status(201).json(savedScholar);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getAllPGScholars = async (req, res) => {
  try {
    let scholars;

    if (req.user.role === "faculty") {
      scholars = await PGScholar.find({ supervisor: req.user._id }).populate("supervisor", "email");
    } else {
      scholars = await PGScholar.find().populate("supervisor", "email");
    }
    res.json(scholars);
    console.log("Sample scholar:", scholars[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updatePGScholar = async (req, res) => {
  try {
    const scholar = await PGScholar.findById(req.params.id);
    if (!scholar) return res.status(404).json({ message: "Scholar not found" });

    // update only if user is admin or their own supervisor
    console.log("scholar", scholar.supervisor, req.user._id);
    if (
      req.user.role !== "admin" &&
      (!scholar.supervisor ||
        scholar.supervisor.toString() !== req.user._id.toString())
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this scholar" });
    }

    const updated = await PGScholar.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deletePGScholar = async (req, res) => {
  try {
    const deleted = await PGScholar.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Scholar not found" });

    res.json({ message: "Scholar deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  addPGScholar,
  getAllPGScholars,
  updatePGScholar,
  deletePGScholar,
};
