const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Scan = require('../models/Scan');
const pythonBridge = require('../services/pythonBridge');
const { broadcast } = require('../services/ws');

const router = express.Router();

const upload = multer({
    dest: path.join(__dirname, '../uploads'),
    limits: { fileSize: 50 * 1024 * 1024 }
});

// POST /api/batch — analyze multiple files
router.post('/', upload.array('files', 50), async (req, res) => {
    if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });

    const filePaths = req.files.map(f => ({ path: f.path, name: f.originalname }));

    broadcast({ type: 'batch_start', count: filePaths.length });

    try {
        const batchResult = await pythonBridge.batch(filePaths);
        const results = batchResult.results || [];

        // Save each result to MongoDB
        const savedResults = [];
        for (const result of results) {
            if (!result.error) {
                try {
                    const saved = await Scan.create(result);
                    savedResults.push({ ...result, _id: saved._id });
                } catch {
                    savedResults.push(result);
                }
            } else {
                savedResults.push(result);
            }
        }

        broadcast({ type: 'batch_complete', count: results.length });
        res.json({ results: savedResults, total: savedResults.length });
    } catch (err) {
        broadcast({ type: 'batch_error', error: err.message });
        res.status(500).json({ error: err.message });
    } finally {
        filePaths.forEach(({ path: p }) => fs.unlink(p, () => { }));
    }
});

module.exports = router;
