const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function analyzeTemplateFields() {
    const templatesDir = path.join(__dirname, '../frontend/public/templates');
    const templates = [
        'template1.docx',
        'Viva claim External Examiner.docx', 
        'Viva claim supervisor.docx',
        'Viva External member choice - letter to Chairman.docx'
    ];

    for (const template of templates) {
        try {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`ANALYZING TEMPLATE: ${template}`);
            console.log(`${'='.repeat(60)}`);
            
            const templatePath = path.join(templatesDir, template);
            
            if (fs.existsSync(templatePath)) {
                const buffer = fs.readFileSync(templatePath);
                const result = await mammoth.extractRawText({ buffer });
                const text = result.value;
                
                console.log('\n📋 TEMPLATE VARIABLES FOUND:');
                const variables = text.match(/\{[^}]+\}/g) || [];
                if (variables.length > 0) {
                    variables.forEach(variable => {
                        console.log(`  • ${variable}`);
                    });
                } else {
                    console.log('  ❌ No template variables found - this template may need manual data entry');
                }
                
                console.log('\n📝 DOCUMENT STRUCTURE:');
                const lines = text.split('\n').filter(line => line.trim().length > 0);
                lines.forEach((line, index) => {
                    if (index < 20) { // Show first 20 meaningful lines
                        console.log(`  ${index + 1}: ${line.trim()}`);
                    }
                });
                
                console.log('\n🖊️ SIGNATURE AREAS IDENTIFIED:');
                const signatureLines = lines.filter(line => {
                    const lowerLine = line.toLowerCase();
                    return lowerLine.includes('signature') || 
                           lowerLine.includes('chief') ||
                           lowerLine.includes('head') ||
                           lowerLine.includes('coordinator') ||
                           lowerLine.includes('chairman') ||
                           lowerLine.includes('examiner') ||
                           lowerLine.includes('supervisor');
                });
                
                if (signatureLines.length > 0) {
                    signatureLines.forEach(line => {
                        console.log(`  • ${line.trim()}`);
                    });
                } else {
                    console.log('  ❌ No clear signature areas identified');
                }
                
            } else {
                console.log('❌ File not found!');
            }
        } catch (error) {
            console.error(`❌ Error analyzing ${template}:`, error.message);
        }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('ANALYSIS COMPLETE');
    console.log(`${'='.repeat(60)}`);
}

analyzeTemplateFields();
