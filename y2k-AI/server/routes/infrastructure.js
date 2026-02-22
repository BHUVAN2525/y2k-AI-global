const express = require('express');
const router = express.Router();
const infra = require('../services/infrastructureService');

// Apply auth to all infrastructure routes
// router.use(authenticate); // REMOVED

// GET /api/infra/assets
router.get('/assets', async (req, res) => {
    try {
        const assets = await infra.getAssets();
        res.json(assets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/infra/stats
router.get('/stats', async (req, res) => {
    try {
        const [vulns, patch] = await Promise.all([
            infra.getVulnerabilitySummary(),
            infra.getPatchCompliance()
        ]);
        res.json({ vulnerabilities: vulns, average_patch_level: patch });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/infra/assets
router.post('/assets', async (req, res) => {
    try {
        const asset = await infra.addAsset(req.body);
        res.status(201).json(asset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
