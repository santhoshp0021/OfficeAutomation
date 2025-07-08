const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

// Template enhancement system for templates without variables
class TemplateEnhancer {
    constructor() {
        this.templateMappings = {
            'Viva claim External Examiner.docx': {
                fields: {
                    'examiner_name': 'Name',
                    'designation': 'Designation',
                    'department': 'Department',
                    'branch': 'Branch',
                    'semester': 'Semester',
                    'course_name': 'Course Name',
                    'course_code': 'Course Code',
                    'rate_per_student': 'Rate per Student',
                    'num_students': 'No. of Students',
                    'total_amount': 'Total Amount',
                    'bank_name': 'Bank and Branch Name',
                    'account_no': 'Account Number',
                    'ifsc_code': 'IFSC Code',
                    'pan_no': 'PAN Number',
                    'tds': 'TDS Amount',
                    'net_amount': 'Net Amount',
                    'date': 'Date'
                },
                replacements: [
                    { search: 'Name', replace: 'Name: {examiner_name}' },
                    { search: 'Designation', replace: 'Designation: {designation}' },
                    { search: 'Department', replace: 'Department: {department}' },
                    { search: 'Branch', replace: 'Branch: {branch}' },
                    { search: 'ME Computer Science and Engineering', replace: '{branch}' },
                    { search: 'Semester', replace: 'Semester: {semester}' },
                    { search: 'IV', replace: '{semester}' },
                    { search: 'CP3411 – Project Work II', replace: '{course_name} - {course_code}' },
                    { search: 'Rs.150/-', replace: 'Rs.{rate_per_student}/-' }
                ]
            },
            'Viva claim supervisor.docx': {
                fields: {
                    'supervisor_name': 'Name of Supervisor',
                    'course': 'Course',
                    'subject_code': 'Subject Code',
                    'candidates': 'Number of candidates',
                    'bank_name': 'Bank and Branch Name',
                    'account_no': 'Account Number',
                    'ifsc_code': 'IFSC Code',
                    'pan_no': 'PAN Number',
                    'claimed_amount': 'Claimed Amount',
                    'tds': 'TDS Amount',
                    'net_amount': 'Net Amount'
                }
            },
            'Viva External member choice - letter to Chairman.docx': {
                fields: {
                    'course': 'Course',
                    'semester': 'Semester',
                    'date': 'Date',
                    'students': 'Student List'
                },
                supportsMultipleStudents: true
            }
        };
    }

    // Create enhanced versions of templates with variables
    async createEnhancedTemplate(templateName) {
        const originalPath = path.join(__dirname, '../frontend/public/templates', templateName);
        const enhancedPath = path.join(__dirname, '../frontend/public/templates', `Enhanced_${templateName}`);
        
        if (!fs.existsSync(originalPath)) {
            throw new Error(`Template not found: ${templateName}`);
        }

        // Read the original template
        const content = fs.readFileSync(originalPath, 'binary');
        const zip = new PizZip(content);
        
        if (templateName === 'Viva claim External Examiner.docx') {
            await this.enhanceExternalExaminerTemplate(originalPath, enhancedPath);
        } else if (templateName === 'Viva claim supervisor.docx') {
            await this.enhanceSupervisorTemplate(originalPath, enhancedPath);
        } else if (templateName === 'Viva External member choice - letter to Chairman.docx') {
            await this.enhanceChairmanLetterTemplate(originalPath, enhancedPath);
        }
        
        return enhancedPath;
    }

    async enhanceExternalExaminerTemplate(originalPath, enhancedPath) {
        // For now, we'll create an HTML-based template that can be converted to PDF
        const enhancedHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Enhanced External Examiner Claim</title>
    <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; margin: 2cm; }
        .header { text-align: center; font-weight: bold; margin-bottom: 20px; }
        .field { margin: 5px 0; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { border: 1px solid black; padding: 8px; text-align: left; }
        .signature-section { margin-top: 40px; }
        .signature-line { margin: 60px 0; }
    </style>
</head>
<body>
    <div class="header">
        <p>OFFICE OF THE ADDITIONAL CONTROLLER OF EXAMINATIONS (UNIVERSITY DEPARTMENTS)</p>
        <p>ANNA UNIVERSITY: CHENNAI 25. &nbsp;&nbsp;&nbsp;&nbsp; Claim Form for Project Work II - External Examiner</p>
        <p>PG End Semester Examinations…May 2025…</p>
    </div>

    <div class="field">Name: <strong>{examiner_name}</strong></div>
    <div class="field">Designation: <strong>{designation}</strong></div>
    <div class="field">Department: <strong>{department}</strong></div>
    <div class="field">Branch: <strong>{branch}</strong></div>
    <div class="field">Semester: <strong>{semester}</strong></div>
    <div class="field">Course Name & Course Code: <strong>{course_name} - {course_code}</strong></div>

    <table class="table">
        <tr>
            <th>SI. No</th>
            <th>Description</th>
            <th>Rate per Student</th>
            <th>No. of Students</th>
            <th>Amount (Rs.)</th>
        </tr>
        <tr>
            <td>1</td>
            <td>Thesis Evaluation Fee</td>
            <td>Rs.{rate_per_student}/-</td>
            <td>{num_students}</td>
            <td>{total_amount}</td>
        </tr>
    </table>

    <div class="field">Bank and Branch Name: <strong>{bank_name}</strong></div>
    <div class="field">Account Number: <strong>{account_no}</strong></div>
    <div class="field">IFSC Code: <strong>{ifsc_code}</strong></div>
    <div class="field">PAN Number: <strong>{pan_no}</strong></div>
    <div class="field">Total Amount Claimed: Rs. <strong>{total_amount}</strong></div>
    <div class="field">TDS @ 10%: Rs. <strong>{tds}</strong></div>
    <div class="field">Net Amount: Rs. <strong>{net_amount}</strong></div>

    <div class="signature-section">
        <div style="display: flex; justify-content: space-between; margin-top: 40px;">
            <div>Date: <strong>{date}</strong></div>
            <div>Signature of the Examiner: ___________________</div>
        </div>
        
        <p style="margin-top: 30px;">The above claim bill by the examiner is approved and the bill may please be passed for payment.</p>
        
        <div style="display: flex; justify-content: space-between; margin-top: 40px;">
            <div style="text-align: center;">
                <div class="signature-line">_____________________</div>
                <div>CHIEF SUPERINTENDENT OF PG EXAMS</div>
                <div>(Seal & Signature)</div>
            </div>
            <div style="text-align: center;">
                <div class="signature-line">_____________________</div>
                <div>HEAD OF THE DEPARTMENT</div>
                <div>(Seal & Signature)</div>
            </div>
        </div>
    </div>
</body>
</html>`;

        // Save as HTML template for now
        const htmlPath = enhancedPath.replace('.docx', '.html');
        fs.writeFileSync(htmlPath, enhancedHTML);
        console.log(`Enhanced template created: ${htmlPath}`);
        return htmlPath;
    }

    async enhanceChairmanLetterTemplate(originalPath, enhancedPath) {
        const enhancedHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Enhanced Chairman Letter</title>
    <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; margin: 2cm; }
        .header { text-align: center; font-weight: bold; margin-bottom: 20px; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { border: 1px solid black; padding: 8px; text-align: center; }
        .signature-section { margin-top: 40px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <p>DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING</p>
        <p>ANNA UNIVERSITY:: CHENNAI</p>
        <p>{course} - PROJECT WORK – PHASE 2 - VIVA VOCE May 2025</p>
        <p>LIST OF EXAMINERS</p>
    </div>

    <table class="table">
        <tr>
            <th>S.No.</th>
            <th>Batch No.</th>
            <th>Register Number</th>
            <th>Name of the Student</th>
            <th>External Panel Members</th>
        </tr>
        {#students}
        <tr>
            <td>{sl_no}</td>
            <td>{batch_no}</td>
            <td>{register_number}</td>
            <td>{student_name}</td>
            <td>{external_panel_member}</td>
        </tr>
        {/students}
    </table>

    <div class="signature-section">
        <div style="margin-top: 40px;">
            <div>Date: <strong>{date}</strong></div>
        </div>
        
        <div style="margin-top: 60px;">
            <div>_____________________</div>
            <div>Chairman – I&CE</div>
        </div>
    </div>
</body>
</html>`;

        const htmlPath = enhancedPath.replace('.docx', '.html');
        fs.writeFileSync(htmlPath, enhancedHTML);
        console.log(`Enhanced template created: ${htmlPath}`);
        return htmlPath;
    }
}

module.exports = TemplateEnhancer;
