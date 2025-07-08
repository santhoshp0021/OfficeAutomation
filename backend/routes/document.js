const express = require('express');
const router = express.Router();
const { 
    generateDocument, 
    uploadTemplate, 
    uploadSignatureHandler, 
    getSignatures, 
    getSignatureRoles, 
    upload, 
    uploadSignature,
    validateLogo,
    getHeaderInfo,
    processPDFHeaders
} = require('../controllers/documentController');

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

// @route   GET /api/signature-roles
// @desc    Get available signature roles and template requirements
// @access  Public (but should be protected in production)
router.get('/signature-roles', getSignatureRoles);

// @route   GET /api/signatures
// @desc    Get all available signatures by role
// @access  Public (but should be protected in production)
router.get('/signatures', getSignatures);

// @route   GET /api/validate-logo
// @desc    Validate the logo file
// @access  Public (but should be protected in production)
router.get('/validate-logo', validateLogo);

// @route   GET /api/header-info
// @desc    Get header information for templates
// @access  Public (but should be protected in production)
router.get('/header-info', getHeaderInfo);

// @route   POST /api/process-pdf-headers
// @desc    Process PDF templates to extract headers
// @access  Public (but should be protected in production)
router.post('/process-pdf-headers', processPDFHeaders);

// Legacy route for backward compatibility
router.get('/current-signature', getSignatures);

module.exports = router;
