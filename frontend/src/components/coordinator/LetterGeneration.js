import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import axios from 'axios';

const templates = [
    { name: 'Viva Claim Internal Examiner', path: '/templates/template1.docx' },
    { name: 'Viva Letter to External', path: '/templates/Viva Letter to external.doc' },
    { name: 'Viva Claim External Examiner', path: '/templates/Viva claim External Examiner.docx' },
    { name: 'Viva Claim Supervisor', path: '/templates/Viva claim supervisor.docx' },
    { name: 'Viva External Member Choice', path: '/templates/Viva External member choice - letter to Chairman.docx' }
];

const LetterGeneration = () => {
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [outputFormat, setOutputFormat] = useState('docx'); // 'docx' or 'pdf'
    
    // File upload state
    const [uploadedFile, setUploadedFile] = useState(null);
    const [templateName, setTemplateName] = useState('');
    const [uploading, setUploading] = useState(false);
    
    // Digital signature state
    const [signatureFile, setSignatureFile] = useState(null);
    const [selectedRole, setSelectedRole] = useState('coordinator');
    const [uploadingSignature, setUploadingSignature] = useState(false);
    const [signatures, setSignatures] = useState({
        coordinator: null,
        supervisor: null,
        external_examiner: null,
        admin: null
    });
    const [includeSignature, setIncludeSignature] = useState(true);

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

    const handleGenerateLetter = async () => {
        if (!selectedTemplate) {
            alert('Please select a template first.');
            return;
        }
        setLoading(true);

        try {
            // Calculate total net amount
            const total_net_amount = tableData.reduce((sum, row) => {
                const val = parseFloat(row.net_amount);
                return sum + (isNaN(val) ? 0 : val);
            }, 0);

            // Prepare data for backend
            const templateData = {
                templatePath: selectedTemplate.path,
                outputFormat: outputFormat, // 'docx' or 'pdf'
                includeSignature: includeSignature,
                data: {
                    ...formData,
                    items: tableData,
                    total_net_amount: total_net_amount.toFixed(2)
                }
            };

            // Send request to backend
            const response = await axios.post('http://localhost:5000/api/generate-document', templateData, {
                responseType: 'blob'
            });

            // Download the file
            const fileName = selectedTemplate.name.replace(/ /g, '_') + '_filled.' + outputFormat;
            saveAs(response.data, fileName);
            
        } catch (error) {
            console.error('Error generating document:', error);
            alert('Error generating document. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file && (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                     file.type === 'application/msword')) {
            setUploadedFile(file);
        } else {
            alert('Please select a valid Word document (.doc or .docx)');
        }
    };

    const handleUploadTemplate = async () => {
        if (!uploadedFile || !templateName.trim()) {
            alert('Please select a file and enter a template name.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('template', uploadedFile);
        formData.append('templateName', templateName.trim());

        try {
            await axios.post('http://localhost:5000/api/upload-template', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert('Template uploaded successfully!');
            setUploadedFile(null);
            setTemplateName('');
            // Refresh templates list
            window.location.reload();
        } catch (error) {
            console.error('Error uploading template:', error);
            alert('Error uploading template. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleSignatureUpload = (e) => {
        const file = e.target.files[0];
        if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
            setSignatureFile(file);
        } else {
            alert('Please select a valid image file (PNG, JPG, JPEG) or PDF for the signature');
        }
    };

    const handleUploadSignature = async () => {
        if (!signatureFile) {
            alert('Please select a signature file first.');
            return;
        }

        setUploadingSignature(true);
        const formData = new FormData();
        formData.append('signature', signatureFile);
        formData.append('role', selectedRole);

        try {
            const response = await axios.post('http://localhost:5000/api/upload-signature', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert(`Digital signature uploaded successfully for ${selectedRole}!`);
            
            // Update the signatures state
            setSignatures(prev => ({
                ...prev,
                [selectedRole]: {
                    filename: response.data.filename,
                    exists: true
                }
            }));
            
            setSignatureFile(null);
        } catch (error) {
            console.error('Error uploading signature:', error);
            alert('Error uploading signature. Please try again.');
        } finally {
            setUploadingSignature(false);
        }
    };

    const loadSignatures = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/signatures');
            if (response.data.signatures) {
                setSignatures(response.data.signatures);
            }
        } catch (error) {
            console.error('Error loading signatures:', error);
        }
    };

    // Load signatures on component mount
    React.useEffect(() => {
        loadSignatures();
    }, []);

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

                    <h3 className="text-lg font-semibold mb-4">4. Signature Settings</h3>
                    <div className="mb-6">
                        <div className="flex items-center gap-4 mb-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={includeSignature}
                                    onChange={(e) => setIncludeSignature(e.target.checked)}
                                    className="mr-2"
                                />
                                Include digital signatures in document
                            </label>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(signatures).map(([role, signatureData]) => (
                                <div key={role} className="p-3 border rounded">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium capitalize">
                                            {role.replace('_', ' ')}:
                                        </span>
                                        {signatureData && signatureData.exists ? (
                                            <span className="text-green-600 text-sm">✓ Available</span>
                                        ) : (
                                            <span className="text-gray-500 text-sm">Not uploaded</span>
                                        )}
                                    </div>
                                    {signatureData && signatureData.exists && (
                                        <div className="text-xs text-gray-600">
                                            {signatureData.filename}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-4 text-sm text-gray-600">
                            <p>• Documents will include space for all four signature roles.</p>
                            <p>• Available digital signatures will be automatically included.</p>
                            <p>• Missing signatures will show as blank spaces for manual signing.</p>
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold mb-4">5. Select Output Format</h3>
                    <div className="mb-6">
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="outputFormat"
                                    value="docx"
                                    checked={outputFormat === 'docx'}
                                    onChange={(e) => setOutputFormat(e.target.value)}
                                    className="mr-2"
                                />
                                Word Document (.docx)
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="outputFormat"
                                    value="pdf"
                                    checked={outputFormat === 'pdf'}
                                    onChange={(e) => setOutputFormat(e.target.value)}
                                    className="mr-2"
                                />
                                PDF Document (.pdf)
                            </label>
                        </div>
                    </div>

                    <button onClick={handleGenerateLetter} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400" disabled={loading}>
                        {loading ? 'Generating...' : `Generate and Download ${outputFormat.toUpperCase()}`}
                    </button>
                </div>
            )}

            <hr style={{ margin: '2em 0' }} />

            <div>
                <h3 className="text-lg font-semibold mb-4">Digital Signature Management</h3>
                <div className="grid grid-cols-1 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Role:
                        </label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full p-2 border rounded"
                        >
                            <option value="coordinator">Coordinator</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="external_examiner">External Examiner</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    
                    {signatures[selectedRole] && signatures[selectedRole].exists && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded">
                            <div className="text-sm text-green-800">
                                <strong>Current {selectedRole.replace('_', ' ')} Signature:</strong> {signatures[selectedRole].filename}
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload New Digital Signature for {selectedRole.replace('_', ' ')} (PNG, JPG, JPEG):
                        </label>
                        <input
                            type="file"
                            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                            onChange={handleSignatureUpload}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    {signatureFile && (
                        <div className="text-sm text-gray-600">
                            Selected signature file: {signatureFile.name}
                        </div>
                    )}
                </div>
                <button 
                    onClick={handleUploadSignature} 
                    disabled={!signatureFile || uploadingSignature}
                    className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 mb-4"
                >
                    {uploadingSignature ? 'Uploading...' : `Upload ${selectedRole.replace('_', ' ')} Signature`}
                </button>
                <div className="text-sm text-gray-600">
                    <p>• Upload signatures for each role separately.</p>
                    <p>• Signatures will be automatically placed in the correct position in documents.</p>
                    <p>• Each signature is linked to its specific role (Coordinator, Supervisor, External Examiner, Admin).</p>
                    <p>• Documents will include placeholder spaces for roles without uploaded signatures.</p>
                </div>
            </div>

            <hr style={{ margin: '2em 0' }} />

            <div>
                <h3 className="text-lg font-semibold mb-4">Upload New Template</h3>
                <div className="grid grid-cols-1 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Template Name:</label>
                        <input
                            type="text"
                            placeholder="Enter template name"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Template File (.doc or .docx):</label>
                        <input
                            type="file"
                            accept=".doc,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                            onChange={handleFileUpload}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    {uploadedFile && (
                        <div className="text-sm text-gray-600">
                            Selected file: {uploadedFile.name}
                        </div>
                    )}
                </div>
                <button 
                    onClick={handleUploadTemplate} 
                    disabled={!uploadedFile || !templateName.trim() || uploading}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {uploading ? 'Uploading...' : 'Upload Template'}
                </button>
            </div>
        </div>
    );
};

export default LetterGeneration;