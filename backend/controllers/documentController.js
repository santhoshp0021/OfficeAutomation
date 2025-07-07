const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const puppeteer = require('puppeteer');
const multer = require('multer');

// Configure multer for template uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/templates');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const originalName = file.originalname;
        cb(null, `${timestamp}-${originalName}`);
    }
});

// Configure multer for signature uploads
const signatureStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/signatures');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `signature-${timestamp}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.mimetype === 'application/msword') {
            cb(null, true);
        } else {
            cb(new Error('Only Word documents (.doc, .docx) are allowed'), false);
        }
    }
});

const uploadSignature = multer({ 
    storage: signatureStorage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only image files (PNG, JPG, JPEG) or PDF are allowed for signatures'), false);
        }
    }
});

// Store multiple signatures by role
let signaturesByRole = {
    coordinator: null,
    supervisor: null,
    external_examiner: null,
    admin: null
};

// Load signatures on startup
const loadSignatures = () => {
    try {
        const signaturesPath = path.join(__dirname, '../uploads/signatures/signatures.json');
        if (fs.existsSync(signaturesPath)) {
            const data = JSON.parse(fs.readFileSync(signaturesPath, 'utf8'));
            signaturesByRole = { ...signaturesByRole, ...data };
            console.log('Loaded signatures:', Object.keys(signaturesByRole).filter(key => signaturesByRole[key]));
        }
    } catch (error) {
        console.log('No existing signatures found or error loading:', error.message);
    }
};

// Save signatures to file
const saveSignatures = () => {
    try {
        const signaturesPath = path.join(__dirname, '../uploads/signatures/signatures.json');
        fs.writeFileSync(signaturesPath, JSON.stringify(signaturesByRole, null, 2));
    } catch (error) {
        console.error('Error saving signatures:', error);
    }
};

// Add signature section data to template data
const addSignatureData = (data, includeSignatures = true) => {
    const signatureData = { ...data };
    
    if (includeSignatures) {
        // Add signature section
        signatureData.signature_section = `

SIGNATURE SECTION
_________________

Coordinator: ${signaturesByRole.coordinator ? 'Digitally Signed' : '_________________________'}
Date: ____________    Place: ____________

Supervisor: ${signaturesByRole.supervisor ? 'Digitally Signed' : '_________________________'}
Date: ____________    Place: ____________

External Examiner: ${signaturesByRole.external_examiner ? 'Digitally Signed' : '_________________________'}
Date: ____________    Place: ____________

Admin: ${signaturesByRole.admin ? 'Digitally Signed' : '_________________________'}
Date: ____________    Place: ____________
`;
    }
    
    return signatureData;
};

// Generate signature HTML for PDF (Fixed version)
const generateSignatureHTML = (includeSignatures = true) => {
    let signatureHTML = `
        <div style="page-break-inside: avoid; margin-top: 60px; border-top: 1px solid #ddd; padding-top: 30px;">
            <h3>Signature Section</h3>
            <table style="width: 100%; border: none; margin: 30px 0;">
                <tr>
                    <td style="width: 50%; vertical-align: top; border: none; padding: 10px;">
    `;

    // Add each role's signature using table layout instead of CSS Grid
    const roles = [
        { key: 'coordinator', label: 'Coordinator' },
        { key: 'supervisor', label: 'Supervisor' },
        { key: 'external_examiner', label: 'External Examiner' },
        { key: 'admin', label: 'Admin' }
    ];

    let isFirstColumn = true;

    roles.forEach((role, index) => {
        if (index === 2) {
            // Close first column and start second column
            signatureHTML += `
                    </td>
                    <td style="width: 50%; vertical-align: top; border: none; padding: 10px;">
            `;
            isFirstColumn = false;
        }

        if (includeSignatures && signaturesByRole[role.key]) {
            const signaturePath = path.join(__dirname, '../uploads/signatures', signaturesByRole[role.key]);
            if (fs.existsSync(signaturePath)) {
                try {
                    const signatureBuffer = fs.readFileSync(signaturePath);
                    // Limit signature size to prevent corruption
                    if (signatureBuffer.length > 500000) { // 500KB limit
                        console.warn(`Signature file ${signaturesByRole[role.key]} is too large, using placeholder`);
                        signatureHTML += `
                            <div style="margin-bottom: 30px;">
                                <div style="border: 1px solid #000; height: 60px; margin: 10px 0; background-color: #f9f9f9; text-align: center; line-height: 60px;">
                                    <span style="color: #666; font-size: 12px;">${role.label} - Signature Too Large</span>
                                </div>
                                <div style="border-top: 1px solid #000; width: 200px; margin: 10px 0;"></div>
                                <p style="text-align: center; font-size: 12px; margin: 5px 0;">${role.label}</p>
                                <p style="font-size: 10px; color: #666; margin: 5px 0;">Date: _______ Place: _______</p>
                            </div>
                        `;
                    } else {
                        const signatureBase64 = signatureBuffer.toString('base64');
                        let mimeType = 'image/jpeg'; // default
                        const filename = signaturesByRole[role.key].toLowerCase();
                        if (filename.includes('.png')) {
                            mimeType = 'image/png';
                        } else if (filename.includes('.gif')) {
                            mimeType = 'image/gif';
                        } else if (filename.includes('.webp')) {
                            mimeType = 'image/webp';
                        }
                        
                        signatureHTML += `
                            <div style="margin-bottom: 30px;">
                                <div style="margin: 10px 0; text-align: center;">
                                    <img src="data:${mimeType};base64,${signatureBase64}" style="max-width: 180px; max-height: 60px; border: 1px solid #ccc; object-fit: contain;" alt="${role.label} Signature" />
                                </div>
                                <div style="border-top: 1px solid #000; width: 200px; margin: 10px 0;"></div>
                                <p style="text-align: center; font-size: 12px; margin: 5px 0;">${role.label}</p>
                                <p style="font-size: 10px; color: #666; margin: 5px 0;">Date: _______ Place: _______</p>
                            </div>
                        `;
                    }
                } catch (error) {
                    console.error(`Error reading signature file: ${error.message}`);
                    signatureHTML += `
                        <div style="margin-bottom: 30px;">
                            <div style="border: 1px solid #000; height: 60px; margin: 10px 0; background-color: #f9f9f9; text-align: center; line-height: 60px;">
                                <span style="color: #666; font-size: 12px;">${role.label} Signature</span>
                            </div>
                            <div style="border-top: 1px solid #000; width: 200px; margin: 10px 0;"></div>
                            <p style="text-align: center; font-size: 12px; margin: 5px 0;">${role.label}</p>
                            <p style="font-size: 10px; color: #666; margin: 5px 0;">Date: _______ Place: _______</p>
                        </div>
                    `;
                }
            } else {
                signatureHTML += `
                    <div style="margin-bottom: 30px;">
                        <div style="border: 1px solid #000; height: 60px; margin: 10px 0; background-color: #f9f9f9; text-align: center; line-height: 60px;">
                            <span style="color: #666; font-size: 12px;">${role.label} Signature</span>
                        </div>
                        <div style="border-top: 1px solid #000; width: 200px; margin: 10px 0;"></div>
                        <p style="text-align: center; font-size: 12px; margin: 5px 0;">${role.label}</p>
                        <p style="font-size: 10px; color: #666; margin: 5px 0;">Date: _______ Place: _______</p>
                    </div>
                `;
            }
        } else {
            signatureHTML += `
                <div style="margin-bottom: 30px;">
                    <div style="border: 1px solid #000; height: 60px; margin: 10px 0; background-color: #f9f9f9; text-align: center; line-height: 60px;">
                        <span style="color: #666; font-size: 12px;">${role.label} Signature</span>
                    </div>
                    <div style="border-top: 1px solid #000; width: 200px; margin: 10px 0;"></div>
                    <p style="text-align: center; font-size: 12px; margin: 5px 0;">${role.label}</p>
                    <p style="font-size: 10px; color: #666; margin: 5px 0;">Date: _______ Place: _______</p>
                </div>
            `;
        }
    });

    signatureHTML += `
                    </td>
                </tr>
            </table>
        </div>
    `;

    return signatureHTML;
};

const generateDocument = async (req, res) => {
    try {
        const { templatePath, outputFormat, data, includeSignature = true } = req.body;

        // Determine the full path to the template
        let fullTemplatePath;
        if (templatePath.startsWith('/templates/')) {
            fullTemplatePath = path.join(__dirname, '../../frontend/public', templatePath);
        } else {
            fullTemplatePath = path.join(__dirname, '../uploads/templates', templatePath);
        }

        if (!fs.existsSync(fullTemplatePath)) {
            return res.status(404).json({ message: 'Template file not found' });
        }

        // Add signature data to template data
        const enrichedData = addSignatureData(data, includeSignature);

        // Read and process the template
        const content = fs.readFileSync(fullTemplatePath, 'binary');
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, { 
            paragraphLoop: true, 
            linebreaks: true 
        });

        try {
            doc.render(enrichedData);
        } catch (error) {
            console.error('Error rendering document:', error);
            return res.status(400).json({ 
                message: 'Error rendering document. Please check your template and data.',
                error: error.message 
            });
        }

        if (outputFormat === 'pdf') {
            try {
                const docxBuffer = doc.getZip().generate({ type: 'nodebuffer' });
                const { value: html } = await mammoth.convertToHtml({ buffer: docxBuffer });

                const signatureHTML = generateSignatureHTML(includeSignature);
                const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: 'Times New Roman', serif; 
            margin: 0; 
            padding: 30px;
            line-height: 1.4;
            color: #000;
        }
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 15px 0;
            font-size: 12px;
        }
        table, th, td { border: 1px solid #000; }
        th, td { 
            padding: 6px 8px; 
            text-align: left;
            vertical-align: top;
        }
        th { background-color: #f5f5f5; font-weight: bold; }
        p { margin: 8px 0; }
        h1, h2, h3 { margin: 12px 0 8px 0; }
        @page { margin: 2cm; size: A4; }
        @media print { body { margin: 0; padding: 0; } }
    </style>
</head>
<body>${html}${signatureHTML}</body>
</html>`;

                const browser = await puppeteer.launch({
                    headless: 'new',
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
                
                const page = await browser.newPage();
                await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });
                
                const pdfBuffer = await page.pdf({
                    format: 'A4',
                    printBackground: false,
                    margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' }
                });
                
                await browser.close();

                // Convert Uint8Array to Buffer if needed
                const buffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);

                res.set({
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'attachment; filename="document.pdf"',
                    'Content-Length': buffer.length
                });
                res.send(buffer);

            } catch (error) {
                console.error('PDF generation error:', error);
                return res.status(500).json({ 
                    message: 'Error generating PDF',
                    error: error.message 
                });
            }
        } else {
            // Return DOCX
            const docxBuffer = doc.getZip().generate({ type: 'nodebuffer' });
            
            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': 'attachment; filename="document.docx"',
                'Content-Length': docxBuffer.length
            });
            res.send(docxBuffer);
        }

    } catch (error) {
        console.error('Error generating document:', error);
        res.status(500).json({ 
            message: 'Internal server error while generating document',
            error: error.message 
        });
    }
};

const uploadTemplateHandler = async (req, res) => {
    try {
        const { templateName } = req.body;
        const uploadedFile = req.file;

        if (!uploadedFile) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!templateName || !templateName.trim()) {
            return res.status(400).json({ message: 'Template name is required' });
        }

        res.json({
            message: 'Template uploaded successfully',
            templateName: templateName.trim(),
            fileName: uploadedFile.filename,
            originalName: uploadedFile.originalname,
            filePath: uploadedFile.path
        });

    } catch (error) {
        console.error('Error uploading template:', error);
        res.status(500).json({ 
            message: 'Internal server error while uploading template',
            error: error.message 
        });
    }
};

const uploadSignatureHandler = async (req, res) => {
    try {
        const { role } = req.body; // coordinator, supervisor, external_examiner, admin
        const uploadedFile = req.file;

        if (!uploadedFile) {
            return res.status(400).json({ message: 'No signature file uploaded' });
        }

        if (!role || !['coordinator', 'supervisor', 'external_examiner', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Valid role is required (coordinator, supervisor, external_examiner, admin)' });
        }

        // Update the signature for the specific role
        signaturesByRole[role] = uploadedFile.filename;
        saveSignatures();

        res.json({
            message: `Digital signature uploaded successfully for ${role}`,
            role: role,
            filename: uploadedFile.filename,
            originalName: uploadedFile.originalname
        });

    } catch (error) {
        console.error('Error uploading signature:', error);
        res.status(500).json({ 
            message: 'Internal server error while uploading signature',
            error: error.message 
        });
    }
};

const getSignatures = async (req, res) => {
    try {
        const availableSignatures = {};
        Object.keys(signaturesByRole).forEach(role => {
            if (signaturesByRole[role]) {
                const signaturePath = path.join(__dirname, '../uploads/signatures', signaturesByRole[role]);
                availableSignatures[role] = {
                    filename: signaturesByRole[role],
                    exists: fs.existsSync(signaturePath)
                };
            } else {
                availableSignatures[role] = null;
            }
        });

        res.json({
            signatures: availableSignatures
        });

    } catch (error) {
        console.error('Error getting signatures:', error);
        res.status(500).json({ 
            message: 'Internal server error while getting signatures',
            error: error.message 
        });
    }
};

// Initialize signatures on module load
loadSignatures();

module.exports = {
    generateDocument,
    uploadTemplate: uploadTemplateHandler,
    uploadSignatureHandler,
    getSignatures,
    upload,
    uploadSignature
};
