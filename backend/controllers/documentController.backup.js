const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const puppeteer = require('puppeteer');
const multer = require('multer');

// Function to add signature section to Word document data
const addSignatureSectionToData = (data, includeSignature = false) => {
    const signatureData = {
        ...data,
        signature_section: {
            include_signature: includeSignature,
            has_digital_signature: includeSignature && currentSignatureFile,
            signature_text: includeSignature && currentSignatureFile ? 
                'Digitally Signed' : 
                'Space for Manual Signature',
            signature_placeholder: includeSignature && currentSignatureFile ? 
                '[DIGITAL_SIGNATURE_PLACEHOLDER]' : 
                '[MANUAL_SIGNATURE_SPACE]',
            signature_line: '________________________________',
            authorized_signatory: 'Authorized Signatory',
            date_place: 'Date: _________________ Place: _________________'
        }
    };
    return signatureData;
};

// Function to append signature section to Word document
const appendSignatureSectionToWordDoc = (doc, includeSignature = false) => {
    try {
        // Get the current document content
        const zip = doc.getZip();
        let documentXml = zip.files['word/document.xml'].asText();
        
        // Create signature section XML
        let signatureXml = `
        <w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:pPr>
                <w:pStyle w:val="Normal"/>
                <w:spacing w:before="720" w:after="240"/>
            </w:pPr>
        </w:p>
        <w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:pPr>
                <w:pStyle w:val="Normal"/>
                <w:pBdr>
                    <w:top w:val="single" w:sz="4" w:space="1" w:color="auto"/>
                </w:pBdr>
                <w:spacing w:before="240" w:after="240"/>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:b/>
                    <w:sz w:val="28"/>
                </w:rPr>
                <w:t>Signature Section</w:t>
            </w:r>
        </w:p>
        <w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:pPr>
                <w:spacing w:before="240" w:after="480"/>
            </w:pPr>
            <w:r>
                <w:t>${includeSignature && currentSignatureFile ? 'Digitally Signed:' : 'Space for Manual Signature:'}</w:t>
            </w:r>
        </w:p>`;

        if (includeSignature && currentSignatureFile) {
            signatureXml += `
            <w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                <w:pPr>
                    <w:spacing w:before="120" w:after="240"/>
                </w:pPr>
                <w:r>
                    <w:t>[Digital Signature: ${currentSignatureFile}]</w:t>
                </w:r>
            </w:p>`;
        } else {
            signatureXml += `
            <w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                <w:pPr>
                    <w:spacing w:before="120" w:after="240"/>
                    <w:pBdr>
                        <w:bottom w:val="single" w:sz="6" w:space="1" w:color="000000"/>
                    </w:pBdr>
                </w:pPr>
                <w:r>
                    <w:t>&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;</w:t>
                </w:r>
            </w:p>`;
        }

        signatureXml += `
        <w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:pPr>
                <w:spacing w:before="240" w:after="120"/>
                <w:jc w:val="center"/>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:sz w:val="20"/>
                </w:rPr>
                <w:t>Authorized Signatory</w:t>
            </w:r>
        </w:p>
        <w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:pPr>
                <w:spacing w:before="480" w:after="240"/>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:sz w:val="20"/>
                </w:rPr>
                <w:t>Date: _________________   Place: _________________</w:t>
            </w:r>
        </w:p>`;

        // Find the closing body tag and insert signature section before it
        const bodyEndRegex = /<\/w:body>/;
        documentXml = documentXml.replace(bodyEndRegex, signatureXml + '</w:body>');
        
        // Update the document XML
        zip.file('word/document.xml', documentXml);
        
        return doc;
    } catch (error) {
        console.error('Error appending signature section to Word document:', error);
        return doc; // Return original document if error
    }
};

// Fallback PDF generation function
const generateFallbackPDF = async (data, templateName, includeSignature = false) => {
    let browser;
    try {
        // Get signature image if available and requested
        let signatureHtml = '';
        if (includeSignature && currentSignatureFile) {
            const signaturePath = path.join(__dirname, '../uploads/signatures', currentSignatureFile);
            if (fs.existsSync(signaturePath)) {
                // Convert image to base64 for embedding
                const signatureBuffer = fs.readFileSync(signaturePath);
                const signatureBase64 = signatureBuffer.toString('base64');
                const mimeType = currentSignatureFile.toLowerCase().includes('.png') ? 'image/png' : 
                               currentSignatureFile.toLowerCase().includes('.jpg') || currentSignatureFile.toLowerCase().includes('.jpeg') ? 'image/jpeg' : 
                               'image/png';
                signatureHtml = `<img src="data:${mimeType};base64,${signatureBase64}" style="max-width: 200px; max-height: 100px;" alt="Digital Signature" />`;
            }
        }

        // Create a simple HTML representation of the data
        const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${templateName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .form-data { margin: 20px 0; }
        .form-data div { margin: 10px 0; }
        .label { font-weight: bold; }
        .signature-section { 
            margin-top: 60px; 
            border-top: 1px solid #ddd; 
            padding-top: 30px; 
            page-break-inside: avoid;
        }
        .signature-box { 
            border: 1px solid #000; 
            width: 300px; 
            height: 100px; 
            margin: 20px 0; 
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f9f9f9;
        }
        .signature-line { 
            border-top: 1px solid #000; 
            width: 300px; 
            margin: 40px 0 10px 0; 
        }
    </style>
</head>
<body>
    <h1>${templateName} - Document</h1>
    
    <div class="form-data">
        <h2>Form Data:</h2>
        ${Object.entries(data).filter(([key, value]) => key !== 'items' && value).map(([key, value]) => 
            `<div><span class="label">${key.replace(/_/g, ' ').toUpperCase()}:</span> ${value}</div>`
        ).join('')}
    </div>
    
    ${data.items && data.items.length > 0 ? `
    <h2>Items:</h2>
    <table>
        <thead>
            <tr>
                <th>Sl.No</th>
                <th>Course</th>
                <th>Subject Code</th>
                <th>Candidates</th>
                <th>Date & Session</th>
                <th>Bank Name</th>
                <th>Account No</th>
                <th>IFSC Code</th>
                <th>PAN No</th>
                <th>Claimed Amount</th>
                <th>TDS</th>
                <th>Net Amount</th>
            </tr>
        </thead>
        <tbody>
            ${data.items.map(item => `
                <tr>
                    <td>${item.sl_no || ''}</td>
                    <td>${item.course || ''}</td>
                    <td>${item.subject_code || ''}</td>
                    <td>${item.candidates || ''}</td>
                    <td>${item.date_session || ''}</td>
                    <td>${item.bank_name || ''}</td>
                    <td>${item.account_no || ''}</td>
                    <td>${item.ifsc_code || ''}</td>
                    <td>${item.pan_no || ''}</td>
                    <td>${item.claimed_amount || ''}</td>
                    <td>${item.tds || ''}</td>
                    <td>${item.net_amount || ''}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    ` : ''}
    
    <div style="margin-top: 40px; text-align: right;">
        <p><strong>Total Net Amount: ${data.total_net_amount || '0.00'}</strong></p>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="signature-section">
        <h3>Signature Section</h3>
        ${signatureHtml ? `
            <div>
                <p><strong>Digitally Signed:</strong></p>
                <div style="margin: 20px 0;">${signatureHtml}</div>
            </div>
        ` : `
            <div class="signature-box">
                <span style="color: #666;">Space for Manual Signature</span>
            </div>
        `}
        <div class="signature-line"></div>
        <p style="text-align: center; font-size: 12px; margin-top: 5px;">Authorized Signatory</p>
        
        <div style="margin-top: 30px;">
            <p style="font-size: 12px; color: #666;">
                Date: _________________ &nbsp;&nbsp;&nbsp;&nbsp; Place: _________________
            </p>
        </div>
    </div>
</body>
</html>`;

        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setContent(fallbackHtml, { waitUntil: 'domcontentloaded' });
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' }
        });
        
        await browser.close();
        return pdfBuffer;
        
    } catch (error) {
        if (browser) {
            await browser.close();
        }
        throw error;
    }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/templates');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Use original filename with timestamp prefix to avoid conflicts
        const timestamp = Date.now();
        const originalName = file.originalname;
        cb(null, `${timestamp}-${originalName}`);
    }
});

// Configure multer for signature uploads
const signatureStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/signatures');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Use timestamp-based filename for signature
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `signature-${timestamp}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accept only Word documents
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
        // Accept images and PDFs for signatures
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only image files (PNG, JPG, JPEG) or PDF are allowed for signatures'), false);
        }
    }
});

// Store current signature filename
let currentSignatureFile = null;

const generateDocument = async (req, res) => {
    try {
        const { templatePath, outputFormat, data, includeSignature = false } = req.body;

        // Determine the full path to the template
        let fullTemplatePath;
        if (templatePath.startsWith('/templates/')) {
            // Static template from public folder
            fullTemplatePath = path.join(__dirname, '../../frontend/public', templatePath);
        } else {
            // Uploaded template
            fullTemplatePath = path.join(__dirname, '../uploads/templates', templatePath);
        }

        // Check if template file exists
        if (!fs.existsSync(fullTemplatePath)) {
            return res.status(404).json({ message: 'Template file not found' });
        }

        // Read the template file
        const content = fs.readFileSync(fullTemplatePath, 'binary');
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, { 
            paragraphLoop: true, 
            linebreaks: true 
        });

        // Fill the template with data including signature section
        const enhancedData = addSignatureSectionToData(data, includeSignature);
        doc.setData(enhancedData);

        try {
            doc.render();
        } catch (error) {
            console.error('Error rendering document:', error);
            return res.status(400).json({ 
                message: 'Error rendering document. Please check your template and data.',
                error: error.message 
            });
        }

        // Add signature section to the rendered document
        doc = appendSignatureSectionToWordDoc(doc, includeSignature);

        if (outputFormat === 'pdf') {
            let browser;
            try {
                // Convert to PDF using a more robust approach
                const docxBuffer = doc.getZip().generate({ type: 'nodebuffer' });
                
                // Convert DOCX to HTML with minimal options to avoid issues
                const { value: html } = await mammoth.convertToHtml({ 
                    buffer: docxBuffer
                });

                console.log('HTML conversion completed, HTML length:', html.length);
                
                // Get signature HTML if available and requested
                let signatureHtml = '';
                if (includeSignature && currentSignatureFile) {
                    const signaturePath = path.join(__dirname, '../uploads/signatures', currentSignatureFile);
                    if (fs.existsSync(signaturePath)) {
                        // Convert image to base64 for embedding
                        const signatureBuffer = fs.readFileSync(signaturePath);
                        const signatureBase64 = signatureBuffer.toString('base64');
                        const mimeType = currentSignatureFile.toLowerCase().includes('.png') ? 'image/png' : 
                                       currentSignatureFile.toLowerCase().includes('.jpg') || currentSignatureFile.toLowerCase().includes('.jpeg') ? 'image/jpeg' : 
                                       'image/png';
                        signatureHtml = `
                            <div style="page-break-inside: avoid; margin-top: 60px; border-top: 1px solid #ddd; padding-top: 30px;">
                                <h3>Signature Section</h3>
                                <div>
                                    <p><strong>Digitally Signed:</strong></p>
                                    <div style="margin: 20px 0;">
                                        <img src="data:${mimeType};base64,${signatureBase64}" style="max-width: 200px; max-height: 100px;" alt="Digital Signature" />
                                    </div>
                                </div>
                                <div style="border-top: 1px solid #000; width: 300px; margin: 40px 0 10px 0;"></div>
                                <p style="text-align: center; font-size: 12px; margin-top: 5px;">Authorized Signatory</p>
                                <div style="margin-top: 30px;">
                                    <p style="font-size: 12px; color: #666;">
                                        Date: _________________ &nbsp;&nbsp;&nbsp;&nbsp; Place: _________________
                                    </p>
                                </div>
                            </div>
                        `;
                    }
                } else {
                    // Add space for manual signing
                    signatureHtml = `
                        <div style="page-break-inside: avoid; margin-top: 60px; border-top: 1px solid #ddd; padding-top: 30px;">
                            <h3>Signature Section</h3>
                            <div style="border: 1px solid #000; width: 300px; height: 100px; margin: 20px 0; display: flex; align-items: center; justify-content: center; background-color: #f9f9f9;">
                                <span style="color: #666;">Space for Manual Signature</span>
                            </div>
                            <div style="border-top: 1px solid #000; width: 300px; margin: 40px 0 10px 0;"></div>
                            <p style="text-align: center; font-size: 12px; margin-top: 5px;">Authorized Signatory</p>
                            <div style="margin-top: 30px;">
                                <p style="font-size: 12px; color: #666;">
                                    Date: _________________ &nbsp;&nbsp;&nbsp;&nbsp; Place: _________________
                                </p>
                            </div>
                        </div>
                    `;
                }
                
                // Create a cleaner HTML structure with signature
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
        table, th, td { 
            border: 1px solid #000; 
        }
        th, td { 
            padding: 6px 8px; 
            text-align: left;
            vertical-align: top;
        }
        th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        p { margin: 8px 0; }
        h1, h2, h3 { margin: 12px 0 8px 0; }
        @page {
            margin: 2cm;
            size: A4;
        }
        @media print {
            body { margin: 0; padding: 0; }
        }
    </style>
</head>
<body>${html}${signatureHtml}</body>
</html>`;
                
                console.log('Starting browser launch...');
                
                // Launch browser with minimal configuration
                browser = await puppeteer.launch({
                    headless: 'new',
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--disable-gpu',
                        '--disable-extensions',
                        '--no-first-run'
                    ],
                    timeout: 30000
                });
                
                console.log('Browser launched successfully');
                
                const page = await browser.newPage();
                
                // Set page content with a reasonable timeout
                console.log('Setting page content...');
                await page.setContent(fullHtml, { 
                    waitUntil: 'domcontentloaded',
                    timeout: 15000
                });
                
                console.log('Generating PDF...');
                
                // Generate PDF with conservative settings
                const pdfBuffer = await page.pdf({
                    format: 'A4',
                    printBackground: false,
                    margin: {
                        top: '2cm',
                        right: '2cm',
                        bottom: '2cm',
                        left: '2cm'
                    },
                    timeout: 30000
                });
                
                console.log('PDF generated, size:', pdfBuffer.length, 'bytes');
                
                await browser.close();
                browser = null;
                
                // Validate PDF buffer
                if (!pdfBuffer || pdfBuffer.length === 0) {
                    throw new Error('Generated PDF buffer is empty');
                }
                
                // Additional validation - check if buffer starts with PDF signature
                const pdfSignature = pdfBuffer.slice(0, 4).toString();
                if (pdfSignature !== '%PDF') {
                    throw new Error('Generated buffer is not a valid PDF');
                }
                
                console.log('PDF validation passed');
                
                res.set({
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'attachment; filename="document.pdf"',
                    'Content-Length': pdfBuffer.length,
                    'Cache-Control': 'no-cache'
                });
                res.send(pdfBuffer);
                
            } catch (pdfError) {
                console.error('PDF generation error:', pdfError);
                if (browser) {
                    try {
                        await browser.close();
                    } catch (closeError) {
                        console.error('Error closing browser:', closeError);
                    }
                }
                // Fallback to basic PDF generation
                try {
                    console.log('Attempting fallback PDF generation...');
                    const fallbackPdfBuffer = await generateFallbackPDF(data, 'Document', includeSignature);
                    
                    res.set({
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': 'attachment; filename="document_fallback.pdf"',
                        'Content-Length': fallbackPdfBuffer.length,
                        'Cache-Control': 'no-cache'
                    });
                    return res.send(fallbackPdfBuffer);
                    
                } catch (fallbackError) {
                    console.error('Fallback PDF generation error:', fallbackError);
                    return res.status(500).json({ 
                        message: 'Error generating PDF: ' + pdfError.message,
                        error: pdfError.message 
                    });
                }
            }
        } else {
            // Return DOCX
            try {
                const docxBuffer = doc.getZip().generate({ 
                    type: 'nodebuffer',
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                });
                
                // Validate DOCX buffer
                if (!docxBuffer || docxBuffer.length === 0) {
                    throw new Error('Generated DOCX buffer is empty');
                }
                
                res.set({
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'Content-Disposition': 'attachment; filename="document.docx"',
                    'Content-Length': docxBuffer.length
                });
                res.send(docxBuffer);
                
            } catch (docxError) {
                console.error('DOCX generation error:', docxError);
                return res.status(500).json({ 
                    message: 'Error generating DOCX',
                    error: docxError.message 
                });
            }
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

        // File is already saved by multer, just respond with success
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
        const uploadedFile = req.file;

        if (!uploadedFile) {
            return res.status(400).json({ message: 'No signature file uploaded' });
        }

        // Update the current signature file
        currentSignatureFile = uploadedFile.filename;

        // Save signature info to a simple file for persistence
        const signatureInfoPath = path.join(__dirname, '../uploads/signatures/current_signature.txt');
        fs.writeFileSync(signatureInfoPath, currentSignatureFile);

        res.json({
            message: 'Digital signature uploaded successfully',
            filename: uploadedFile.filename,
            originalName: uploadedFile.originalname,
            filePath: uploadedFile.path
        });

    } catch (error) {
        console.error('Error uploading signature:', error);
        res.status(500).json({ 
            message: 'Internal server error while uploading signature',
            error: error.message 
        });
    }
};

const getCurrentSignature = async (req, res) => {
    try {
        // Check if there's a current signature
        const signatureInfoPath = path.join(__dirname, '../uploads/signatures/current_signature.txt');
        
        if (fs.existsSync(signatureInfoPath)) {
            const signatureFilename = fs.readFileSync(signatureInfoPath, 'utf8').trim();
            const signaturePath = path.join(__dirname, '../uploads/signatures', signatureFilename);
            
            if (fs.existsSync(signaturePath)) {
                currentSignatureFile = signatureFilename;
                return res.json({
                    signature: signatureFilename,
                    available: true
                });
            }
        }

        res.json({
            signature: null,
            available: false
        });

    } catch (error) {
        console.error('Error getting current signature:', error);
        res.status(500).json({ 
            message: 'Internal server error while getting signature',
            error: error.message 
        });
    }
};

// Load current signature on module initialization
const loadCurrentSignature = () => {
    try {
        const signatureInfoPath = path.join(__dirname, '../uploads/signatures/current_signature.txt');
        if (fs.existsSync(signatureInfoPath)) {
            const signatureFilename = fs.readFileSync(signatureInfoPath, 'utf8').trim();
            const signaturePath = path.join(__dirname, '../uploads/signatures', signatureFilename);
            if (fs.existsSync(signaturePath)) {
                currentSignatureFile = signatureFilename;
                console.log('Loaded current signature:', signatureFilename);
            }
        }
    } catch (error) {
        console.log('No existing signature found or error loading:', error.message);
    }
};

// Initialize signature on module load
loadCurrentSignature();

module.exports = {
    generateDocument,
    uploadTemplate: uploadTemplateHandler,
    uploadSignatureHandler,
    getCurrentSignature,
    upload,
    uploadSignature
};
