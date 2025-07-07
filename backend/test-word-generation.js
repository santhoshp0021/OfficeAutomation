const { generateDocument } = require('./controllers/documentController');
const fs = require('fs');
const path = require('path');

async function testWordGeneration() {
    try {
        console.log('Testing Word document generation...');

        const mockReq = {
            body: {
                templatePath: '/templates/template1.docx',
                outputFormat: 'docx', // Change to Word format
                data: {
                    studentName: 'John Doe',
                    projectTitle: 'AI-based Project Management System',
                    guideNames: 'Dr. Smith, Prof. Johnson',
                    date: new Date().toLocaleDateString(),
                    institution: 'Test University',
                    department: 'Computer Science'
                },
                includeSignature: true
            }
        };

        let responseData = null;
        let statusCode = 200;

        const mockRes = {
            status: function(code) {
                statusCode = code;
                console.log('Response status:', code);
                return this;
            },
            json: function(data) {
                responseData = data;
                console.log('Response JSON:', data);
                return this;
            },
            set: function(headers) {
                console.log('Response headers:', headers);
                return this;
            },
            send: function(data) {
                responseData = data;
                console.log('Response data type:', typeof data);
                console.log('Response data length:', data ? data.length : 'undefined');
                console.log('Is Buffer:', Buffer.isBuffer(data));
                
                if (Buffer.isBuffer(data)) {
                    // Save test output
                    const outputPath = path.join(__dirname, 'test-word-output.docx');
                    fs.writeFileSync(outputPath, data);
                    console.log('Test Word output saved to:', outputPath);
                    
                    // Check if it's a valid ZIP (DOCX is a ZIP file)
                    const header = data.slice(0, 4);
                    const isZip = header[0] === 0x50 && header[1] === 0x4B;
                    console.log('Valid DOCX (ZIP) header:', isZip);
                }
                return this;
            }
        };

        console.log('Calling generateDocument for Word format...');
        await generateDocument(mockReq, mockRes);
        
        console.log('Final status code:', statusCode);
        if (statusCode !== 200) {
            console.log('Error response:', responseData);
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testWordGeneration();
