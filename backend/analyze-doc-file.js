const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function analyzeDocFile() {
    try {
        const templatePath = path.join(__dirname, '../frontend/public/templates/Viva Letter to external.doc');
        
        // Try reading as binary and extracting text differently for .doc files
        if (fs.existsSync(templatePath)) {
            console.log('=== ANALYZING: Viva Letter to external.doc ===');
            
            // Read as buffer and try to extract text
            const buffer = fs.readFileSync(templatePath);
            console.log('File size:', buffer.length);
            
            // Try to extract readable text from the buffer
            const text = buffer.toString('binary');
            
            // Look for common template patterns and signature-related content
            const readableText = text.replace(/[^\x20-\x7E\n\r]/g, ' ').replace(/\s+/g, ' ');
            
            console.log('Readable content (first 2000 chars):');
            console.log(readableText.substring(0, 2000));
            
            // Look for signature-related keywords
            const signatureKeywords = ['signature', 'sign', 'coordinator', 'supervisor', 'examiner', 'chairman', 'admin', 'principal', 'head'];
            console.log('\nSignature-related content found:');
            signatureKeywords.forEach(keyword => {
                const regex = new RegExp(keyword, 'gi');
                const matches = readableText.match(regex);
                if (matches) {
                    console.log(`  - "${keyword}": ${matches.length} occurrences`);
                }
            });
        }
    } catch (error) {
        console.error('Error analyzing .doc file:', error.message);
    }
}

analyzeDocFile();
