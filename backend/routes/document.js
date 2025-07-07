const express = require('express');
const router = express.Router();
const { generateDocument, uploadTemplate, uploadSignatureHandler, getSignatures, upload, uploadSignature } = require('../controllers/documentController');

// @route   POST /api/generate-document
// @desc    Generate a document (DOCX or PDF) from template
// @access  Public (but should be protected in production)
router.post('/generate-document', generateDocument);

// @route   POST /api/upload-template
// @desc    Upload a new template file
// @access  Public (but should be protected in production)
router.post('/upload-template', upload.single('template'), uploadTemplate);

// @route   POST /api/upload-signature
// @desc    Upload a digital signature for a specific role
// @access  Public (but should be protected in production)
router.post('/upload-signature', uploadSignature.single('signature'), uploadSignatureHandler);

// @route   GET /api/signatures
// @desc    Get all available signatures by role
// @access  Public (but should be protected in production)
router.get('/signatures', getSignatures);

// Legacy route for backward compatibility
router.get('/current-signature', getSignatures);

module.exports = router;
