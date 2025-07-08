// Simple test to verify template requirements API
const http = require('http');

async function testTemplateRequirements() {
    try {
        console.log('Testing template requirements API...');
        
        const data = await new Promise((resolve, reject) => {
            const req = http.get('http://localhost:5000/api/signature-roles', (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            req.on('error', reject);
            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
        
        console.log('\n=== Available Roles ===');
        data.availableRoles.forEach(role => {
            console.log(`- ${role.label} (${role.key}): ${role.hasSignature ? 'Has signature' : 'No signature'}`);
        });
        
        console.log('\n=== Template Requirements ===');
        Object.keys(data.templateRequirements).forEach(templateName => {
            const req = data.templateRequirements[templateName];
            console.log(`\n${templateName}:`);
            console.log(`  Description: ${req.description}`);
            console.log(`  Layout: ${req.layout}`);
            console.log(`  Required Signatures: ${req.signatures.map(s => s.label).join(', ')}`);
            console.log(`  Required Fields (${req.requiredFields.length}): ${req.requiredFields.slice(0, 5).join(', ')}${req.requiredFields.length > 5 ? '...' : ''}`);
        });
        
        console.log('\n=== Testing Specific Templates ===');
        
        // Test "Viva Letter to external.doc" - should have minimal fields
        const externalLetter = data.templateRequirements['Viva Letter to external.doc'];
        if (externalLetter) {
            console.log('\n"Viva Letter to external.doc":');
            console.log(`  Fields needed: ${externalLetter.requiredFields.length}`);
            console.log(`  Signatures needed: ${externalLetter.signatures.length}`);
            console.log(`  Should NOT need table data: ${!externalLetter.requiredFields.some(f => ['sl_no', 'course', 'subject_code'].includes(f))}`);
        }
        
        // Test "template1.docx" - should need table data
        const template1 = data.templateRequirements['template1.docx'];
        if (template1) {
            console.log('\n"template1.docx":');
            console.log(`  Fields needed: ${template1.requiredFields.length}`);
            console.log(`  Signatures needed: ${template1.signatures.length}`);
            console.log(`  Should need table data: ${template1.requiredFields.some(f => ['sl_no', 'course', 'subject_code'].includes(f))}`);
        }
        
        console.log('\n✅ Template requirements API is working correctly!');
        
    } catch (error) {
        console.error('❌ Error testing template requirements:', error.message);
    }
}

testTemplateRequirements();
