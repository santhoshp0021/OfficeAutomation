const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testPDFGeneration() {
    try {
        console.log('Starting PDF generation test...');
        
        // Simple HTML content for testing
        const testHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Document</title>
    <style>
        body { 
            font-family: 'Times New Roman', serif; 
            margin: 0; 
            padding: 30px;
            line-height: 1.4;
            color: #000;
        }
        h1 { color: #333; }
        .signature-section {
            margin-top: 50px;
            border-top: 1px solid #000;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <h1>Test Document</h1>
    <p>This is a test document to verify PDF generation is working correctly.</p>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    
    <div class="signature-section">
        <h3>Signature Section</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 50%; padding: 20px; border: none;">
                    <div style="margin-bottom: 30px;">
                        <div style="border: 1px solid #000; height: 60px; margin: 10px 0; background-color: #f9f9f9; text-align: center; line-height: 60px;">
                            <span style="color: #666; font-size: 12px;">Coordinator Signature</span>
                        </div>
                        <div style="border-top: 1px solid #000; width: 200px; margin: 10px 0;"></div>
                        <p style="text-align: center; font-size: 12px; margin: 5px 0;">Coordinator</p>
                        <p style="font-size: 10px; color: #666; margin: 5px 0;">Date: _______ Place: _______</p>
                    </div>
                </td>
                <td style="width: 50%; padding: 20px; border: none;">
                    <div style="margin-bottom: 30px;">
                        <div style="border: 1px solid #000; height: 60px; margin: 10px 0; background-color: #f9f9f9; text-align: center; line-height: 60px;">
                            <span style="color: #666; font-size: 12px;">Supervisor Signature</span>
                        </div>
                        <div style="border-top: 1px solid #000; width: 200px; margin: 10px 0;"></div>
                        <p style="text-align: center; font-size: 12px; margin: 5px 0;">Supervisor</p>
                        <p style="font-size: 10px; color: #666; margin: 5px 0;">Date: _______ Place: _______</p>
                    </div>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>`;

        console.log('Launching Puppeteer...');
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        console.log('Setting content...');
        await page.setContent(testHTML, { waitUntil: 'domcontentloaded' });
        
        console.log('Generating PDF...');
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: false,
            margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' }
        });
        
        await browser.close();

        console.log('PDF Buffer length:', pdfBuffer.length);
        console.log('PDF Buffer type:', typeof pdfBuffer);
        console.log('Is Buffer:', Buffer.isBuffer(pdfBuffer));
        
        // Check first few bytes
        const header = pdfBuffer.slice(0, 8).toString('ascii');
        console.log('PDF Header:', header);
        console.log('Valid PDF header:', header.startsWith('%PDF'));

        // Save to file for testing
        const outputPath = path.join(__dirname, 'test-simple.pdf');
        fs.writeFileSync(outputPath, pdfBuffer);
        console.log('Test PDF saved to:', outputPath);
        
        // Verify saved file
        const savedBuffer = fs.readFileSync(outputPath);
        const savedHeader = savedBuffer.slice(0, 8).toString('ascii');
        console.log('Saved PDF Header:', savedHeader);
        console.log('Saved file size:', savedBuffer.length);

    } catch (error) {
        console.error('PDF generation test failed:', error);
    }
}

testPDFGeneration();
