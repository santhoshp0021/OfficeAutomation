const { generateDocument } = require('./controllers/documentController');
const fs = require('fs');
const path = require('path');

async function testWithRealTemplate() {
    try {
        console.log('Testing document generation with real template...');

        // Mock request and response objects
        const mockReq = {
            body: {
                templatePath: '/templates/template1.docx',
                outputFormat: 'pdf',
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
        let responseHeaders = {};
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
                responseHeaders = { ...responseHeaders, ...headers };
                console.log('Response headers:', headers);
                return this;
            },
            send: function(data) {
                responseData = data;
                console.log('Response data type:', typeof data);
                console.log('Response data length:', data ? data.length : 'undefined');
                console.log('Is Buffer:', Buffer.isBuffer(data));
                
                if (Buffer.isBuffer(data)) {
                    const header = data.slice(0, 8).toString('ascii');
                    console.log('PDF Header:', header);
                    console.log('Valid PDF:', header.startsWith('%PDF'));
                    
                    // Save test output
                    const outputPath = path.join(__dirname, 'test-real-template-output.pdf');
                    fs.writeFileSync(outputPath, data);
                    console.log('Test output saved to:', outputPath);
                    
                    // Also check the end of the file for proper PDF structure
                    const endContent = data.slice(-50).toString('ascii');
                    console.log('PDF End content:', endContent);
                    console.log('Has EOF marker:', endContent.includes('%%EOF'));
                }
                return this;
            }
        };

        console.log('Calling generateDocument...');
        await generateDocument(mockReq, mockRes);
        
        console.log('Final status code:', statusCode);
        if (statusCode !== 200) {
            console.log('Error response:', responseData);
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testWithRealTemplate();
