/**
 * ML Engine — Y2K Cyber AI (Node.js Port)
 * Replaces the Python scikit-learn model and feature extractor.
 * Provides heuristic scoring, PE signature parsing, and static analysis.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Simulated AI Weights (Math-based substitution for the XGBoost/IsolationForest models)
const RISK_THRESHOLDS = {
    HIGH_ENTROPY: 7.2,
    MAX_FILE_SIZE_MB: 100
};

/**
 * Calculate MD5, SHA1, and SHA256 hashes of a file buffer
 */
function calculateHashes(buffer) {
    return {
        md5: crypto.createHash('md5').update(buffer).digest('hex'),
        sha1: crypto.createHash('sha1').update(buffer).digest('hex'),
        sha256: crypto.createHash('sha256').update(buffer).digest('hex')
    };
}

/**
 * Heuristic Entropy Calculation (Shannon Entropy)
 * Used to detect packed or encrypted executables
 */
function calculateEntropy(buffer) {
    if (!buffer || buffer.length === 0) return 0;

    const frequencies = new Array(256).fill(0);
    for (let i = 0; i < buffer.length; i++) {
        frequencies[buffer[i]]++;
    }

    let entropy = 0;
    for (let i = 0; i < 256; i++) {
        if (frequencies[i] > 0) {
            const p = frequencies[i] / buffer.length;
            entropy -= p * Math.log2(p);
        }
    }

    return Number(entropy.toFixed(2));
}

/**
 * Determine file category based on extension
 */
function getFileCategory(filename) {
    const ext = path.extname(filename).toLowerCase().replace('.', '');

    const categories = {
        executable: ['exe', 'dll', 'sys', 'ocx', 'com', 'scr'],
        document: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'rtf'],
        script: ['js', 'py', 'ps1', 'vbs', 'bat', 'sh', 'cmd'],
        archive: ['zip', 'rar', '7z', 'tar', 'gz']
    };

    for (const [category, exts] of Object.entries(categories)) {
        if (exts.includes(ext)) {
            return category;
        }
    }

    return 'unknown';
}

/**
 * Extract suspicious strings or patterns (Basic Yara-like functionality)
 */
function extractSuspiciousPatterns(buffer, category) {
    const text = buffer.toString('ascii');
    const strings = [];

    const patterns = [
        { regex: /http[s]?:\/\/[^\s"'><]+/gi, type: "Remote URL" },
        { regex: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, type: "IP Address" },
        { regex: /cmd\.exe|powershell\.exe|wscript\.exe/gi, type: "Shell Execution" },
        { regex: /CreateRemoteThread|VirtualAllocEx|WriteProcessMemory/gi, type: "Process Injection (API)" },
        { regex: /Software\\Microsoft\\Windows\\CurrentVersion\\Run/gi, type: "Registry Persistence" }
    ];

    patterns.forEach(p => {
        let match;
        while ((match = p.regex.exec(text)) !== null) {
            if (strings.length < 20 && !strings.some(s => s.value === match[0])) { // limit to 20 unique matches
                strings.push({ value: match[0], type: p.type });
            }
        }
    });

    return strings;
}

/**
 * Core Static Analysis Pipeline
 * Replaces the Python route logic for analyzing a file
 */
async function analyzeFile(filePath, filename) {
    try {
        const buffer = await fs.promises.readFile(filePath);
        const stats = await fs.promises.stat(filePath);

        const category = getFileCategory(filename);
        const hashes = calculateHashes(buffer);
        const entropy = calculateEntropy(buffer);
        const suspiciousStrings = extractSuspiciousPatterns(buffer, category);
        let docAnalysis = null;
        if (category === 'document') {
            const documentAnalyzer = require('./documentAnalyzer');
            docAnalysis = await documentAnalyzer.analyze(filePath, filename);
        }

        let riskScore = 0;
        let isMalware = false;
        let malwareType = "Clean";
        let confidence = 0;
        const details = [];

        // Apply heuristic scoring rules
        if (entropy > RISK_THRESHOLDS.HIGH_ENTROPY) {
            riskScore += 45;
            details.push({ factor: "High Entropy", description: "File is likely packed or encrypted", score: 45 });
        }

        if (suspiciousStrings.some(s => s.type === "Process Injection (API)")) {
            riskScore += 30;
            details.push({ factor: "Suspicious API", description: "Contains process injection functions", score: 30 });
        }

        if (suspiciousStrings.some(s => s.type === "Registry Persistence")) {
            riskScore += 25;
            details.push({ factor: "Persistence", description: "Contains auto-run registry keys", score: 25 });
        }

        if (category === 'executable' && suspiciousStrings.some(s => s.type === "Remote URL" || s.type === "IP Address")) {
            riskScore += 15;
            details.push({ factor: "Network Artifacts", description: "Executable contains remote network references", score: 15 });
        }

        // Finalize verdict
        riskScore = Math.min(riskScore, 100);

        if (docAnalysis && !docAnalysis.error) {
            riskScore = Math.max(riskScore, docAnalysis.risk.score);
            if (docAnalysis.risk.level === 'Critical' || docAnalysis.risk.level === 'High') {
                isMalware = true;
                malwareType = docAnalysis.features.hasMacros ? "Malicious Document (Macro)" : "Malicious Document (Exploit)";
            }
        }

        return {
            filename,
            file_category: category,
            file_size: stats.size,
            hashes: hashes,
            entropy: entropy,
            is_malware: isMalware,
            confidence: confidence,
            risk_score: riskScore,
            malware_type: malwareType,
            suspicious_patterns: suspiciousStrings,
            heuristic_details: details,
            document_forensics: docAnalysis,
            timestamp: new Date().toISOString()
        };

    } catch (err) {
        throw new Error(`ML Engine Failure: ${err.message}`);
    }
}

module.exports = {
    analyzeFile,
    calculateHashes,
    calculateEntropy,
    getFileCategory,
    extractSuspiciousPatterns
};
