const express = require('express');
const path = require('path');
const fs = require('fs');
const { generateDocument } = require('./controllers/documentController');

// Create a minimal test server
const app = express();
app.use(express.json());

// Test route
app.post('/test-generate', generateDocument);

async function testDocumentGeneration() {
    try {
        console.log('Testing document generation endpoint...');

        // Create a simple test template
        const testTemplateContent = `
        <html>
        <body>
        <h1>Test Document</h1>
        <p>Student Name: {studentName}</p>
        <p>Project Title: {projectTitle}</p>
        <p>Date: {date}</p>
        {signature_section}
        </body>
        </html>
        `;

        const templatePath = path.join(__dirname, 'test-template.html');
        fs.writeFileSync(templatePath, testTemplateContent);

        // Mock request and response objects
        const mockReq = {
            body: {
                templatePath: 'test-template.html',
                outputFormat: 'pdf',
                data: {
                    studentName: 'John Doe',
                    projectTitle: 'AI-based Project Management System',
                    date: new Date().toLocaleDateString()
                },
                includeSignature: true
            }
        };

        const mockRes = {
            status: function(code) {
                console.log('Response status:', code);
                return this;
            },
            json: function(data) {
                console.log('Response JSON:', data);
                return this;
            },
            set: function(headers) {
                console.log('Response headers:', headers);
                return this;
            },
            send: function(data) {
                console.log('Response data type:', typeof data);
                console.log('Response data length:', data.length);
                console.log('Is Buffer:', Buffer.isBuffer(data));
                
                if (Buffer.isBuffer(data)) {
                    const header = data.slice(0, 8).toString('ascii');
                    console.log('PDF Header:', header);
                    console.log('Valid PDF:', header.startsWith('%PDF'));
                    
                    // Save test output
                    const outputPath = path.join(__dirname, 'test-endpoint-output.pdf');
                    fs.writeFileSync(outputPath, data);
                    console.log('Test output saved to:', outputPath);
                }
                return this;
            }
        };

        await generateDocument(mockReq, mockRes);

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testDocumentGeneration();
