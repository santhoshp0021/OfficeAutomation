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
const {
  verifyToken,
  requireRole,
  requireRoles,
} = require("../middleware/auth");

// Route: /api/publications
router.post('/', verifyToken, requireRole('faculty'), addPublication);
router.get('/', verifyToken, requireRoles('faculty','hod', 'admin'), getAllPublications);
router.put('/:id', verifyToken, requireRole('faculty'), updatePublication);
router.delete('/:id', verifyToken, requireRole('faculty'), deletePublication);
router.get('/fetch', verifyToken, requireRole('faculty'), fetchPublications);
router.get('/fetch-and-store', verifyToken, requireRole('faculty'), fetchAndStorePublications);

module.exports = router;
