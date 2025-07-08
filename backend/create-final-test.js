const { generateDocument } = require('./controllers/documentController');
const fs = require('fs');
const path = require('path');

async function createFinalTestPDF() {
    console.log('🎯 Creating final test-output.pdf...');
    
    const mockReq = {
        body: {
            templatePath: '/templates/template1.docx',
            outputFormat: 'pdf',
            data: {
                course: 'ME Computer Science and Engineering',
                subject_code: 'CP3411',
                candidates: '25',
                claimed_amount: '1250',
                net_amount: '1125'
            },
            includeSignature: true
        }
    };

    const mockRes = {
        status: (code) => ({ json: (data) => console.log(`❌ Error ${code}:`, data.message) }),
        set: () => {},
        send: (data) => {
            if (Buffer.isBuffer(data)) {
                const outputPath = path.join(__dirname, 'test-output.pdf');
                fs.writeFileSync(outputPath, data);
                console.log('✅ test-output.pdf created successfully');
                console.log(`📏 Size: ${data.length} bytes`);
                
                // Verify it's a valid PDF
                const header = data.slice(0, 8).toString('ascii');
                console.log(`📋 Header: ${header}`);
                console.log(`✅ Valid PDF: ${header.startsWith('%PDF')}`);
            }
        }
    };

    await generateDocument(mockReq, mockRes);
}

createFinalTestPDF();
