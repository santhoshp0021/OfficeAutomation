const { generateDocument } = require('./controllers/documentController');
const fs = require('fs');
const path = require('path');

async function testBlankSignatures() {
    try {
        console.log('Testing blank signature generation...');

        const mockReq = {
            body: {
                templatePath: '/templates/template1.docx',
                outputFormat: 'pdf',
                data: {
                    course: 'ME CSE',
                    subject_code: 'CP3411',
                    candidates: '25',
                    date_session: 'May 2025',
                    bank_name: 'State Bank of India',
                    account_no: '1234567890123',
                    ifsc_code: 'SBIN0001234',
                    pan_no: 'ABCDE1234F',
                    claimed_amount: '5000',
                    tds: '500',
                    net_amount: '4500',
                    total_net_amount: '4500',
                    passed_for_rs: '4500',
                    passed_for_words: 'Four Thousand Five Hundred Only',
                    tds_amount_rs: '500',
                    tds_amount_words: 'Five Hundred Only'
                },
                includeSignature: true
            }
        };

        const mockRes = {
            status: function(code) {
                console.log('Status:', code);
                return this;
            },
            json: function(data) {
                console.log('Error:', data.message);
                return this;
            },
            set: function(headers) {
                return this;
            },
            send: function(data) {
                if (Buffer.isBuffer(data)) {
                    console.log('✓ PDF generated with blank signatures');
                    console.log('✓ File size:', data.length, 'bytes');
                    
                    const outputPath = path.join(__dirname, 'final-test-blank-signatures.pdf');
                    fs.writeFileSync(outputPath, data);
                    console.log('✓ Saved to:', outputPath);
                    
                    // Verify PDF header
                    const header = data.slice(0, 8).toString('ascii');
                    console.log('✓ Valid PDF:', header.startsWith('%PDF'));
                }
                return this;
            }
        };

        await generateDocument(mockReq, mockRes);
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testBlankSignatures();
