const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Scan = require('../models/Scan');
const mlEngine = require('../services/mlEngine');

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

        // Step 1: Static analysis + ML (Node.js Native)
        broadcast({ type: 'analysis_step', step: 'static', filename });
        const analysisResult = await mlEngine.analyzeFile(filePath, filename);

        // Merge results
        const fullResult = {
            ...analysisResult,
            virustotal: null, // Deprecated in favor of ThreatIntelAgent or external APIs
            explanation: null // SHAP explainer requires Python Scikit-Learn; simulated in ML engine details
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
