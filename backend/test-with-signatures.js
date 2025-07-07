const fs = require('fs');
const path = require('path');
const { generateDocument } = require('./controllers/documentController');

// Create a simple test signature (base64 encoded 1x1 pixel PNG)
const testSignatureBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHGARukzQAAAABJRU5ErkJggg==';
const testSignatureBuffer = Buffer.from(testSignatureBase64, 'base64');

async function testWithSignatures() {
    try {
        console.log('Testing document generation with signatures...');

        // Create signatures directory if it doesn't exist
        const signaturesDir = path.join(__dirname, 'uploads/signatures');
        if (!fs.existsSync(signaturesDir)) {
            fs.mkdirSync(signaturesDir, { recursive: true });
        }

        // Create test signature files
        const coordinatorSig = path.join(signaturesDir, 'test-coordinator-sig.png');
        const supervisorSig = path.join(signaturesDir, 'test-supervisor-sig.png');
        
        fs.writeFileSync(coordinatorSig, testSignatureBuffer);
        fs.writeFileSync(supervisorSig, testSignatureBuffer);

        // Create signatures.json file
        const signaturesConfig = {
            coordinator: 'test-coordinator-sig.png',
            supervisor: 'test-supervisor-sig.png',
            external_examiner: null,
            admin: null
        };
        
        const signaturesJsonPath = path.join(signaturesDir, 'signatures.json');
        fs.writeFileSync(signaturesJsonPath, JSON.stringify(signaturesConfig, null, 2));

        // Force reload signatures by requiring the module again
        delete require.cache[require.resolve('./controllers/documentController')];
        const { generateDocument: freshGenerateDocument } = require('./controllers/documentController');

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
                    const header = data.slice(0, 8).toString('ascii');
                    console.log('PDF Header:', header);
                    console.log('Valid PDF:', header.startsWith('%PDF'));
                    
                    // Save test output
                    const outputPath = path.join(__dirname, 'test-with-signatures-output.pdf');
                    fs.writeFileSync(outputPath, data);
                    console.log('Test output with signatures saved to:', outputPath);
                }
                return this;
            }
        };

        console.log('Calling generateDocument with signatures...');
        await freshGenerateDocument(mockReq, mockRes);
        
        console.log('Final status code:', statusCode);
        if (statusCode !== 200) {
            console.log('Error response:', responseData);
        }

        // Clean up test files
        try {
            fs.unlinkSync(coordinatorSig);
            fs.unlinkSync(supervisorSig);
            fs.unlinkSync(signaturesJsonPath);
        } catch (e) {
            console.log('Cleanup note:', e.message);
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testWithSignatures();
