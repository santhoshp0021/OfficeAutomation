const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const puppeteer = require('puppeteer');
const multer = require('multer');
const HeaderManager = require('../utils/headerManager');
const TemplateEnhancer = require('../utils/templateEnhancer');

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
    admin: null,
    chief_superintendent: null,
    head_of_department: null,
    chairman: null,
    project_coordinator: null
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

// Initialize header manager
const headerManager = new HeaderManager();

// Initialize template enhancer
const templateEnhancer = new TemplateEnhancer();

// Load signatures and process headers on startup
const initializeSystem = async () => {
    loadSignatures();
    try {
        await headerManager.processAllPDFTemplates();
        console.log('Header manager initialized successfully');
    } catch (error) {
        console.error('Error initializing header manager:', error);
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

// Template-specific field and signature requirements mapping
const templateSignatureMapping = {
    'template1.docx': {
        signatures: ['chief_superintendent', 'head_of_department'],
        layout: 'horizontal',
        requiredFields: [
            'sl_no', 'course', 'subject_code', 'candidates', 'date_session',
            'bank_name', 'account_no', 'ifsc_code', 'pan_no', 'claimed_amount',
            'tds', 'net_amount', 'total_net_amount', 'passed_for_rs', 
            'passed_for_words', 'tds_amount_rs', 'tds_amount_words'
        ],
        description: 'Honorarium for Internal Examiner'
    },
    'Viva claim External Examiner.docx': {
        signatures: ['external_examiner', 'chief_superintendent', 'head_of_department'],
        layout: 'vertical',
        requiredFields: [
            'examiner_name', 'designation', 'department', 'branch', 'semester',
            'course_name', 'course_code', 'thesis_evaluation_fee', 'rate_per_student',
            'num_students', 'total_amount', 'date', 'campus'
        ],
        description: 'Claim Form for Project Work II - External Examiner'
    },
    'Viva claim supervisor.docx': {
        signatures: ['supervisor', 'chief_superintendent', 'head_of_department'],
        layout: 'vertical',
        requiredFields: [
            'sl_no', 'course', 'subject_code', 'supervisor_name', 'candidates',
            'bank_name', 'account_no', 'ifsc_code', 'pan_no', 'claimed_amount',
            'tds', 'net_amount', 'department', 'campus'
        ],
        description: 'Honorarium for Guide/Supervisor'
    },
    'Viva External member choice - letter to Chairman.docx': {
        signatures: ['chairman'],
        layout: 'single',
        requiredFields: [
            'department', 'session_date', 'batch_numbers', 'student_register_numbers',
            'student_names', 'external_panel_members'
        ],
        description: 'List of External Examiners for Chairman Approval'
    },
    'Viva Letter to external.doc': {
        signatures: ['head_of_department'],
        layout: 'single',
        requiredFields: [
            'external_examiner_name', 'external_examiner_designation', 
            'external_examiner_institution', 'viva_date', 'viva_time',
            'department', 'course_details', 'contact_person', 'contact_phone'
        ],
        description: 'Formal Invitation Letter to External Examiner'
    }
};

// Get template name from path
const getTemplateName = (templatePath) => {
    if (templatePath.startsWith('/templates/')) {
        return templatePath.replace('/templates/', '');
    }
    return templatePath.split('/').pop() || templatePath.split('\\').pop() || templatePath;
};
// Add signature section data to template data
const addSignatureData = (data, includeSignatures = true, templatePath = '') => {
    const signatureData = { ...data };
    
    // Get template-specific configuration
    const templateName = getTemplateName(templatePath);
    const templateConfig = templateSignatureMapping[templateName];
    
    // Handle template1.docx special case - it needs items array for loop
    if (templateName === 'template1.docx') {
        // Create items array from the provided data
        const itemData = {};
        templateConfig.requiredFields.forEach(field => {
            itemData[field] = signatureData[field] || '';
        });
        
        // If this is multiple entries, split by commas or newlines
        const hasMultipleEntries = signatureData.multiple_entries === true || 
                                  (signatureData.course && signatureData.course.includes(',')) ||
                                  (signatureData.sl_no && signatureData.sl_no.includes(','));
        
        if (hasMultipleEntries) {
            // Handle multiple entries
            const courses = (signatureData.course || '').split(/[,\n]/).map(s => s.trim()).filter(s => s);
            const slNos = (signatureData.sl_no || '').split(/[,\n]/).map(s => s.trim()).filter(s => s);
            const subjectCodes = (signatureData.subject_code || '').split(/[,\n]/).map(s => s.trim()).filter(s => s);
            const candidates = (signatureData.candidates || '').split(/[,\n]/).map(s => s.trim()).filter(s => s);
            const dateSessions = (signatureData.date_session || '').split(/[,\n]/).map(s => s.trim()).filter(s => s);
            
            const maxLength = Math.max(courses.length, slNos.length, subjectCodes.length, candidates.length, dateSessions.length, 1);
            
            signatureData.items = [];
            for (let i = 0; i < maxLength; i++) {
                signatureData.items.push({
                    sl_no: slNos[i] || (i + 1).toString(),
                    course: courses[i] || signatureData.course || '',
                    subject_code: subjectCodes[i] || signatureData.subject_code || '',
                    candidates: candidates[i] || signatureData.candidates || '',
                    date_session: dateSessions[i] || signatureData.date_session || '',
                    // Financial fields remain the same for all items
                    bank_name: signatureData.bank_name || '',
                    account_no: signatureData.account_no || '',
                    ifsc_code: signatureData.ifsc_code || '',
                    pan_no: signatureData.pan_no || '',
                    claimed_amount: signatureData.claimed_amount || '',
                    tds: signatureData.tds || '',
                    net_amount: signatureData.net_amount || ''
                });
            }
        } else {
            // Single entry
            signatureData.items = [itemData];
        }
        
        // Financial summary fields (outside the loop)
        signatureData.total_net_amount = signatureData.total_net_amount || '';
        signatureData.passed_for_rs = signatureData.passed_for_rs || '';
        signatureData.passed_for_words = signatureData.passed_for_words || '';
        signatureData.tds_amount_rs = signatureData.tds_amount_rs || '';
        signatureData.tds_amount_words = signatureData.tds_amount_words || '';
    } else if (templateName === 'Viva External member choice - letter to Chairman.docx') {
        // Handle Chairman letter template with multiple students
        if (signatureData.students && Array.isArray(signatureData.students)) {
            // Students array already provided
            signatureData.students = signatureData.students;
        } else if (signatureData.multiple_entries === true) {
            // Convert comma-separated values to students array
            const studentNames = (signatureData.student_names || '').split(/[,\n]/).map(s => s.trim()).filter(s => s);
            const registerNumbers = (signatureData.student_register_numbers || '').split(/[,\n]/).map(s => s.trim()).filter(s => s);
            const batchNumbers = (signatureData.batch_numbers || '').split(/[,\n]/).map(s => s.trim()).filter(s => s);
            const externalMembers = (signatureData.external_panel_members || '').split(/[,\n]/).map(s => s.trim()).filter(s => s);
            
            const maxLength = Math.max(studentNames.length, registerNumbers.length, batchNumbers.length, externalMembers.length, 1);
            
            signatureData.students = [];
            for (let i = 0; i < maxLength; i++) {
                signatureData.students.push({
                    sl_no: i + 1,
                    batch_no: batchNumbers[i] || '',
                    register_number: registerNumbers[i] || '',
                    student_name: studentNames[i] || '',
                    external_panel_member: externalMembers[i] || ''
                });
            }
        } else {
            // Single student entry
            signatureData.students = [{
                sl_no: 1,
                batch_no: signatureData.batch_numbers || '',
                register_number: signatureData.student_register_numbers || '',
                student_name: signatureData.student_names || '',
                external_panel_member: signatureData.external_panel_members || ''
            }];
        }
        
        // Ensure other required fields exist
        signatureData.course = signatureData.course || 'M.E CSE';
        signatureData.semester = signatureData.semester || 'IV';
        signatureData.date = signatureData.date || '';
    } else if (templateName === 'Viva claim supervisor.docx') {
        // Handle supervisor template with potential multiple courses
        if (signatureData.multiple_entries === true) {
            // Convert comma-separated values to courses array
            const courses = (signatureData.course || '').split(/[,\n]/).map(s => s.trim()).filter(s => s);
            const subjectCodes = (signatureData.subject_code || '').split(/[,\n]/).map(s => s.trim()).filter(s => s);
            const candidatesList = (signatureData.candidates || '').split(/[,\n]/).map(s => s.trim()).filter(s => s);
            
            const maxLength = Math.max(courses.length, subjectCodes.length, candidatesList.length, 1);
            
            signatureData.courses = [];
            for (let i = 0; i < maxLength; i++) {
                signatureData.courses.push({
                    sl_no: i + 1,
                    course: courses[i] || signatureData.course || 'Project Work II',
                    subject_code: subjectCodes[i] || signatureData.subject_code || 'CP3411',
                    candidates: candidatesList[i] || signatureData.candidates || '',
                    supervisor_name: signatureData.supervisor_name || '',
                    claimed_amount: signatureData.claimed_amount || '',
                    tds: signatureData.tds || '',
                    net_amount: signatureData.net_amount || ''
                });
            }
        } else {
            // Single course entry
            signatureData.courses = [{
                sl_no: 1,
                course: signatureData.course || 'Project Work II',
                subject_code: signatureData.subject_code || 'CP3411',
                candidates: signatureData.candidates || '',
                supervisor_name: signatureData.supervisor_name || '',
                claimed_amount: signatureData.claimed_amount || '',
                tds: signatureData.tds || '',
                net_amount: signatureData.net_amount || ''
            }];
        }
        
        // Financial details remain the same
        signatureData.bank_name = signatureData.bank_name || '';
        signatureData.account_no = signatureData.account_no || '';
        signatureData.ifsc_code = signatureData.ifsc_code || '';
        signatureData.pan_no = signatureData.pan_no || '';
    } else if (templateConfig) {
        // For other templates, ensure all required fields exist
        templateConfig.requiredFields.forEach(field => {
            if (signatureData[field] === undefined || signatureData[field] === null || signatureData[field] === '') {
                signatureData[field] = ''; // Completely blank, no placeholder
            }
        });
    }
    
    if (templateConfig && includeSignatures) {
        // Add signature section only if signatures are requested
        const requiredSignatures = templateConfig.signatures;
        let signatureSection = '\n\nSIGNATURE SECTION\n_________________\n\n';
        
        requiredSignatures.forEach(role => {
            const roleLabel = role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            if (signaturesByRole[role]) {
                signatureSection += `${roleLabel}: Digitally Signed\n`;
            } else {
                signatureSection += `${roleLabel}: \n`; // Blank line, no underscores
            }
            signatureSection += 'Date:             Place:         \n\n'; // Blank spaces for date/place
        });
        
        signatureData.signature_section = signatureSection;
    } else if (includeSignatures) {
        // For unknown templates, provide minimal signature section
        signatureData.signature_section = `

SIGNATURE SECTION
_________________

`;
    }
    
    return signatureData;
};

// Generate signature HTML for PDF (Template-specific version)
const generateSignatureHTML = (includeSignatures = true, templatePath = '') => {
    if (!includeSignatures) {
        return '';
    }

    const templateName = getTemplateName(templatePath);
    const templateConfig = templateSignatureMapping[templateName];
    
    if (!templateConfig) {
        return ''; // No signatures for unknown templates
    }

    const requiredSignatures = templateConfig.signatures;
    const layout = templateConfig.layout;

    let signatureHTML = `
        <div style="page-break-inside: avoid; margin-top: 60px; border-top: 1px solid #ddd; padding-top: 30px;">
            <h3>Signature Section</h3>
    `;

    if (layout === 'single') {
        // Single signature layout
        signatureHTML += `<div style="margin: 30px 0; text-align: center;">`;
        const role = requiredSignatures[0];
        signatureHTML += generateSingleSignatureHTML(role, includeSignatures);
        signatureHTML += `</div>`;
    } else if (layout === 'horizontal') {
        // Horizontal layout (2 columns)
        signatureHTML += `
            <table style="width: 100%; border: none; margin: 30px 0;">
                <tr>
                    <td style="width: 50%; vertical-align: top; border: none; padding: 10px;">
        `;
        
        const leftSignatures = requiredSignatures.slice(0, Math.ceil(requiredSignatures.length / 2));
        leftSignatures.forEach(role => {
            signatureHTML += generateSingleSignatureHTML(role, includeSignatures);
        });
        
        signatureHTML += `
                    </td>
                    <td style="width: 50%; vertical-align: top; border: none; padding: 10px;">
        `;
        
        const rightSignatures = requiredSignatures.slice(Math.ceil(requiredSignatures.length / 2));
        rightSignatures.forEach(role => {
            signatureHTML += generateSingleSignatureHTML(role, includeSignatures);
        });
        
        signatureHTML += `
                    </td>
                </tr>
            </table>
        `;
    } else {
        // Vertical layout (all signatures in a single column)
        signatureHTML += `<div style="margin: 30px 0;">`;
        requiredSignatures.forEach(role => {
            signatureHTML += generateSingleSignatureHTML(role, includeSignatures);
        });
        signatureHTML += `</div>`;
    }

    signatureHTML += `</div>`;
    return signatureHTML;
};

// Generate HTML for a single signature
const generateSingleSignatureHTML = (role, includeSignatures = true) => {
    const roleLabel = role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    if (includeSignatures && signaturesByRole[role]) {
        const signaturePath = path.join(__dirname, '../uploads/signatures', signaturesByRole[role]);
        if (fs.existsSync(signaturePath)) {
            try {
                const signatureBuffer = fs.readFileSync(signaturePath);
                // Limit signature size to prevent corruption
                if (signatureBuffer.length > 500000) { // 500KB limit
                    console.warn(`Signature file ${signaturesByRole[role]} is too large, using blank space`);
                    return generateBlankSignatureHTML(roleLabel);
                } else {
                    const signatureBase64 = signatureBuffer.toString('base64');
                    let mimeType = 'image/jpeg'; // default
                    const filename = signaturesByRole[role].toLowerCase();
                    if (filename.includes('.png')) {
                        mimeType = 'image/png';
                    } else if (filename.includes('.gif')) {
                        mimeType = 'image/gif';
                    } else if (filename.includes('.webp')) {
                        mimeType = 'image/webp';
                    }
                    
                    return `
                        <div style="margin-bottom: 30px;">
                            <div style="margin: 10px 0; text-align: center; height: 60px; display: flex; align-items: center; justify-content: center;">
                                <img src="data:${mimeType};base64,${signatureBase64}" style="max-width: 180px; max-height: 60px; object-fit: contain;" alt="${roleLabel} Signature" />
                            </div>
                            <div style="border-top: 1px solid #000; width: 200px; margin: 10px auto;"></div>
                            <p style="text-align: center; font-size: 12px; margin: 5px 0;">${roleLabel}</p>
                            <p style="font-size: 10px; color: #666; margin: 5px 0; text-align: center;">Date: _______ Place: _______</p>
                        </div>
                    `;
                }
            } catch (error) {
                console.error(`Error reading signature file: ${error.message}`);
                return generateBlankSignatureHTML(roleLabel);
            }
        }
    }
    
    // Default blank signature space
    return generateBlankSignatureHTML(roleLabel);
};

// Generate completely blank signature HTML (no borders, no placeholder text in the signature area)
const generateBlankSignatureHTML = (roleLabel) => {
    return `
        <div style="margin-bottom: 30px;">
            <div style="height: 60px; margin: 10px 0;">
                <!-- Completely blank space for manual signature -->
            </div>
            <div style="border-top: 1px solid #000; width: 200px; margin: 10px auto;"></div>
            <p style="text-align: center; font-size: 12px; margin: 5px 0;">${roleLabel}</p>
            <p style="font-size: 10px; color: #666; margin: 5px 0; text-align: center;">Date: _______ Place: _______</p>
        </div>
    `;
};

const generateDocument = async (req, res) => {
    try {
        const { templatePath, outputFormat, data, includeSignature = true } = req.body;
        const templateName = getTemplateName(templatePath);

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

        // Check if this template has template variables
        const buffer = fs.readFileSync(fullTemplatePath);
        const { value: templateText } = await mammoth.extractRawText({ buffer });
        const hasTemplateVariables = templateText.includes('{') && templateText.includes('}');
        
        let html;
        
        if (!hasTemplateVariables) {
            // Handle templates without variables using HTML-based approach
            // First process the data to handle multiple entries
            const processedData = addSignatureData(data, includeSignature, templatePath);
            html = await generateHTMLFromTemplateWithoutVariables(templateName, processedData, templateText);
        } else {
            // Handle templates with variables using docxtemplater
            const enrichedData = addSignatureData(data, includeSignature, templatePath);
            
            const content = fs.readFileSync(fullTemplatePath, 'binary');
            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, { 
                paragraphLoop: true, 
                linebreaks: true 
            });

            try {
                doc.render(enrichedData);
                const docxBuffer = doc.getZip().generate({ type: 'nodebuffer' });
                const result = await mammoth.convertToHtml({ buffer: docxBuffer });
                html = result.value;
            } catch (error) {
                console.error('Error rendering document:', error);
                return res.status(400).json({ 
                    message: 'Error rendering document. Please check your template and data.',
                    error: error.message 
                });
            }
        }

        if (outputFormat === 'pdf') {
            try {
                const signatureHTML = generateSignatureHTML(includeSignature, templatePath);
                const headerHTML = await headerManager.getHeaderForTemplate(templateName);
                const headerStyles = headerManager.getHeaderStyles();
                
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
        .header { text-align: center; font-weight: bold; margin-bottom: 20px; }
        .field { margin: 5px 0; }
        .signature-section { margin-top: 40px; }
        .signature-line { margin: 60px 0; }
        ${headerStyles}
    </style>
</head>
<body>${headerHTML}${html}${signatureHTML}</body>
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

        if (!role || !['coordinator', 'supervisor', 'external_examiner', 'admin', 'chief_superintendent', 'head_of_department', 'chairman', 'project_coordinator'].includes(role)) {
            return res.status(400).json({ message: 'Valid role is required (coordinator, supervisor, external_examiner, admin, chief_superintendent, head_of_department, chairman, project_coordinator)' });
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

// Get available signature roles and template requirements
const getSignatureRoles = async (req, res) => {
    try {
        const roles = Object.keys(signaturesByRole).map(role => ({
            key: role,
            label: role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            hasSignature: !!signaturesByRole[role]
        }));

        const templateRequirements = {};
        Object.keys(templateSignatureMapping).forEach(template => {
            const config = templateSignatureMapping[template];
            templateRequirements[template] = {
                signatures: config.signatures.map(role => ({
                    key: role,
                    label: role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                })),
                layout: config.layout,
                requiredFields: config.requiredFields || [],
                description: config.description || template
            };
        });

        res.json({
            availableRoles: roles,
            templateRequirements: templateRequirements
        });

    } catch (error) {
        console.error('Error getting signature roles:', error);
        res.status(500).json({ 
            message: 'Internal server error while getting signature roles',
            error: error.message 
        });
    }
};

// Header validation endpoint
const validateLogo = async (req, res) => {
    try {
        const logoValidation = await headerManager.validateLogo();
        res.json(logoValidation);
    } catch (error) {
        console.error('Error validating logo:', error);
        res.status(500).json({ 
            message: 'Error validating logo',
            error: error.message 
        });
    }
};

// Get header information endpoint
const getHeaderInfo = async (req, res) => {
    try {
        const { templateName } = req.query;
        const headerHTML = await headerManager.getHeaderForTemplate(templateName || 'default');
        const logoValidation = await headerManager.validateLogo();
        
        res.json({
            hasOfficialHeader: !!headerManager.getOfficialHeader(),
            headerHTML: headerHTML,
            logoValidation: logoValidation,
            extractedHeaders: Array.from(headerManager.extractedHeaders.keys())
        });
    } catch (error) {
        console.error('Error getting header info:', error);
        res.status(500).json({ 
            message: 'Error getting header info',
            error: error.message 
        });
    }
};

// Process PDF templates for header extraction
const processPDFHeaders = async (req, res) => {
    try {
        const results = await headerManager.processAllPDFTemplates();
        res.json({
            message: 'PDF templates processed successfully',
            extractedHeaders: results
        });
    } catch (error) {
        console.error('Error processing PDF headers:', error);
        res.status(500).json({ 
            message: 'Error processing PDF headers',
            error: error.message 
        });
    }
};

// Initialize signatures and header manager on module load
initializeSystem();

module.exports = {
    generateDocument,
    uploadTemplate: uploadTemplateHandler,
    uploadSignatureHandler,
    getSignatures,
    upload,
    uploadSignature,
    getSignatureRoles,
    validateLogo,
    getHeaderInfo,
    processPDFHeaders
};

// Generate HTML from templates that don't have template variables
const generateHTMLFromTemplateWithoutVariables = async (templateName, data, originalText) => {
    if (templateName === 'Viva claim External Examiner.docx') {
        const html = `
            <div class="header">
                <p><strong>OFFICE OF THE ADDITIONAL CONTROLLER OF EXAMINATIONS (UNIVERSITY DEPARTMENTS)</strong></p>
                <p><strong>ANNA UNIVERSITY: CHENNAI 25. &nbsp;&nbsp;&nbsp;&nbsp; Claim Form for Project Work II - External Examiner</strong></p>
                <p><strong>PG End Semester Examinations…May 2025…</strong></p>
            </div>

            <div class="field">Name: <strong>${data.examiner_name || '_____________________'}</strong></div>
            <div class="field">Designation: <strong>${data.designation || '_____________________'}</strong></div>
            <div class="field">Department: <strong>${data.department || '_____________________'}</strong></div>
            <div class="field">Branch: <strong>${data.branch || '_____________________'}</strong></div>
            <div class="field">Semester: <strong>${data.semester || '_____________________'}</strong></div>
            <div class="field">Course Name & Course Code: <strong>${data.course_name || '_____________________'} - ${data.course_code || '_____________________'}</strong></div>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #000;">
                <tr>
                    <th style="border: 1px solid #000; padding: 8px; text-align: center;">SI. No</th>
                    <th style="border: 1px solid #000; padding: 8px; text-align: center;">Description</th>
                    <th style="border: 1px solid #000; padding: 8px; text-align: center;">Rate per Student</th>
                    <th style="border: 1px solid #000; padding: 8px; text-align: center;">No. of Students</th>
                    <th style="border: 1px solid #000; padding: 8px; text-align: center;">Amount (Rs.)</th>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 8px; text-align: center;">1</td>
                    <td style="border: 1px solid #000; padding: 8px;">Thesis Evaluation Fee</td>
                    <td style="border: 1px solid #000; padding: 8px; text-align: center;">Rs.${data.rate_per_student || '150'}/-</td>
                    <td style="border: 1px solid #000; padding: 8px; text-align: center;">${data.num_students || '_____'}</td>
                    <td style="border: 1px solid #000; padding: 8px; text-align: center;">${data.total_amount || '_____'}</td>
                </tr>
            </table>

            <div class="field">Bank and Branch Name: <strong>${data.bank_name || '_____________________'}</strong></div>
            <div class="field">Account Number: <strong>${data.account_no || '_____________________'}</strong></div>
            <div class="field">IFSC Code: <strong>${data.ifsc_code || '_____________________'}</strong></div>
            <div class="field">PAN Number: <strong>${data.pan_no || '_____________________'}</strong></div>
            <div class="field">Total Amount Claimed: Rs. <strong>${data.total_amount || '_____'}</strong></div>
            <div class="field">TDS @ 10%: Rs. <strong>${data.tds || '_____'}</strong></div>
            <div class="field">Net Amount: Rs. <strong>${data.net_amount || '_____'}</strong></div>

            <div class="signature-section">
                <div style="display: flex; justify-content: space-between; margin-top: 40px;">
                    <div>Date: <strong>${data.date || '_____________________'}</strong></div>
                    <div>Signature of the Examiner</div>
                </div>
                
                <p style="margin-top: 30px;">The above claim bill by the examiner is approved and the bill may please be passed for payment.</p>
                
                <div style="display: flex; justify-content: space-between; margin-top: 40px;">
                    <div style="text-align: center; width: 45%;">
                        <div style="margin-bottom: 60px;"></div>
                        <div>CHIEF SUPERINTENDENT OF PG EXAMS</div>
                        <div>(Seal & Signature)</div>
                    </div>
                    <div style="text-align: center; width: 45%;">
                        <div style="margin-bottom: 60px;"></div>
                        <div>HEAD OF THE DEPARTMENT</div>
                        <div>(Seal & Signature)</div>
                    </div>
                </div>
            </div>
        `;
        return html;
    } else if (templateName === 'Viva claim supervisor.docx') {
        const courses = data.courses || [];
        
        const courseRows = courses.map(course => `
            <tr>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${course.sl_no}</td>
                <td style="border: 1px solid #000; padding: 8px;">${course.course}</td>
                <td style="border: 1px solid #000; padding: 8px;">${course.subject_code}</td>
                <td style="border: 1px solid #000; padding: 8px;">${course.supervisor_name}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${course.candidates}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${course.claimed_amount}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${course.tds}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${course.net_amount}</td>
            </tr>
        `).join('');

        const html = `
            <div class="header">
                <p><strong>OFFICE OF THE ADDITIONAL CONTROLLER OF EXAMINATIONS</strong></p>
                <p><strong>DEPARTMENT: CSE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; CAMPUS: CEG/MIT/ACTECH/SAP</strong></p>
                <p><strong>HONORARIUM FOR GUIDE /SUPERVISOR</strong></p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #000;">
                <tr>
                    <th style="border: 1px solid #000; padding: 8px;">Sl.No</th>
                    <th style="border: 1px solid #000; padding: 8px;">Course</th>
                    <th style="border: 1px solid #000; padding: 8px;">Subject Code</th>
                    <th style="border: 1px solid #000; padding: 8px;">Name of Supervisor</th>
                    <th style="border: 1px solid #000; padding: 8px;">Number of candidates</th>
                    <th style="border: 1px solid #000; padding: 8px;">Claimed Amount</th>
                    <th style="border: 1px solid #000; padding: 8px;">TDS@ 10%</th>
                    <th style="border: 1px solid #000; padding: 8px;">Net Amount</th>
                </tr>
                ${courseRows}
            </table>

            <div class="field">Bank and Branch Name: <strong>${data.bank_name || '_____________________'}</strong></div>
            <div class="field">Account Number: <strong>${data.account_no || '_____________________'}</strong></div>
            <div class="field">IFSC Code: <strong>${data.ifsc_code || '_____________________'}</strong></div>
            <div class="field">PAN Number: <strong>${data.pan_no || '_____________________'}</strong></div>

            <div class="signature-section">
                <p style="margin-top: 30px;">Certified that the expenses incurred towards Supervisor in connection with PG exams conducted May, 2025</p>
                
                <div style="display: flex; justify-content: space-between; margin-top: 40px;">
                    <div style="text-align: center; width: 45%;">
                        <div style="margin-bottom: 60px;"></div>
                        <div>Chief Superintendent</div>
                    </div>
                    <div style="text-align: center; width: 45%;">
                        <div style="margin-bottom: 60px;"></div>
                        <div>Head of the Department</div>
                    </div>
                </div>
            </div>
        `;
        return html;
    } else if (templateName === 'Viva External member choice - letter to Chairman.docx') {
        const students = data.students || [];
        
        const studentsRows = students.map(student => `
            <tr>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${student.sl_no || ''}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${student.batch_no || ''}</td>
                <td style="border: 1px solid #000; padding: 8px;">${student.register_number || ''}</td>
                <td style="border: 1px solid #000; padding: 8px;">${student.student_name || ''}</td>
                <td style="border: 1px solid #000; padding: 8px;">${student.external_panel_member || ''}</td>
            </tr>
        `).join('');

        const html = `
            <div class="header">
                <p><strong>DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING</strong></p>
                <p><strong>ANNA UNIVERSITY:: CHENNAI</strong></p>
                <p><strong>${data.course || 'M.E CSE'} - PROJECT WORK – PHASE 2 - VIVA VOCE May 2025</strong></p>
                <p><strong>LIST OF EXAMINERS</strong></p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #000;">
                <tr>
                    <th style="border: 1px solid #000; padding: 8px; text-align: center;">S.No.</th>
                    <th style="border: 1px solid #000; padding: 8px; text-align: center;">Batch No.</th>
                    <th style="border: 1px solid #000; padding: 8px; text-align: center;">Register Number</th>
                    <th style="border: 1px solid #000; padding: 8px; text-align: center;">Name of the Student</th>
                    <th style="border: 1px solid #000; padding: 8px; text-align: center;">External Panel Members</th>
                </tr>
                ${studentsRows}
            </table>

            <div class="signature-section">
                <div style="margin-top: 40px;">
                    <div>Date: <strong>${data.date || '_____________________'}</strong></div>
                </div>
                
                <div style="margin-top: 60px; text-align: center;">
                    <div style="margin-bottom: 60px;"></div>
                    <div>Chairman – I&CE</div>
                </div>
            </div>
        `;
        return html;
    }
    
    // Default fallback - return original text with basic formatting
    return `<div style="white-space: pre-wrap; font-family: 'Times New Roman', serif;">${originalText}</div>`;
};
