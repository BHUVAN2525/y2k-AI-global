const express = require('express');

const router = express.Router();

// Simple in-memory monitor state (the actual monitoring is in Python)
let monitorState = { running: false, directories: [], events: [] };

// POST /api/monitor/start
router.post('/start', (req, res) => {
    const { directories = [] } = req.body;
    monitorState = { running: true, directories, events: [] };
    const broadcast = req.app.get('broadcast');
    broadcast({ type: 'monitor_started', directories });
    res.json({ success: true, state: monitorState });
});

// POST /api/monitor/stop
router.post('/stop', (req, res) => {
    monitorState.running = false;
    const broadcast = req.app.get('broadcast');
    broadcast({ type: 'monitor_stopped' });
    res.json({ success: true, state: monitorState });
});

// GET /api/monitor/status
router.get('/status', (req, res) => {
    res.json(monitorState);
});

module.exports = router;
