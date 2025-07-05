const express = require('express');
const router = express.Router();
const {
  addPublication,
  getAllPublications,
  updatePublication,
  deletePublication,
  fetchPublications,
  fetchAndStorePublications
} = require('../controllers/publicationController');
const { restrictTo } = require('../middleware/roleAccess');  

// Route: /api/publications
router.post('/', restrictTo('faculty'), addPublication);
router.get('/', restrictTo('faculty','hod', 'admin'), getAllPublications);
router.put('/:id', restrictTo('faculty'), updatePublication);
router.delete('/:id', restrictTo('faculty'), deletePublication);
router.get('/fetch', restrictTo('faculty'), fetchPublications);
router.get('/fetch-and-store', restrictTo('faculty'), fetchAndStorePublications);

module.exports = router;
