const express = require('express');
const router = express.Router();
const {
  addPGScholar,
  getAllPGScholars,
  updatePGScholar,
  deletePGScholar
} = require('../controllers/pgScholarController');
const { restrictTo } = require('../middleware/roleAccess'); 


// Route: /api/pgscholars
router.post('/', restrictTo('faculty'), addPGScholar);
router.get('/', restrictTo('faculty','hod', 'admin'), getAllPGScholars);
router.put('/:id', restrictTo('faculty'), updatePGScholar);
router.delete('/:id', restrictTo('faculty'), deletePGScholar);

module.exports = router;
