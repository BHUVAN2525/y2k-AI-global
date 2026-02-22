/**
 * Document Analyzer Service
 * Transpiled from document_analyzer.py for the Pure MERN Stack.
 * 
 * Performs static forensic analysis on document formats (Office, PDF, RTF)
 * without requiring external Python binaries or heavy native dependencies.
 */
const fs = require('fs');
const path = require('path');

class DocumentAnalyzer {
    constructor() {
        // Suspicious keywords ported from Python version
        this.VBA_KEYWORDS = [
            'Shell', 'CreateObject', 'WScript.Shell', 'Environ',
            'powershell', 'cmd.exe', 'rundll32', 'bitsadmin', 'certutil',
            'GetObject', 'ExecuteExcel4Macro', 'ExecuteStatement', 'AutoExec',
            'Auto_Open', 'Document_Open', 'Workbook_Open', 'WindowsFolder',
            'ChromeInstall', 'Call Shell', 'ShellExecute', 'WinExec',
            'URLDownloadToFile', 'WinHttpRequest', 'XMLHTTP', 'ActiveXObject',
            'hidden', 'visibl', 'CreateThread', 'RegRead', 'RegWrite'
        ];

        this.PDF_KEYWORDS = [
            '/JavaScript', '/JS', '/Launch', '/OpenAction', '/AA', '/AcroForm',
            '/URI', '/SubmitForm', '/JBIG2Decode', '/RichMedia',
            'getAnnots', '/ObjStm', '/XFA'
        ];

        this.PATTERNS = {
            url: /https?:\/\/[^\s"'><\]]+/gi,
            ip: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
            hex: /0x[0-9A-Fa-f]{2,}/g,
            base64: /[A-Za-z0-9+/]{40,}=*/g
        };
    }

    async analyze(filePath, filename) {
        try {
            const buffer = await fs.promises.readFile(filePath);
            const stats = await fs.promises.stat(filePath);

            const results = {
                filename: filename || path.basename(filePath),
                fileSize: stats.size,
                type: 'unknown',
                indicators: [],
                urls: [],
                ips: [],
                risk: { score: 0, level: 'Low' },
                features: {
                    hasMacros: false,
                    hasSuspiciousObjects: false,
                    isProtected: false
                }
            };

            // Detect format via Magic Bytes
            const magic = buffer.slice(0, 8);

            if (magic.toString('hex').startsWith('25504446')) { // %PDF
                this._analyzePDF(buffer, results);
            } else if (magic.toString('hex').startsWith('504b0304')) { // PK.. (Zip/OOXML)
                this._analyzeOOXML(buffer, results);
            } else if (magic.toString('hex').startsWith('d0cf11e0')) { // OLE (Old Office)
                this._analyzeOLE(buffer, results);
            } else if (buffer.includes('{\\rtf')) {
                this._analyzeRTF(buffer, results);
            } else {
                this._analyzeGeneric(buffer, results);
            }

            this._calculateRisk(results);
            return results;

        } catch (err) {
            console.error('[DocumentAnalyzer] Error:', err);
            return { error: err.message };
        }
    }

    _analyzePDF(buffer, results) {
        results.type = 'PDF Document';
        const content = buffer.toString('binary');

        this.PDF_KEYWORDS.forEach(kw => {
            if (content.includes(kw)) {
                results.indicators.push(`Suspicious PDF Keyword: ${kw}`);
                results.features.hasSuspiciousObjects = true;
            }
        });

        if (content.includes('/JavaScript') || content.includes('/JS')) {
            results.indicators.push('Contains JavaScript (Automated execution risk)');
        }

        if (content.includes('/Launch') || content.includes('/OpenAction')) {
            results.indicators.push('Contains Auto-Launch actions');
        }

        this._extractMetadata(content, results);
    }

    _analyzeOOXML(buffer, results) {
        results.type = 'Office Open XML (DOCX/XLSX/PPTX)';
        const content = buffer.toString('binary');

        // Check for vbaProject.bin (Macros) in the zip structure
        if (content.includes('vbaProject.bin')) {
            results.features.hasMacros = true;
            results.indicators.push('Contains VBA Macros (vbaProject.bin detected)');
        }

        // Check for external relationships in .rels files
        if (content.includes('TargetMode="External"')) {
            results.indicators.push('Contains external template or relationship (Phishing/Template Injection risk)');
        }

        this._extractMetadata(content, results);
    }

    _analyzeOLE(buffer, results) {
        results.type = 'Legacy Microsoft Office (OLE)';
        const content = buffer.toString('binary');

        if (content.includes('Macros') || content.includes('VBA')) {
            results.features.hasMacros = true;
            results.indicators.push('Contains Legacy VBA Macros');
        }

        this.VBA_KEYWORDS.forEach(kw => {
            if (content.includes(kw)) {
                results.indicators.push(`Suspicious VBA Keyword: ${kw}`);
            }
        });

        if (content.includes('\x01Ole10Native')) {
            results.indicators.push('Contains embedded OLE10Native object (possible shellcode dropper)');
            results.features.hasSuspiciousObjects = true;
        }

        this._extractMetadata(content, results);
    }

    _analyzeRTF(buffer, results) {
        results.type = 'Rich Text Format (RTF)';
        const content = buffer.toString('binary');

        if (content.includes('\\objdata') || content.includes('\\objemb')) {
            results.indicators.push('Contains embedded OLE objects (Legacy exploit risk)');
            results.features.hasSuspiciousObjects = true;
        }

        this._extractMetadata(content, results);
    }

    _analyzeGeneric(buffer, results) {
        const content = buffer.toString('binary');
        this._extractMetadata(content, results);
    }

    _extractMetadata(content, results) {
        // Extract URLs
        const urls = content.match(this.PATTERNS.url) || [];
        results.urls = [...new Set(urls)].slice(0, 15);

        // Extract IPs
        const ips = content.match(this.PATTERNS.ip) || [];
        results.ips = [...new Set(ips)].slice(0, 10);

        // Check for suspicious domains in URLs
        const susDomains = ['pastebin', 'githubusercontent', 'ngrok', 'bit.ly', 'goo.gl', 'discordapp'];
        results.urls.forEach(url => {
            if (susDomains.some(d => url.toLowerCase().includes(d))) {
                results.indicators.push(`URL to suspicious hosting service: ${url}`);
            }
        });
    }

    _calculateRisk(results) {
        let score = 0;

        score += results.indicators.length * 8;
        if (results.features.hasMacros) score += 35;
        if (results.features.hasSuspiciousObjects) score += 25;
        score += results.urls.length * 2;

        results.risk.score = Math.min(score, 100);

        if (results.risk.score > 75) results.risk.level = 'Critical';
        else if (results.risk.score > 50) results.risk.level = 'High';
        else if (results.risk.score > 25) results.risk.level = 'Medium';
        else results.risk.level = 'Low';
    }
}

module.exports = new DocumentAnalyzer();
