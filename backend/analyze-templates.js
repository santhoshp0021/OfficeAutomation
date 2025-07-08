const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function analyzeTemplates() {
    const templatesDir = path.join(__dirname, '../frontend/public/templates');
    const templates = [
        'template1.docx',
        'Viva claim External Examiner.docx', 
        'Viva claim supervisor.docx',
        'Viva External member choice - letter to Chairman.docx',
        'Viva Letter to external.doc'
    ];

    for (const template of templates) {
        try {
            console.log(`\n=== ANALYZING: ${template} ===`);
            const templatePath = path.join(templatesDir, template);
            
            if (fs.existsSync(templatePath)) {
                const buffer = fs.readFileSync(templatePath);
                const result = await mammoth.extractRawText({ buffer });
                const text = result.value;
                
                console.log('Content length:', text.length);
                console.log('Template variables found:');
                
                // Find template variables (usually in {variable} format)
                const variables = text.match(/\{[^}]+\}/g) || [];
                variables.forEach(variable => {
                    console.log(`  - ${variable}`);
                });
                
                console.log('\nSignature-related content:');
                // Look for signature-related text
                const lines = text.split('\n');
                lines.forEach((line, index) => {
                    const lowerLine = line.toLowerCase();
                    if (lowerLine.includes('signature') || 
                        lowerLine.includes('sign') ||
                        lowerLine.includes('coordinator') ||
                        lowerLine.includes('supervisor') || 
                        lowerLine.includes('examiner') ||
                        lowerLine.includes('chairman') ||
                        lowerLine.includes('admin') ||
                        lowerLine.includes('principal') ||
                        lowerLine.includes('head')) {
                        console.log(`  Line ${index + 1}: ${line.trim()}`);
                    }
                });
                
                console.log('\n' + '='.repeat(50));
            } else {
                console.log('File not found!');
            }
        } catch (error) {
            console.error(`Error analyzing ${template}:`, error.message);
        }
    }
}

analyzeTemplates();
