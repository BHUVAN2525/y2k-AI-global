const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Scan = require('../models/Scan');
const pythonBridge = require('../services/pythonBridge');

const router = express.Router();

// Multer config
const upload = multer({
    dest: path.join(__dirname, '../uploads'),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// POST /api/analyze — upload and analyze a single file
router.post('/', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = req.file.path;
    const filename = req.file.originalname;
    const broadcast = req.app.get('broadcast');

    try {
        broadcast({ type: 'analysis_start', filename });

        // Step 1: Static analysis + ML
        broadcast({ type: 'analysis_step', step: 'static', filename });
        const analysisResult = await pythonBridge.analyze(filePath, filename);

        // Step 2: VirusTotal (optional)
        let vtResult = null;
        try {
            broadcast({ type: 'analysis_step', step: 'virustotal', filename });
            vtResult = await pythonBridge.analyzeVirusTotal(filePath, filename);
        } catch { /* VT not configured */ }

        // Step 3: SHAP explanation (executables only)
        let explanation = null;
        if (analysisResult.file_category === 'executable') {
            try {
                broadcast({ type: 'analysis_step', step: 'explain', filename });
                explanation = await pythonBridge.explain(filePath, filename);
            } catch { /* Explainer not available */ }
        }

        // Merge results
        const fullResult = {
            ...analysisResult,
            virustotal: vtResult,
            explanation
        };

        // Save to MongoDB
        let savedScan = null;
        try {
            savedScan = await Scan.create(fullResult);
        } catch { /* DB not available */ }

        broadcast({ type: 'analysis_complete', filename, is_malware: fullResult.is_malware });

        res.json({ ...fullResult, _id: savedScan?._id });
    } catch (err) {
        broadcast({ type: 'analysis_error', filename, error: err.message });
        res.status(500).json({ error: err.message });
    } finally {
        fs.unlink(filePath, () => { });
    }
});

module.exports = router;
