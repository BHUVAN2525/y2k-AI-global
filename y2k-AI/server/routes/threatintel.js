/**
 * Threat Intelligence Routes — IOC lookup, feed aggregation, correlation
 */
const express = require('express');
const router = express.Router();
const threatIntelService = require('../services/threatIntelService');

// GET /api/threatintel/status — feed status
router.get('/status', (req, res) => {
    res.json(threatIntelService.getStatus());
});

// GET /api/threatintel/feeds — open threat feed data
router.get('/feeds', async (req, res) => {
    try {
        const feeds = await threatIntelService.getOpenFeeds();
        res.json(feeds);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/threatintel/hash/:hash — enrich a hash
router.get('/hash/:hash', async (req, res) => {
    try {
        const result = await threatIntelService.enrichHash(req.params.hash);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/threatintel/ip/:ip — enrich an IP
router.get('/ip/:ip', async (req, res) => {
    try {
        const result = await threatIntelService.enrichIP(req.params.ip);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/threatintel/correlate — correlate scan result with global intel
router.post('/correlate', async (req, res) => {
    try {
        const result = await threatIntelService.correlate(req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
