import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import axios from 'axios';

// Constants
const API_BASE_URL = 'http://localhost:5000/api';
const ENDPOINTS = {
    SIGNATURE_ROLES: `${API_BASE_URL}/signature-roles`,
    SIGNATURES: `${API_BASE_URL}/signatures`,
    GENERATE_DOCUMENT: `${API_BASE_URL}/generate-document`,
    UPLOAD_SIGNATURE: `${API_BASE_URL}/upload-signature`,
    UPLOAD_TEMPLATE: `${API_BASE_URL}/upload-template`
};

const MESSAGES = {
    SELECT_TEMPLATE: 'Please select a template first.',
    SELECT_SIGNATURE_FILE: 'Please select a signature file and role.',
    SELECT_TEMPLATE_FILE: 'Please select a file and enter a template name.',
    DOCUMENT_SUCCESS: 'Document generated successfully!',
    DOCUMENT_ERROR: 'Error generating document. Please check your inputs and try again.',
    SIGNATURE_SUCCESS: 'Digital signature uploaded successfully for',
    SIGNATURE_ERROR: 'Error uploading signature. Please try again.',
    TEMPLATE_SUCCESS: 'Template uploaded successfully!',
    TEMPLATE_ERROR: 'Error uploading template. Please try again.'
};

const DocumentGenerationCenter = () => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templateRequirements, setTemplateRequirements] = useState({});
    const [availableRoles, setAvailableRoles] = useState([]);
    const [signatures, setSignatures] = useState({});
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [outputFormat, setOutputFormat] = useState('pdf');
    const [includeSignatures, setIncludeSignatures] = useState(true);
    
    // Signature upload state
    const [selectedRole, setSelectedRole] = useState('');
    const [signatureFile, setSignatureFile] = useState(null);
    const [uploadingSignature, setUploadingSignature] = useState(false);
    
    // Template upload state
    const [uploadedFile, setUploadedFile] = useState(null);
    const [templateName, setTemplateName] = useState('');
    const [uploading, setUploading] = useState(false);

    // State for multiple entries
    const [multipleEntries, setMultipleEntries] = useState(false);
    const [entryList, setEntryList] = useState([]);

    useEffect(() => {
        const predefinedTemplates = [
            { 
                name: 'Honorarium for Internal Examiner', 
                path: '/templates/template1.docx',
                description: 'Standard honorarium claim form for internal examiners with detailed financial fields'
            },
            { 
                name: 'Viva Claim External Examiner', 
                path: '/templates/Viva claim External Examiner.docx',
                description: 'Claim form for external examiners in project viva sessions'
            },
            { 
                name: 'Viva Claim Supervisor', 
                path: '/templates/Viva claim supervisor.docx',
                description: 'Honorarium claim form for project supervisors/guides'
            },
            { 
                name: 'Letter to Chairman', 
                path: '/templates/Viva External member choice - letter to Chairman.docx',
                description: 'Letter to chairman regarding external panel member selection with student details'
            },
            { 
                name: 'Viva Letter to External', 
                path: '/templates/Viva Letter to external.doc',
                description: 'Formal invitation letter to external examiner'
            }
        ];
        
        loadSignatureRoles();
        loadSignatures();
        setTemplates(predefinedTemplates);
    }, []);

    const loadSignatureRoles = async () => {
        try {
            const response = await axios.get(ENDPOINTS.SIGNATURE_ROLES);
            setAvailableRoles(response.data.availableRoles || []);
            setTemplateRequirements(response.data.templateRequirements || {});
            if (response.data.availableRoles && response.data.availableRoles.length > 0) {
                setSelectedRole(response.data.availableRoles[0].key);
            }
        } catch (error) {
            console.error('Error loading signature roles:', error);
        }
    };

    const loadSignatures = async () => {
        try {
            const response = await axios.get(ENDPOINTS.SIGNATURES);
            if (response.data.signatures) {
                setSignatures(response.data.signatures);
            }
        } catch (error) {
            console.error('Error loading signatures:', error);
        }
    };

    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        
        // Initialize form data based on template requirements
        const templatePath = template.path.split('/').pop();
        const requirements = templateRequirements[templatePath];
        
        if (requirements && requirements.requiredFields) {
            const initialData = {};
            requirements.requiredFields.forEach(field => {
                initialData[field] = '';
            });
            setFormData(initialData);
        } else {
            setFormData({});
        }

        // Check if template supports multiple entries
        const supportsMultiple = templateSupportsMultipleEntries(template.path);
        setMultipleEntries(supportsMultiple);
        if (supportsMultiple) {
            setEntryList([{}]); // Initialize with one empty entry
        } else {
            setEntryList([]);
        }
    };

    const handleFormInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerateDocument = async () => {
        if (!selectedTemplate) {
            alert(MESSAGES.SELECT_TEMPLATE);
            return;
        }

        setLoading(true);
        try {
            let dataToSend = { ...formData };
            
            // Handle multiple entries
            if (multipleEntries && entryList.length > 0) {
                dataToSend.multiple_entries = true;
                
                // For templates that support loops, convert entries to comma-separated values
                const repeatableFields = ['sl_no', 'course', 'subject_code', 'candidates', 'date_session', 
                                        'student_names', 'student_register_numbers', 'batch_numbers'];
                
                repeatableFields.forEach(field => {
                    const values = entryList.map(entry => entry[field] || '').filter(v => v.trim());
                    if (values.length > 0) {
                        dataToSend[field] = values.join(',');
                    }
                });
                
                // For multiple student entries (Letter to Chairman template)
                if (selectedTemplate.path.includes('letter to Chairman')) {
                    dataToSend.students = entryList.map((entry, index) => ({
                        sl_no: index + 1,
                        batch_no: entry.batch_numbers || '',
                        register_number: entry.student_register_numbers || '',
                        student_name: entry.student_names || '',
                        external_panel_member: entry.external_panel_members || ''
                    }));
                }
            }

            const templateData = {
                templatePath: selectedTemplate.path,
                outputFormat: outputFormat,
                includeSignature: includeSignatures,
                data: dataToSend
            };

            const response = await axios.post(ENDPOINTS.GENERATE_DOCUMENT, templateData, {
                responseType: 'blob'
            });

            const fileName = `${selectedTemplate.name.replace(/ /g, '_')}_generated.${outputFormat}`;
            saveAs(response.data, fileName);
            
            alert(MESSAGES.DOCUMENT_SUCCESS);
        } catch (error) {
            console.error('Error generating document:', error);
            alert(MESSAGES.DOCUMENT_ERROR);
        } finally {
            setLoading(false);
        }
    };

    const handleSignatureUpload = async () => {
        if (!signatureFile || !selectedRole) {
            alert(MESSAGES.SELECT_SIGNATURE_FILE);
            return;
        }

        setUploadingSignature(true);
        const formData = new FormData();
        formData.append('signature', signatureFile);
        formData.append('role', selectedRole);

        try {
            await axios.post(ENDPOINTS.UPLOAD_SIGNATURE, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            alert(`${MESSAGES.SIGNATURE_SUCCESS} ${selectedRole}!`);
            setSignatureFile(null);
            loadSignatures();
        } catch (error) {
            console.error('Error uploading signature:', error);
            alert(MESSAGES.SIGNATURE_ERROR);
        } finally {
            setUploadingSignature(false);
        }
    };

    const handleTemplateUpload = async () => {
        if (!uploadedFile || !templateName.trim()) {
            alert(MESSAGES.SELECT_TEMPLATE_FILE);
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('template', uploadedFile);
        formData.append('templateName', templateName.trim());

        try {
            await axios.post(ENDPOINTS.UPLOAD_TEMPLATE, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(MESSAGES.TEMPLATE_SUCCESS);
            setUploadedFile(null);
            setTemplateName('');
        } catch (error) {
            console.error('Error uploading template:', error);
            alert(MESSAGES.TEMPLATE_ERROR);
        } finally {
            setUploading(false);
        }
    };

    const getFieldLabel = (fieldName) => {
        const labelMap = {
            // General fields
            'sl_no': 'Serial Number',
            'course': 'Course Name',
            'subject_code': 'Subject Code',
            'candidates': 'Number of Candidates',
            'date_session': 'Date of Session/Viva',
            'department': 'Department',
            'campus': 'Campus',
            'date': 'Date',
            'semester': 'Semester',
            'branch': 'Branch',
            
            // Financial fields
            'bank_name': 'Bank and Branch Name',
            'account_no': 'Account Number',
            'ifsc_code': 'IFSC Code',
            'pan_no': 'PAN Number',
            'claimed_amount': 'Claimed Amount',
            'tds': 'TDS @ 10%',
            'net_amount': 'Net Amount',
            'total_net_amount': 'Total Net Amount',
            'passed_for_rs': 'Passed for (Rs.)',
            'passed_for_words': 'Passed for (Words)',
            'tds_amount_rs': 'TDS Amount (Rs.)',
            'tds_amount_words': 'TDS Amount (Words)',
            
            // Examiner fields
            'examiner_name': 'Examiner Name',
            'designation': 'Designation',
            'supervisor_name': 'Supervisor/Guide Name',
            'external_examiner_name': 'External Examiner Name',
            'external_examiner_designation': 'External Examiner Designation',
            'external_examiner_institution': 'External Examiner Institution',
            
            // Course specific fields
            'course_name': 'Course Name',
            'course_code': 'Course Code',
            'course_details': 'Course Details',
            'thesis_evaluation_fee': 'Thesis Evaluation Fee',
            'rate_per_student': 'Rate per Student',
            'num_students': 'Number of Students',
            'total_amount': 'Total Amount',
            
            // Student and panel fields
            'batch_numbers': 'Batch Numbers',
            'student_register_numbers': 'Student Register Numbers',
            'student_names': 'Student Names',
            'external_panel_members': 'External Panel Members',
            'session_date': 'Session Date',
            
            // Viva specific fields
            'viva_date': 'Viva Date',
            'viva_time': 'Viva Time',
            'contact_person': 'Contact Person',
            'contact_phone': 'Contact Phone Number'
        };
        
        return labelMap[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getInputType = (fieldName) => {
        const numberFields = ['sl_no', 'candidates', 'num_students', 'claimed_amount', 'tds', 'net_amount', 'total_net_amount', 'passed_for_rs', 'tds_amount_rs', 'rate_per_student', 'total_amount', 'thesis_evaluation_fee'];
        const dateFields = ['date', 'date_session', 'session_date', 'viva_date'];
        const phoneFields = ['contact_phone'];
        const emailFields = ['email'];
        
        if (numberFields.includes(fieldName)) return 'number';
        if (dateFields.includes(fieldName)) return 'date';
        if (phoneFields.includes(fieldName)) return 'tel';
        if (emailFields.includes(fieldName)) return 'email';
        return 'text';
    };

    const getInputPlaceholder = (fieldName) => {
        const placeholders = {
            'sl_no': '1, 2, 3...',
            'course': 'e.g., M.E Computer Science',
            'subject_code': 'e.g., CP3411',
            'candidates': 'Number of students',
            'bank_name': 'Bank name and branch',
            'account_no': 'Account number',
            'ifsc_code': 'IFSC code',
            'pan_no': 'PAN number',
            'claimed_amount': 'Amount in rupees',
            'tds': 'TDS amount',
            'net_amount': 'Net amount after TDS',
            'contact_phone': '+91 XXXXXXXXXX',
            'viva_time': 'e.g., 10:00 AM',
            'external_panel_members': 'List of external examiners',
            'student_names': 'Comma-separated list of student names',
            'student_register_numbers': 'Comma-separated register numbers'
        };
        
        return placeholders[fieldName] || `Enter ${getFieldLabel(fieldName).toLowerCase()}`;
    };

    const getFieldGroups = (fields, templateName) => {
        const groups = {
            basic: { title: 'Basic Information', fields: [] },
            financial: { title: 'Financial Details', fields: [] },
            examiner: { title: 'Examiner Information', fields: [] },
            students: { title: 'Student Details', fields: [] },
            course: { title: 'Course Information', fields: [] },
            contact: { title: 'Contact Information', fields: [] }
        };

        const financialFields = ['bank_name', 'account_no', 'ifsc_code', 'pan_no', 'claimed_amount', 'tds', 'net_amount', 'total_net_amount', 'passed_for_rs', 'passed_for_words', 'tds_amount_rs', 'tds_amount_words', 'thesis_evaluation_fee', 'rate_per_student', 'total_amount'];
        const examinerFields = ['examiner_name', 'designation', 'supervisor_name', 'external_examiner_name', 'external_examiner_designation', 'external_examiner_institution'];
        const studentFields = ['candidates', 'num_students', 'batch_numbers', 'student_register_numbers', 'student_names', 'external_panel_members'];
        const courseFields = ['course', 'course_name', 'subject_code', 'course_code', 'course_details', 'semester', 'branch'];
        const contactFields = ['contact_person', 'contact_phone', 'viva_time'];

        fields.forEach(field => {
            if (financialFields.includes(field)) {
                groups.financial.fields.push(field);
            } else if (examinerFields.includes(field)) {
                groups.examiner.fields.push(field);
            } else if (studentFields.includes(field)) {
                groups.students.fields.push(field);
            } else if (courseFields.includes(field)) {
                groups.course.fields.push(field);
            } else if (contactFields.includes(field)) {
                groups.contact.fields.push(field);
            } else {
                groups.basic.fields.push(field);
            }
        });

        // Filter out empty groups
        return Object.entries(groups).filter(([_, group]) => group.fields.length > 0);
    };

    const getRequiredSignatures = () => {
        if (!selectedTemplate) return [];
        const templatePath = selectedTemplate.path.split('/').pop();
        const requirements = templateRequirements[templatePath];
        return requirements ? requirements.signatures || [] : [];
    };

    // Check if template supports multiple entries
    const templateSupportsMultipleEntries = (templateName) => {
        const multipleEntryTemplates = ['template1.docx', 'Viva External member choice - letter to Chairman.docx', 'Viva claim supervisor.docx'];
        if (!templateName) return false;
        const path = templateName.split('/').pop();
        return multipleEntryTemplates.includes(path);
    };

    const handleAddEntry = () => {
        const newEntry = {};
        // Initialize with current form data as template
        Object.keys(formData).forEach(field => {
            // For repeatable fields, clear them; for shared fields, keep them
            const repeatableFields = ['sl_no', 'course', 'subject_code', 'candidates', 'date_session', 
                                    'student_names', 'student_register_numbers', 'batch_numbers'];
            if (repeatableFields.includes(field)) {
                newEntry[field] = '';
            } else {
                newEntry[field] = formData[field] || '';
            }
        });
        setEntryList([...entryList, newEntry]);
    };

    const handleRemoveEntry = (index) => {
        const updatedList = entryList.filter((_, i) => i !== index);
        setEntryList(updatedList);
    };

    const handleEntryChange = (index, fieldName, value) => {
        const updatedList = [...entryList];
        updatedList[index][fieldName] = value;
        setEntryList(updatedList);
    };

    const handleMultipleEntriesToggle = (checked) => {
        setMultipleEntries(checked);
        if (!checked) {
            setEntryList([]);
        } else if (entryList.length === 0) {
            // Add first entry with current form data
            handleAddEntry();
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Document Generation Center</h1>
            
            {/* Template Selection */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold mb-4">1. Select Template</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {templates.map((template, index) => (
                        <div
                            key={index}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                selectedTemplate?.path === template.path
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-blue-300'
                            }`}
                            onClick={() => handleTemplateSelect(template)}
                        >
                            <h3 className="font-medium text-sm mb-2">{template.name}</h3>
                            <p className="text-xs text-gray-600">{template.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Fields */}
            {selectedTemplate && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-4">2. Fill Template Data</h2>
                    <div className="text-sm text-gray-600 mb-4">
                        Template: <strong>{selectedTemplate.name}</strong>
                    </div>
                    
                    {Object.keys(formData).length > 0 ? (
                        <div className="space-y-6">
                            {/* Multiple Entries Toggle */}
                            {templateSupportsMultipleEntries(selectedTemplate.path) && (
                                <div className="border rounded-lg p-4 bg-blue-50">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-gray-800">Multiple Entries Support</h3>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={multipleEntries}
                                                onChange={(e) => handleMultipleEntriesToggle(e.target.checked)}
                                                className="mr-2"
                                            />
                                            Enable multiple entries
                                        </label>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        This template supports multiple entries (e.g., multiple courses, students, or sessions). 
                                        Enable this option to add multiple rows of data.
                                    </p>
                                </div>
                            )}

                            {/* Regular Form Fields (when not using multiple entries) */}
                            {!multipleEntries && getFieldGroups(Object.keys(formData), selectedTemplate.name).map(([groupKey, group]) => (
                                <div key={groupKey} className="border rounded-lg p-4">
                                    <h3 className="text-lg font-medium text-gray-800 mb-3">{group.title}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {group.fields.map(fieldName => (
                                            <div key={fieldName}>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {getFieldLabel(fieldName)}:
                                                </label>
                                                <input
                                                    type={getInputType(fieldName)}
                                                    name={fieldName}
                                                    value={formData[fieldName] || ''}
                                                    onChange={handleFormInputChange}
                                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder={getInputPlaceholder(fieldName)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* Multiple Entries Interface */}
                            {multipleEntries && (
                                <div className="space-y-4">
                                    {/* Shared/Common Fields */}
                                    <div className="border rounded-lg p-4 bg-gray-50">
                                        <h3 className="text-lg font-medium text-gray-800 mb-3">Common Information (applies to all entries)</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {Object.keys(formData).filter(field => {
                                                const repeatableFields = ['sl_no', 'course', 'subject_code', 'candidates', 'date_session', 
                                                                         'student_names', 'student_register_numbers', 'batch_numbers', 'external_panel_members'];
                                                return !repeatableFields.includes(field);
                                            }).map(fieldName => (
                                                <div key={fieldName}>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        {getFieldLabel(fieldName)}:
                                                    </label>
                                                    <input
                                                        type={getInputType(fieldName)}
                                                        name={fieldName}
                                                        value={formData[fieldName] || ''}
                                                        onChange={handleFormInputChange}
                                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder={getInputPlaceholder(fieldName)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Individual Entries */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-medium text-gray-800">Individual Entries</h3>
                                            <button
                                                onClick={handleAddEntry}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                            >
                                                Add Entry
                                            </button>
                                        </div>

                                        {entryList.map((entry, index) => (
                                            <div key={index} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-md font-medium text-gray-700">Entry {index + 1}</h4>
                                                    <button
                                                        onClick={() => handleRemoveEntry(index)}
                                                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {Object.keys(formData).filter(field => {
                                                        const repeatableFields = ['sl_no', 'course', 'subject_code', 'candidates', 'date_session', 
                                                                               'student_names', 'student_register_numbers', 'batch_numbers', 'external_panel_members'];
                                                        return repeatableFields.includes(field);
                                                    }).map(fieldName => (
                                                        <div key={fieldName}>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                {getFieldLabel(fieldName)}:
                                                            </label>
                                                            <input
                                                                type={getInputType(fieldName)}
                                                                value={entry[fieldName] || ''}
                                                                onChange={(e) => handleEntryChange(index, fieldName, e.target.value)}
                                                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder={getInputPlaceholder(fieldName)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}

                                        {entryList.length === 0 && (
                                            <div className="text-gray-500 text-center py-8">
                                                No entries added yet. Click "Add Entry" to start.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-gray-500">
                            No specific fields required for this template. You can generate the document directly.
                        </div>
                    )}
                </div>
            )}

            {/* Signature Status */}
            {selectedTemplate && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-4">3. Signature Status</h2>
                    <div className="mb-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={includeSignatures}
                                onChange={(e) => setIncludeSignatures(e.target.checked)}
                                className="mr-2"
                            />
                            Include digital signatures in document
                        </label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {getRequiredSignatures().map(roleData => (
                            <div key={roleData.key} className="p-3 border rounded-lg">
                                <div className="text-sm font-medium mb-1">{roleData.label}</div>
                                <div className={`text-xs ${signatures[roleData.key] ? 'text-green-600' : 'text-gray-500'}`}>
                                    {signatures[roleData.key] ? '✓ Available' : 'Not uploaded'}
                                </div>
                                {signatures[roleData.key] && (
                                    <div className="text-xs text-gray-600 mt-1">
                                        {signatures[roleData.key]}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Document Generation */}
            {selectedTemplate && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-4">4. Generate Document</h2>
                    <div className="flex items-center gap-4 mb-4">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="outputFormat"
                                value="pdf"
                                checked={outputFormat === 'pdf'}
                                onChange={(e) => setOutputFormat(e.target.value)}
                                className="mr-2"
                            />
                            PDF Document
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="outputFormat"
                                value="docx"
                                checked={outputFormat === 'docx'}
                                onChange={(e) => setOutputFormat(e.target.value)}
                                className="mr-2"
                            />
                            Word Document
                        </label>
                    </div>
                    
                    <button
                        onClick={handleGenerateDocument}
                        disabled={loading}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Generating...' : `Generate ${outputFormat.toUpperCase()}`}
                    </button>
                </div>
            )}

            {/* Signature Management */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold mb-4">Signature Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-medium mb-3">Upload New Signature</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role:</label>
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    {availableRoles.map(role => (
                                        <option key={role.key} value={role.key}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Signature File:</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setSignatureFile(e.target.files[0])}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <button
                                onClick={handleSignatureUpload}
                                disabled={!signatureFile || uploadingSignature}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {uploadingSignature ? 'Uploading...' : 'Upload Signature'}
                            </button>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-medium mb-3">Current Signatures</h3>
                        <div className="space-y-2">
                            {availableRoles.map(role => (
                                <div key={role.key} className="flex justify-between items-center p-2 border rounded">
                                    <span className="text-sm font-medium">{role.label}</span>
                                    <span className={`text-xs ${signatures[role.key] ? 'text-green-600' : 'text-gray-500'}`}>
                                        {signatures[role.key] ? '✓ Available' : 'Not uploaded'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Template Upload */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Upload New Template</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Template Name:</label>
                        <input
                            type="text"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="Enter template name"
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Template File:</label>
                        <input
                            type="file"
                            accept=".doc,.docx"
                            onChange={(e) => setUploadedFile(e.target.files[0])}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>
                <button
                    onClick={handleTemplateUpload}
                    disabled={!uploadedFile || !templateName.trim() || uploading}
                    className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                >
                    {uploading ? 'Uploading...' : 'Upload Template'}
                </button>
            </div>

            {/* Multiple Entries Section */}
            {selectedTemplate && multipleEntries && (
                <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                    <h2 className="text-xl font-semibold mb-4">Manage Multiple Entries</h2>
                    <div className="mb-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={multipleEntries}
                                onChange={(e) => handleMultipleEntriesToggle(e.target.checked)}
                                className="mr-2"
                            />
                            This template requires multiple entries
                        </label>
                    </div>
                    
                    {entryList.length > 0 ? (
                        <div className="space-y-4">
                            {entryList.map((entry, index) => (
                                <div key={index} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-lg font-medium text-gray-800">
                                            Entry {index + 1}
                                        </h3>
                                        <button
                                            onClick={() => handleRemoveEntry(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Remove Entry
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.keys(entry).map(fieldName => (
                                            <div key={fieldName}>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {getFieldLabel(fieldName)}:
                                                </label>
                                                <input
                                                    type={getInputType(fieldName)}
                                                    name={fieldName}
                                                    value={entry[fieldName] || ''}
                                                    onChange={(e) => handleEntryChange(index, fieldName, e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder={getInputPlaceholder(fieldName)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500">
                            No entries added yet. Click "Add Entry" to create a new entry.
                        </div>
                    )}
                    
                    <button
                        onClick={handleAddEntry}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Add Entry
                    </button>
                </div>
            )}
        </div>
    );
};

export default DocumentGenerationCenter;
