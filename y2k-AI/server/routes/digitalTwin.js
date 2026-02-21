/*
 * Digital Twin data endpoint
 * returns current infrastructure nodes for the UI
 * In production this would query a CMDB or monitoring service.
 */
const express = require('express');
const router = express.Router();

// GET /api/digital-twin
router.get('/', (req, res) => {
    // stub response, empty list by default
    res.json({ infrastructure: [] });
});

module.exports = router;
