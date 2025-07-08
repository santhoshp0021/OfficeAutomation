const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const sharp = require('sharp');

/**
 * Header Management Utility
 * Handles extraction of official headers from PDF templates and integration into generated documents
 */

class HeaderManager {
    constructor() {
        this.logoPath = path.join(__dirname, '../uploads/image.png');
        this.extractedHeaders = new Map(); // Cache for extracted headers
        this.officialHeaderHTML = null; // Standard header HTML
        this.initializeOfficialHeader();
    }

    /**
     * Initialize the official header with Anna University branding
     */
    async initializeOfficialHeader() {
        try {
            // Check if logo exists
            if (!fs.existsSync(this.logoPath)) {
                console.warn('Logo file not found at:', this.logoPath);
                return;
            }

            // Get logo as base64 for embedding
            const logoBuffer = fs.readFileSync(this.logoPath);
            const logoBase64 = logoBuffer.toString('base64');

            // Create standard official header
            this.officialHeaderHTML = `
                <div class="official-header" style="
                    text-align: center; 
                    margin-bottom: 30px; 
                    padding: 20px 0; 
                    border-bottom: 2px solid #003366;
                    font-family: 'Times New Roman', serif;
                ">
                    <table style="width: 100%; border: none;">
                        <tr style="border: none;">
                            <td style="width: 15%; text-align: center; border: none; vertical-align: middle;">
                                <img src="data:image/png;base64,${logoBase64}" 
                                     style="max-width: 80px; max-height: 80px; object-fit: contain;" 
                                     alt="Anna University Logo" />
                            </td>
                            <td style="width: 70%; text-align: center; border: none; vertical-align: middle;">
                                <h1 style="
                                    margin: 0; 
                                    color: #003366; 
                                    font-size: 24px; 
                                    font-weight: bold;
                                    letter-spacing: 1px;
                                ">ANNA UNIVERSITY</h1>
                                <h2 style="
                                    margin: 5px 0; 
                                    color: #666; 
                                    font-size: 16px; 
                                    font-weight: normal;
                                ">CHENNAI - 600 025</h2>
                                <p style="
                                    margin: 5px 0; 
                                    color: #666; 
                                    font-size: 14px;
                                    font-weight: bold;
                                ">DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING</p>
                            </td>
                            <td style="width: 15%; border: none;"></td>
                        </tr>
                    </table>
                </div>
            `;

            console.log('Official header initialized successfully');
        } catch (error) {
            console.error('Error initializing official header:', error);
        }
    }

    /**
     * Extract header information from a PDF file
     */
    async extractHeaderFromPDF(pdfPath) {
        try {
            if (!fs.existsSync(pdfPath)) {
                console.warn('PDF file not found:', pdfPath);
                return null;
            }

            const pdfBuffer = fs.readFileSync(pdfPath);
            const pdfData = await pdfParse(pdfBuffer);
            
            // Extract text from first page (headers usually on first page)
            const text = pdfData.text;
            const lines = text.split('\n').slice(0, 10); // First 10 lines likely contain header
            
            // Look for university-related keywords
            const headerInfo = {
                universityName: '',
                department: '',
                address: '',
                additionalInfo: []
            };

            lines.forEach(line => {
                const upperLine = line.trim().toUpperCase();
                if (upperLine.includes('ANNA UNIVERSITY') || upperLine.includes('UNIVERSITY')) {
                    headerInfo.universityName = line.trim();
                } else if (upperLine.includes('CHENNAI') || upperLine.includes('600 025')) {
                    headerInfo.address = line.trim();
                } else if (upperLine.includes('DEPARTMENT') || upperLine.includes('COMPUTER SCIENCE')) {
                    headerInfo.department = line.trim();
                } else if (line.trim() && !upperLine.includes('PAGE') && !upperLine.includes('©')) {
                    headerInfo.additionalInfo.push(line.trim());
                }
            });

            // Cache the extracted header
            this.extractedHeaders.set(pdfPath, headerInfo);
            
            console.log('Extracted header from PDF:', pdfPath, headerInfo);
            return headerInfo;

        } catch (error) {
            console.error('Error extracting header from PDF:', error);
            return null;
        }
    }

    /**
     * Generate HTML header based on template requirements
     */
    generateHeaderHTML(templateName, extractedInfo = null) {
        // If we have a standard official header, use it
        if (this.officialHeaderHTML) {
            return this.officialHeaderHTML;
        }

        // Fallback to extracted header or basic header
        if (extractedInfo) {
            return this.generateHeaderFromExtractedInfo(extractedInfo);
        }

        // Basic fallback header
        return `
            <div class="document-header" style="
                text-align: center; 
                margin-bottom: 30px; 
                padding: 20px 0; 
                border-bottom: 1px solid #000;
                font-family: 'Times New Roman', serif;
            ">
                <h1 style="margin: 0; font-size: 20px; font-weight: bold;">ANNA UNIVERSITY</h1>
                <p style="margin: 5px 0; font-size: 14px;">CHENNAI - 600 025</p>
                <p style="margin: 5px 0; font-size: 12px;">DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING</p>
            </div>
        `;
    }

    /**
     * Generate header HTML from extracted PDF information
     */
    generateHeaderFromExtractedInfo(extractedInfo) {
        return `
            <div class="extracted-header" style="
                text-align: center; 
                margin-bottom: 30px; 
                padding: 20px 0; 
                border-bottom: 1px solid #000;
                font-family: 'Times New Roman', serif;
            ">
                ${extractedInfo.universityName ? `<h1 style="margin: 0; font-size: 20px; font-weight: bold;">${extractedInfo.universityName}</h1>` : ''}
                ${extractedInfo.address ? `<p style="margin: 5px 0; font-size: 14px;">${extractedInfo.address}</p>` : ''}
                ${extractedInfo.department ? `<p style="margin: 5px 0; font-size: 12px;">${extractedInfo.department}</p>` : ''}
                ${extractedInfo.additionalInfo.length > 0 ? 
                    extractedInfo.additionalInfo.map(info => 
                        `<p style="margin: 2px 0; font-size: 11px;">${info}</p>`
                    ).join('') : ''
                }
            </div>
        `;
    }

    /**
     * Process all available PDF templates to extract headers
     */
    async processAllPDFTemplates() {
        const uploadsDir = path.join(__dirname, '../uploads');
        const results = {};

        try {
            const files = fs.readdirSync(uploadsDir);
            const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

            for (const pdfFile of pdfFiles) {
                const pdfPath = path.join(uploadsDir, pdfFile);
                const headerInfo = await this.extractHeaderFromPDF(pdfPath);
                if (headerInfo) {
                    results[pdfFile] = headerInfo;
                }
            }

            console.log('Processed PDF templates:', Object.keys(results));
            return results;

        } catch (error) {
            console.error('Error processing PDF templates:', error);
            return {};
        }
    }

    /**
     * Get the official header HTML
     */
    getOfficialHeader() {
        return this.officialHeaderHTML || this.generateHeaderHTML('default');
    }

    /**
     * Get header for specific template
     */
    async getHeaderForTemplate(templateName) {
        // Always use the official header for consistency
        return this.getOfficialHeader();
    }

    /**
     * Add header styles to the document CSS
     */
    getHeaderStyles() {
        return `
            .official-header {
                page-break-inside: avoid;
                margin-bottom: 30px;
            }
            
            .official-header table {
                border: none !important;
                margin: 0 !important;
            }
            
            .official-header td {
                border: none !important;
                padding: 5px !important;
            }
            
            .document-header, .extracted-header {
                page-break-inside: avoid;
                margin-bottom: 30px;
            }
            
            @media print {
                .official-header, .document-header, .extracted-header {
                    margin-bottom: 20px;
                }
            }
        `;
    }

    /**
     * Validate logo file
     */
    async validateLogo() {
        try {
            if (!fs.existsSync(this.logoPath)) {
                return { valid: false, error: 'Logo file not found' };
            }

            const stats = fs.statSync(this.logoPath);
            if (stats.size > 1024 * 1024) { // 1MB limit
                return { valid: false, error: 'Logo file too large' };
            }

            // Try to process with sharp to validate
            const metadata = await sharp(this.logoPath).metadata();
            
            return {
                valid: true,
                metadata: {
                    width: metadata.width,
                    height: metadata.height,
                    format: metadata.format,
                    size: stats.size
                }
            };

        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
}

module.exports = HeaderManager;
