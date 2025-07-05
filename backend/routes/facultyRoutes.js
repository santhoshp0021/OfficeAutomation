const express = require("express");
const router = express.Router();
const {
  addFaculty,
  getAllFaculty,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
} = require("../controllers/faculty");

router.post("/", addFaculty);
router.get("/", getAllFaculty);
router.get("/:id", getFacultyById);
router.put("/:id", updateFaculty);
router.delete("/:id", deleteFaculty);

module.exports = router;
