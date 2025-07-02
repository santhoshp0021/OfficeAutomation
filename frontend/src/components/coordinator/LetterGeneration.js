import React, { useState, useEffect } from 'react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';

const templates = [
    { name: 'Viva Claim Internal Examiner', path: '/templates/template1.docx' },
    { name: 'Viva Letter to External', path: '/templates/Viva Letter to external.doc' },
    { name: 'Viva Claim External Examiner', path: '/templates/Viva claim External Examiner.docx' },
    { name: 'Viva Claim Supervisor', path: '/templates/Viva claim supervisor.docx' },
    { name: 'Viva External Member Choice', path: '/templates/Viva External member choice - letter to Chairman.docx' }
];

const editableTemplates = {
    'Viva Letter to External': `Dr. V. Mary Anita Rajam {{letter_date}}
Professor & Head
To
{{member_name}}
{{affiliation_and_address}}
Dear Madam,
Sub: External Examiner – ME CSE – CP3411 - Project Work II - Viva Voce Examination - Reg.
We are pleased to inform that you are appointed as an External Examiner for ME CSE project viva voce examination. The viva-voce is scheduled on {{viva_date}} at {{viva_time}} in the Conference Hall, Department of Computer Science and Engineering. Kindly make yourself comfortable to attend the same.
The honorarium and TA/DA will be paid as per the University norms.
Thank You
(Dr. T. V. Gopal) (Dr. V. Mary Anita Rajam)
Project Co-coordinator Head of the Department`,
    'Viva External Member Choice': `M.E CSE - PROJECT WORK – PHASE 2 - VIVA VOCE {{month_year}}
LIST OF EXAMINERS
S.No.
Batch No.
Register Number
Name of the Student
External Panel Members
{{student_table}}
Member 1 Name
{{member1_affiliation}}
Member 2 Name
{{member2_affiliation}}
Member 3 Name
{{member3_affiliation}}
Chairman – I&CE
DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
ANNA UNIVERSITY:: CHENNAI`,
    'Viva Claim Supervisor': `OFFICE OF THE ADDITIONAL CONTROLLER OF EXAMINATIONS
DEPARTMENT: CSE CAMPUS: CEG/MIT/ACTECH/SAP
HONORARIUM FOR GUIDE /SUPERVISOR

Sl.No  Course         Subject Code  Name of Supervisor         Number of candidates  Bank and Branch Name  Account No  IFSC Code  PAN No.  Claimed Amount  TDS@ 10%  Net Amount  Signature
{{supervisor_table}}
TOTAL

Certified that the expenses incurred towards Supervisor in connection with PG exams conducted {{exam_month_year}}
Passed for Rs._______________________________(Rupees______________________________).
TDS amount Rs.-----------------------(Rupees ---------------------------------------------------------------------------------------)

Chief Superintendent    Head of the Department`,
    'Viva Claim External Examiner': `OFFICE OF THE ADDITIONAL CONTROLLER OF EXAMINATIONS (UNIVERSITY DEPARTMENTS)
ANNA UNIVERSITY: CHENNAI 25. Claim Form for Project Work II - External Examiner PG End Semester Examinations…{{exam_month_year}}…

Name: {{name}}
Designation: {{designation}}
Department: {{department}}
Branch: {{branch}}
ME Computer Science and Engineering
Semester: {{semester}}
Course Name & Course Code: {{course_name_code}}

SI. No  Description                   Rate per Student  No. of Students  Amount (Rs.)
{{claim_items_table}}
Total Amount: {{total_amount}}

Received a sum of Rs. {{received_amount}}/- (Rupees {{received_amount_words}} )
Date: {{date}}
Signature of the Examiner

Office Use Only
Certified that………………………………………………………..has been approved by the Faculty Chairperson, Faculty of………………………………………………………………. To conduct the Project Viva Voce Examination……………………………………………………………..(Subject Code & Title) of …………………………………………………………………………..(Programme & Specialization) held on…………………………………………
The above claim bill by the examiner is approved and the bill may please be passed for payment.

PASS ORDER
Passed for Rs…………………..(Rupees………………………………………………………………….)
CHIEF SUPERINTENDENT OF PG EXAMS    HEAD OF THE DEPARTMENT
(Seal & Signature)                   (Seal & Signature)`,
};

const editableVariableFields = {
    'Viva Letter to External': [
        'letter_date',
        'member_name',
        'affiliation_and_address',
        'viva_date',
        'viva_time'
    ],
    'Viva External Member Choice': [
        'month_year',
        'student_table',
        'member1_affiliation',
        'member2_affiliation',
        'member3_affiliation'
    ],
    'Viva Claim Supervisor': [
        'supervisor_table',
        'exam_month_year'
    ],
    'Viva Claim External Examiner': [
        'exam_month_year',
        'name',
        'designation',
        'department',
        'branch',
        'semester',
        'course_name_code',
        'claim_items_table',
        'total_amount',
        'received_amount',
        'received_amount_words',
        'date'
    ]
};

const LetterGeneration = () => {
    const logoUrl = process.env.PUBLIC_URL + '/college-logo.png';
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedEditableLetter, setSelectedEditableLetter] = useState('Viva Letter to External');
    const [editableLetterContent, setEditableLetterContent] = useState(editableTemplates['Viva Letter to External']);
    const [editableVariables, setEditableVariables] = useState({ name: '', date: '', amount: '', external_member_name: '' });

    // State for the simple form fields
    const [formData, setFormData] = useState({
        passed_for_rs: '',
        passed_for_words: '',
        tds_amount_rs: '',
        tds_amount_words: '',
        bank_name: '',
        account_no: '',
        ifsc_code: '',
        pan_no: ''
    });

    // State for the table data, initialized with one empty row
    const [tableData, setTableData] = useState([
        { sl_no: '1', course: '', subject_code: '', candidates: '', date_session: '', bank_name: '', account_no: '', ifsc_code: '', pan_no: '', claimed_amount: '', tds: '', net_amount: '' },
    ]);

    // Editable templates state (now dynamic)
    const [customEditableTemplates, setCustomEditableTemplates] = useState(editableTemplates);
    const [customEditableVariableFields, setCustomEditableVariableFields] = useState(editableVariableFields);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateContent, setNewTemplateContent] = useState('');
    const [newTemplateFields, setNewTemplateFields] = useState(''); // comma separated

    // State for the student table for the external member choice letter
    const [externalStudentTable, setExternalStudentTable] = useState([
        { batch_no: '', register_number: '', student_name: '', panel_member: '' }
    ]);

    // State for the supervisor table for the claim supervisor letter
    const [supervisorTable, setSupervisorTable] = useState([
        { course: '', subject_code: '', supervisor_name: '', num_candidates: '', bank_name: '', account_no: '', ifsc_code: '', pan_no: '', claimed_amount: '', tds: '', net_amount: '', signature: '' }
    ]);

    // State for the claim items table for the external examiner letter
    const [claimItemsTable, setClaimItemsTable] = useState([
        { description: '', rate: '', num_students: '', amount: '' }
    ]);

    const handleFormInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTableInputChange = (index, e) => {
        const { name, value } = e.target;
        const newTableData = [...tableData];
        newTableData[index][name] = value;
        setTableData(newTableData);
    };

    const addTableRow = () => {
        setTableData([
            ...tableData,
            { sl_no: tableData.length + 1, course: '', subject_code: '', candidates: '', date_session: '', bank_name: '', account_no: '', ifsc_code: '', pan_no: '', claimed_amount: '', tds: '', net_amount: '' }
        ]);
    };

    const removeTableRow = (index) => {
        const newTableData = tableData.filter((_, i) => i !== index);
        // Re-number the sl_no after removal
        setTableData(newTableData.map((row, i) => ({ ...row, sl_no: i + 1 })));
    };

    const loadFile = (url, callback) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function (e) {
            if (this.status === 200) { callback(null, this.response); } 
            else { callback(new Error(xhr.statusText), null); }
        };
        xhr.send();
    };

    const handleGenerateLetter = () => {
        if (!selectedTemplate) {
            alert('Please select a template first.');
            return;
        }
        setLoading(true);

        // Calculate total net amount
        const total_net_amount = tableData.reduce((sum, row) => {
            const val = parseFloat(row.net_amount);
            return sum + (isNaN(val) ? 0 : val);
        }, 0);

        loadFile(selectedTemplate.path, function (error, content) {
            if (error) { 
                console.error('Error loading template file:', error);
                alert('Error loading template file. Please check if the template exists.');
                setLoading(false); 
                return; 
            }
            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

            doc.setData({
                ...formData,
                items: tableData,
                total_net_amount: total_net_amount.toFixed(2)
            });

            try { 
                doc.render(); 
            }
            catch (error) { 
                console.error('Error rendering document:', error);
                alert('Error generating document. Please check your template and data.');
                setLoading(false); 
                return; 
            }

            const out = doc.getZip().generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            const fileName = selectedTemplate.name.replace(/ /g, '_') + '_filled.docx';
            saveAs(out, fileName);
            setLoading(false);
        });
    };

    // Add a new editable template
    const handleAddTemplate = () => {
        if (!newTemplateName.trim()) {
            alert('Please enter a template name.');
            return;
        }
        if (!newTemplateContent.trim()) {
            alert('Please enter template content.');
            return;
        }
        if (!newTemplateFields.trim()) {
            alert('Please enter at least one variable field.');
            return;
        }
        
        // Check if template name already exists
        if (customEditableTemplates[newTemplateName]) {
            alert('A template with this name already exists. Please choose a different name.');
            return;
        }
        
        setCustomEditableTemplates(prev => ({ ...prev, [newTemplateName]: newTemplateContent }));
        setCustomEditableVariableFields(prev => ({ ...prev, [newTemplateName]: newTemplateFields.split(',').map(f => f.trim()) }));
        setNewTemplateName('');
        setNewTemplateContent('');
        setNewTemplateFields('');
        alert('Template added successfully!');
    };

    // Remove an editable template
    const handleRemoveTemplate = (name) => {
        if (Object.keys(customEditableTemplates).length <= 1) {
            alert('Cannot remove the last remaining template.');
            return;
        }
        
        if (!window.confirm(`Are you sure you want to remove the template "${name}"?`)) {
            return;
        }
        
        const { [name]: _, ...restTemplates } = customEditableTemplates;
        const { [name]: __, ...restFields } = customEditableVariableFields;
        setCustomEditableTemplates(restTemplates);
        setCustomEditableVariableFields(restFields);
        if (selectedEditableLetter === name) {
            const first = Object.keys(restTemplates)[0];
            setSelectedEditableLetter(first);
            setEditableLetterContent(restTemplates[first]);
            setEditableVariables({});
        }
    };

    const handleEditableLetterChange = (e) => {
        const letter = e.target.value;
        setSelectedEditableLetter(letter);
        setEditableLetterContent(customEditableTemplates[letter]);
    };

    const handleEditableVariableChange = (e) => {
        setEditableVariables({ ...editableVariables, [e.target.name]: e.target.value });
    };

    const handleEditableContentChange = (e) => {
        setEditableLetterContent(e.target.value);
    };

    // Update student table for external member choice
    const handleExternalStudentTableChange = (index, e) => {
        const { name, value } = e.target;
        const newTable = [...externalStudentTable];
        newTable[index][name] = value;
        setExternalStudentTable(newTable);
    };

    const addExternalStudentRow = () => {
        setExternalStudentTable([
            ...externalStudentTable,
            { batch_no: '', register_number: '', student_name: '', panel_member: '' }
        ]);
    };

    const removeExternalStudentRow = (index) => {
        const newTable = externalStudentTable.filter((_, i) => i !== index);
        setExternalStudentTable(newTable);
    };

    // Update supervisor table for claim supervisor
    const handleSupervisorTableChange = (index, e) => {
        const { name, value } = e.target;
        const newTable = [...supervisorTable];
        newTable[index][name] = value;
        setSupervisorTable(newTable);
    };

    const addSupervisorRow = () => {
        setSupervisorTable([
            ...supervisorTable,
            { course: '', subject_code: '', supervisor_name: '', num_candidates: '', bank_name: '', account_no: '', ifsc_code: '', pan_no: '', claimed_amount: '', tds: '', net_amount: '', signature: '' }
        ]);
    };

    const removeSupervisorRow = (index) => {
        const newTable = supervisorTable.filter((_, i) => i !== index);
        setSupervisorTable(newTable);
    };

    // Update claim items table for external examiner
    const handleClaimItemsTableChange = (index, e) => {
        const { name, value } = e.target;
        const newTable = [...claimItemsTable];
        newTable[index][name] = value;
        setClaimItemsTable(newTable);
    };

    const addClaimItemRow = () => {
        setClaimItemsTable([
            ...claimItemsTable,
            { description: '', rate: '', num_students: '', amount: '' }
        ]);
    };

    const removeClaimItemRow = (index) => {
        const newTable = claimItemsTable.filter((_, i) => i !== index);
        setClaimItemsTable(newTable);
    };

    // Helper to render the student table as a table-like string for the template
    const renderStudentTableText = () => {
        // Table header
        let table = 'S.No.  Batch No.  Register Number  Name of the Student  Panel Member\n';
        table += externalStudentTable.map((row, idx) =>
            `${(idx + 1).toString().padEnd(5)}  ${row.batch_no.padEnd(8)}  ${row.register_number.padEnd(15)}  ${row.student_name.padEnd(20)}  ${row.panel_member}`
        ).join('\n');
        return table;
    };

    // Helper to render the supervisor table as a table-like string for the template
    const renderSupervisorTableText = () => {
        let table = '';
        supervisorTable.forEach((row, idx) => {
            table += `${(idx + 1).toString().padEnd(5)}  ${row.course.padEnd(13)}  ${row.subject_code.padEnd(12)}  ${row.supervisor_name.padEnd(25)}  ${row.num_candidates.padEnd(20)}  ${row.bank_name.padEnd(22)}  ${row.account_no.padEnd(10)}  ${row.ifsc_code.padEnd(9)}  ${row.pan_no.padEnd(7)}  ${row.claimed_amount.padEnd(14)}  ${row.tds.padEnd(8)}  ${row.net_amount.padEnd(10)}  ${row.signature}`;
            table += '\n';
        });
        return table;
    };

    // Helper to render the claim items table as a table-like string for the template
    const renderClaimItemsTableText = () => {
        let table = '';
        claimItemsTable.forEach((row, idx) => {
            table += `${(idx + 1).toString().padEnd(6)}${row.description.padEnd(30)}${row.rate.padEnd(18)}${row.num_students.padEnd(17)}${row.amount}`;
            table += '\n';
        });
        return table;
    };

    const generateEditablePDF = () => {
        let filledContent = editableLetterContent;
        let variables = { ...editableVariables };
        
        // If the selected letter is the external member choice, inject the student table
        if (selectedEditableLetter === 'Viva External Member Choice') {
            variables.student_table = renderStudentTableText();
        }
        // If the selected letter is the claim supervisor, inject the supervisor table
        if (selectedEditableLetter === 'Viva Claim Supervisor') {
            variables.supervisor_table = renderSupervisorTableText();
        }
        // If the selected letter is the claim external examiner, inject the claim items table
        if (selectedEditableLetter === 'Viva Claim External Examiner') {
            variables.claim_items_table = renderClaimItemsTableText();
            // Calculate total amount if not filled
            if (!variables.total_amount) {
                const total = claimItemsTable.reduce((sum, row) => {
                    const val = parseFloat(row.amount);
                    return sum + (isNaN(val) ? 0 : val);
                }, 0);
                variables.total_amount = total.toString();
            }
        }
        
        // Replace all variables in the content
        customEditableVariableFields[selectedEditableLetter]?.forEach(field => {
            const regex = new RegExp(`{{${field}}}`, 'g');
            filledContent = filledContent.replace(regex, variables[field] || '');
        });
        
        const doc = new jsPDF();
        
        // Try to add logo, fallback gracefully if it fails
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function () {
                try {
                    doc.addImage(img, 'PNG', 10, 10, 30, 30);
                } catch (err) {
                    console.warn('Could not add logo to PDF:', err);
                }
                // Split content into lines that fit the page width
                const lines = doc.splitTextToSize(filledContent, 180);
                doc.text(lines, 10, 50);
                doc.save(`${selectedEditableLetter.replace(/\s+/g, '_')}.pdf`);
            };
            img.onerror = function () {
                // Generate PDF without logo
                const lines = doc.splitTextToSize(filledContent, 180);
                doc.text(lines, 10, 10);
                doc.save(`${selectedEditableLetter.replace(/\s+/g, '_')}.pdf`);
            };
            img.src = logoUrl;
        } catch (error) {
            console.warn('Error loading logo, generating PDF without it:', error);
            // Generate PDF without logo
            const lines = doc.splitTextToSize(filledContent, 180);
            doc.text(lines, 10, 10);
            doc.save(`${selectedEditableLetter.replace(/\s+/g, '_')}.pdf`);
        }
    };

    // Ensure editable letter content updates when template changes
    useEffect(() => {
        if (customEditableTemplates[selectedEditableLetter]) {
            setEditableLetterContent(customEditableTemplates[selectedEditableLetter]);
        }
        // Reset variables for new template
        const fields = customEditableVariableFields[selectedEditableLetter] || [];
        setEditableVariables(fields.reduce((acc, f) => ({ ...acc, [f]: '' }), {}));
    }, [selectedEditableLetter, customEditableTemplates, customEditableVariableFields]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Letter Generation</h2>

            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">1. Select a Template</h3>
                <div className="flex flex-wrap gap-2">
                    {templates.map(template => (
                        <button
                            key={template.path}
                            onClick={() => setSelectedTemplate(template)}
                            className={`px-4 py-2 rounded-md ${selectedTemplate?.path === template.path ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                        >
                            {template.name}
                        </button>
                    ))}
                </div>
            </div>

            {selectedTemplate && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">2. Fill in Table Details</h3>
                    <div className="overflow-x-auto mb-6">
                        <table className="min-w-full bg-white border">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="py-2 px-4 border">Sl.No</th>
                                    <th className="py-2 px-4 border">Course</th>
                                    <th className="py-2 px-4 border">Subject Code</th>
                                    <th className="py-2 px-4 border">Candidates</th>
                                    <th className="py-2 px-4 border">Date & Session</th>
                                    <th className="py-2 px-4 border">Bank and Branch Name</th>
                                    <th className="py-2 px-4 border">Account No</th>
                                    <th className="py-2 px-4 border">IFSC Code</th>
                                    <th className="py-2 px-4 border">PAN No.</th>
                                    <th className="py-2 px-4 border">Claimed Amount</th>
                                    <th className="py-2 px-4 border">TDS @ 10%</th>
                                    <th className="py-2 px-4 border">Net Amount</th>
                                    <th className="py-2 px-4 border">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.map((row, index) => (
                                    <tr key={index}>
                                        <td className="border px-4 py-2">{row.sl_no}</td>
                                        <td className="border px-4 py-2"><input type="text" name="course" value={row.course} onChange={(e) => handleTableInputChange(index, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-4 py-2"><input type="text" name="subject_code" value={row.subject_code} onChange={(e) => handleTableInputChange(index, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-4 py-2"><input type="text" name="candidates" value={row.candidates} onChange={(e) => handleTableInputChange(index, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-4 py-2"><input type="text" name="date_session" value={row.date_session} onChange={(e) => handleTableInputChange(index, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-4 py-2"><input type="text" name="bank_name" value={row.bank_name} onChange={(e) => handleTableInputChange(index, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-4 py-2"><input type="text" name="account_no" value={row.account_no} onChange={(e) => handleTableInputChange(index, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-4 py-2"><input type="text" name="ifsc_code" value={row.ifsc_code} onChange={(e) => handleTableInputChange(index, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-4 py-2"><input type="text" name="pan_no" value={row.pan_no} onChange={(e) => handleTableInputChange(index, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-4 py-2"><input type="text" name="claimed_amount" value={row.claimed_amount} onChange={(e) => handleTableInputChange(index, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-4 py-2"><input type="text" name="tds" value={row.tds} onChange={(e) => handleTableInputChange(index, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-4 py-2"><input type="text" name="net_amount" value={row.net_amount} onChange={(e) => handleTableInputChange(index, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-4 py-2"><button onClick={() => removeTableRow(index)} className="text-red-500">Remove</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button onClick={addTableRow} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Add Row</button>
                    </div>

                    <h3 className="text-lg font-semibold mb-4">3. Fill in Other Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <input type="text" name="passed_for_rs" value={formData.passed_for_rs} onChange={handleFormInputChange} placeholder="Passed for (Amount in Rs.)" className="p-2 border rounded" />
                        <input type="text" name="passed_for_words" value={formData.passed_for_words} onChange={handleFormInputChange} placeholder="Passed for (Amount in words)" className="p-2 border rounded" />
                        <input type="text" name="tds_amount_rs" value={formData.tds_amount_rs} onChange={handleFormInputChange} placeholder="TDS Amount (in Rs.)" className="p-2 border rounded" />
                        <input type="text" name="tds_amount_words" value={formData.tds_amount_words} onChange={handleFormInputChange} placeholder="TDS Amount (in words)" className="p-2 border rounded" />
                         </div>

                    <button onClick={handleGenerateLetter} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400" disabled={loading}>
                        {loading ? 'Generating...' : 'Generate and Download Letter'}
                    </button>
                </div>
            )}

            <hr style={{ margin: '2em 0' }} />

            <div>
                <h3 className="text-lg font-semibold mb-4">Editable Letter Generation</h3>
                <label className="block mb-2">
                    Select Editable Letter:
                    <select value={selectedEditableLetter} onChange={handleEditableLetterChange} className="mt-1 block w-full p-2 border rounded">
                        {Object.keys(customEditableTemplates).map(letter => (
                            <option key={letter} value={letter}>{letter}</option>
                        ))}
                    </select>
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                    {Object.keys(customEditableTemplates).map(letter => (
                        <button key={letter} onClick={() => handleRemoveTemplate(letter)} className="px-2 py-1 bg-red-500 text-white rounded text-xs">Remove {letter}</button>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {customEditableVariableFields[selectedEditableLetter]?.map(field => (
                        <div key={field}>
                            <label className="block text-sm font-medium text-gray-700">{field.replace(/_/g, ' ')}:</label>
                            <input
                                type="text"
                                name={field}
                                value={editableVariables[field] || ''}
                                onChange={handleEditableVariableChange}
                                className="mt-1 block w-full p-2 border rounded"
                            />
                        </div>
                    ))}
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Edit Letter Content:</label>
                    <textarea
                        rows={10}
                        cols={80}
                        value={editableLetterContent}
                        onChange={handleEditableContentChange}
                        className="mt-1 block w-full p-2 border rounded"
                    />
                </div>
                <button onClick={generateEditablePDF} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-6">
                    Generate PDF
                </button>
                <hr className="my-6" />
                <h4 className="font-semibold mb-2">Add New Editable Letter Template</h4>
                <input
                    type="text"
                    placeholder="Template Name"
                    value={newTemplateName}
                    onChange={e => setNewTemplateName(e.target.value)}
                    className="mb-2 block w-full p-2 border rounded"
                />
                <input
                    type="text"
                    placeholder="Comma separated variable fields (e.g. name,date,amount)"
                    value={newTemplateFields}
                    onChange={e => setNewTemplateFields(e.target.value)}
                    className="mb-2 block w-full p-2 border rounded"
                />
                <textarea
                    rows={5}
                    placeholder="Template Content (use {{field}} for variables)"
                    value={newTemplateContent}
                    onChange={e => setNewTemplateContent(e.target.value)}
                    className="mb-2 block w-full p-2 border rounded"
                />
                <button onClick={handleAddTemplate} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Add Template
                </button>

                {/* Student table editing section for external member choice letter */}
                {selectedEditableLetter === 'Viva External Member Choice' && (
                    <div className="mb-4">
                        <h4 className="font-semibold mb-2">Student Table</h4>
                        <table className="min-w-full bg-white border mb-2">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="py-1 px-2 border">Batch No.</th>
                                    <th className="py-1 px-2 border">Register Number</th>
                                    <th className="py-1 px-2 border">Student Name</th>
                                    <th className="py-1 px-2 border">Panel Member</th>
                                    <th className="py-1 px-2 border">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {externalStudentTable.map((row, idx) => (
                                    <tr key={idx}>
                                        <td className="border px-2 py-1"><input type="text" name="batch_no" value={row.batch_no} onChange={e => handleExternalStudentTableChange(idx, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-2 py-1"><input type="text" name="register_number" value={row.register_number} onChange={e => handleExternalStudentTableChange(idx, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-2 py-1"><input type="text" name="student_name" value={row.student_name} onChange={e => handleExternalStudentTableChange(idx, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-2 py-1"><input type="text" name="panel_member" value={row.panel_member} onChange={e => handleExternalStudentTableChange(idx, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-2 py-1"><button onClick={() => removeExternalStudentRow(idx)} className="text-red-500">Remove</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button onClick={addExternalStudentRow} className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Add Student</button>
                    </div>
                )}

                {/* Supervisor table editing section for claim supervisor letter */}
                {selectedEditableLetter === 'Viva Claim Supervisor' && (
                    <div className="mb-4">
                        <h4 className="font-semibold mb-2">Supervisor Table</h4>
                        <table className="min-w-full bg-white border mb-2">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="py-1 px-2 border">Course</th>
                                    <th className="py-1 px-2 border">Subject Code</th>
                                    <th className="py-1 px-2 border">Name of Supervisor</th>
                                    <th className="py-1 px-2 border">Number of candidates</th>
                                    <th className="py-1 px-2 border">Bank and Branch Name</th>
                                    <th className="py-1 px-2 border">Account No</th>
                                    <th className="py-1 px-2 border">IFSC Code</th>
                                    <th className="py-1 px-2 border">PAN No.</th>
                                    <th className="py-1 px-2 border">Claimed Amount</th>
                                    <th className="py-1 px-2 border">TDS@ 10%</th>
                                    <th className="py-1 px-2 border">Net Amount</th>
                                    <th className="py-1 px-2 border">Signature</th>
                                    <th className="py-1 px-2 border">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {supervisorTable.map((row, idx) => (
                                    <tr key={idx}>
                                        <td className="border px-2 py-1"><input type="text" name="course" value={row.course} onChange={e => handleSupervisorTableChange(idx, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-2 py-1"><input type="text" name="subject_code" value={row.subject_code} onChange={e => handleSupervisorTableChange(idx, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-2 py-1"><input type="text" name="supervisor_name" value={row.supervisor_name} onChange={e => handleSupervisorTableChange(idx, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-2 py-1"><input type="text" name="num_candidates" value={row.num_candidates} onChange={e => handleSupervisorTableChange(idx, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-2 py-1"><input type="text" name="bank_name" value={row.bank_name} onChange={e => handleSupervisorTableChange(idx, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-2 py-1"><input type="text" name="account_no" value={row.account_no} onChange={e => handleSupervisorTableChange(idx, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-2 py-1"><input type="text" name="ifsc_code" value={row.ifsc_code} onChange={e => handleSupervisorTableChange(idx, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-2 py-1"><input type="text" name="pan_no" value={row.pan_no} onChange={e => handleSupervisorTableChange(idx, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-2 py-1"><input type="text" name="claimed_amount" value={row.claimed_amount} onChange={e => handleSupervisorTableChange(idx, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-2 py-1"><input type="text" name="tds" value={row.tds} onChange={e => handleSupervisorTableChange(idx, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-2 py-1"><input type="text" name="net_amount" value={row.net_amount} onChange={e => handleSupervisorTableChange(idx, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-2 py-1"><input type="text" name="signature" value={row.signature} onChange={e => handleSupervisorTableChange(idx, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-2 py-1"><button onClick={() => removeSupervisorRow(idx)} className="text-red-500">Remove</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button onClick={addSupervisorRow} className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Add Supervisor</button>
                    </div>
                )}

                {/* Claim items table editing section for external examiner letter */}
                {selectedEditableLetter === 'Viva Claim External Examiner' && (
                    <div className="mb-4">
                        <h4 className="font-semibold mb-2">Claim Items Table</h4>
                        <table className="min-w-full bg-white border mb-2">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="py-1 px-2 border">Description</th>
                                    <th className="py-1 px-2 border">Rate per Student</th>
                                    <th className="py-1 px-2 border">No. of Students</th>
                                    <th className="py-1 px-2 border">Amount (Rs.)</th>
                                    <th className="py-1 px-2 border">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {claimItemsTable.map((row, idx) => (
                                    <tr key={idx}>
                                        <td className="border px-2 py-1"><input type="text" name="description" value={row.description} onChange={e => handleClaimItemsTableChange(idx, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-2 py-1"><input type="text" name="rate" value={row.rate} onChange={e => handleClaimItemsTableChange(idx, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-2 py-1"><input type="text" name="num_students" value={row.num_students} onChange={e => handleClaimItemsTableChange(idx, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-2 py-1"><input type="text" name="amount" value={row.amount} onChange={e => handleClaimItemsTableChange(idx, e)} className="w-full p-1 border rounded" /></td>
                                        <td className="border px-2 py-1"><button onClick={() => removeClaimItemRow(idx)} className="text-red-500">Remove</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button onClick={addClaimItemRow} className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Add Row</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LetterGeneration;