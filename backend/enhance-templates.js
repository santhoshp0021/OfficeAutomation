const mammoth = require('mammoth');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

async function addTemplateVariablesToExternalExaminer() {
    console.log('Adding template variables to Viva claim External Examiner.docx...');
    
    const templatePath = path.join(__dirname, '../frontend/public/templates/Viva claim External Examiner.docx');
    const content = fs.readFileSync(templatePath, 'binary');
    
    // Extract current text to see structure
    const buffer = fs.readFileSync(templatePath);
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    console.log('Current template structure:');
    console.log(text.substring(0, 500) + '...');
    
    // Manual modification needed - let's create a new template with variables
    const templateContent = `
OFFICE OF THE ADDITIONAL CONTROLLER OF EXAMINATIONS (UNIVERSITY DEPARTMENTS)
ANNA UNIVERSITY: CHENNAI 25.                                 Claim Form for Project Work II - External Examiner                   
                        PG End Semester Examinations…May 2025…

Name: {examiner_name}
Designation: {designation}
Department: {department}
Branch: {branch}
Semester: {semester}

Course Name & Course Code: {course_name} - {course_code}

SI. No | Description | Rate per Student | No. of Students | Amount (Rs.)
1 | Thesis Evaluation Fee | Rs.{rate_per_student}/- | {num_students} | {total_amount}

Bank and Branch Name: {bank_name}
Account Number: {account_no}
IFSC Code: {ifsc_code}
PAN Number: {pan_no}

Total Amount Claimed: Rs. {total_amount}
TDS @ 10%: Rs. {tds}
Net Amount: Rs. {net_amount}

Date: {date}                                                    Signature of the Examiner

The above claim bill by the examiner is approved and the bill may please be passed for payment.

CHIEF SUPERINTENDENT OF PG EXAMS              HEAD OF THE DEPARTMENT
(Seal & Signature)                                      (Seal & Signature)
    `;
    
    console.log('Template variables that should be added:');
    console.log('- {examiner_name}');
    console.log('- {designation}');
    console.log('- {department}');
    console.log('- {branch}');
    console.log('- {semester}');
    console.log('- {course_name}');
    console.log('- {course_code}');
    console.log('- {rate_per_student}');
    console.log('- {num_students}');
    console.log('- {total_amount}');
    console.log('- {bank_name}');
    console.log('- {account_no}');
    console.log('- {ifsc_code}');
    console.log('- {pan_no}');
    console.log('- {tds}');
    console.log('- {net_amount}');
    console.log('- {date}');
}

async function addTemplateVariablesToSupervisor() {
    console.log('\nAdding template variables to Viva claim supervisor.docx...');
    
    const templatePath = path.join(__dirname, '../frontend/public/templates/Viva claim supervisor.docx');
    const buffer = fs.readFileSync(templatePath);
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    console.log('Template variables that should be added:');
    console.log('- {supervisor_name}');
    console.log('- {course}');
    console.log('- {subject_code}');
    console.log('- {candidates}');
    console.log('- {bank_name}');
    console.log('- {account_no}');
    console.log('- {ifsc_code}');
    console.log('- {pan_no}');
    console.log('- {claimed_amount}');
    console.log('- {tds}');
    console.log('- {net_amount}');
}

async function addTemplateVariablesToChairmanLetter() {
    console.log('\nAdding template variables to Viva External member choice - letter to Chairman.docx...');
    
    const templatePath = path.join(__dirname, '../frontend/public/templates/Viva External member choice - letter to Chairman.docx');
    const buffer = fs.readFileSync(templatePath);
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    console.log('This template needs a loop structure for multiple students:');
    console.log('- {course}');
    console.log('- {semester}');
    console.log('- {date}');
    console.log('- {#students} loop with:');
    console.log('  - {sl_no}');
    console.log('  - {batch_no}');
    console.log('  - {register_number}');
    console.log('  - {student_name}');
    console.log('  - {external_panel_member}');
    console.log('- {/students}');
}

async function main() {
    console.log('=== Template Enhancement Analysis ===\n');
    
    await addTemplateVariablesToExternalExaminer();
    await addTemplateVariablesToSupervisor();
    await addTemplateVariablesToChairmanLetter();
    
    console.log('\n=== Recommendations ===');
    console.log('1. The templates need to be manually edited to add template variables');
    console.log('2. Template variables should be added using the format {variable_name}');
    console.log('3. For multiple student entries, use {#students} and {/students} for loops');
    console.log('4. Test the templates after modification to ensure they work properly');
    
    console.log('\n=== Current System Status ===');
    console.log('✓ template1.docx - Already has template variables and loop structure');
    console.log('❌ Viva claim External Examiner.docx - Needs template variables');
    console.log('❌ Viva claim supervisor.docx - Needs template variables');
    console.log('❌ Viva External member choice - letter to Chairman.docx - Needs template variables and loop');
    console.log('❌ Viva Letter to external.doc - Needs template variables');
}

main().catch(console.error);
