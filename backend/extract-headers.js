const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function extractHeadersAndFormatting() {
    const templatesDir = path.join(__dirname, '../frontend/public/templates');
    const templates = [
        'template1.docx',
        'Viva claim External Examiner.docx', 
        'Viva claim supervisor.docx',
        'Viva External member choice - letter to Chairman.docx'
    ];

    console.log('🏫 EXTRACTING HEADERS AND FORMATTING FROM TEMPLATES');
    console.log('=' .repeat(60));

    for (const template of templates) {
        try {
            console.log(`\n📄 ANALYZING: ${template}`);
            console.log('-'.repeat(40));
            
            const templatePath = path.join(templatesDir, template);
            
            if (fs.existsSync(templatePath)) {
                const buffer = fs.readFileSync(templatePath);
                
                // Extract raw text to see headers
                const textResult = await mammoth.extractRawText({ buffer });
                const text = textResult.value;
                
                // Extract HTML to see formatting
                const htmlResult = await mammoth.convertToHtml({ buffer });
                const html = htmlResult.value;
                
                console.log('📋 HEADER CONTENT (First 10 lines):');
                const lines = text.split('\n').filter(line => line.trim().length > 0);
                lines.slice(0, 10).forEach((line, index) => {
                    console.log(`  ${index + 1}: ${line.trim()}`);
                });
                
                console.log('\n🎨 HTML FORMATTING SAMPLE:');
                const htmlLines = html.split('\n').slice(0, 15);
                htmlLines.forEach(line => {
                    if (line.trim()) {
                        console.log(`  ${line.trim()}`);
                    }
                });
                
                // Look for institutional information
                console.log('\n🏛️ INSTITUTIONAL INFORMATION FOUND:');
                const institutionKeywords = ['anna university', 'chennai', 'department', 'college', 'university', 'office', 'controller', 'examinations'];
                const foundInfo = [];
                
                lines.forEach(line => {
                    const lowerLine = line.toLowerCase();
                    institutionKeywords.forEach(keyword => {
                        if (lowerLine.includes(keyword)) {
                            foundInfo.push(line.trim());
                        }
                    });
                });
                
                if (foundInfo.length > 0) {
                    foundInfo.forEach(info => {
                        console.log(`  ✓ ${info}`);
                    });
                } else {
                    console.log('  ❌ No clear institutional headers found');
                }
                
            } else {
                console.log('❌ File not found!');
            }
        } catch (error) {
            console.error(`❌ Error analyzing ${template}:`, error.message);
        }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('HEADER EXTRACTION COMPLETE');
    console.log('Please review the extracted headers above.');
    console.log('If headers are not clear, please convert templates to PDF format.');
    console.log(`${'='.repeat(60)}`);
}

extractHeadersAndFormatting();
