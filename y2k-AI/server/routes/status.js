const express = require('express');
const sandboxService = require('../services/sandboxService');

const router = express.Router();

// GET /api/status — system health
router.get('/', async (req, res) => {

    let dbStatus = 'unavailable';
    try {
        const mongoose = require('mongoose');
        dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    } catch { }

    const sshSessions = sandboxService.listSessions().length;

    res.json({
        timestamp: new Date().toISOString(),
        services: {
            database: dbStatus,
            backend: 'operational',
            ssh_sessions: sshSessions
        },
        components: {
            ml_engine: "operational",
            anomaly_detector: "operational",
            memory_forensics: "operational",
            self_heal: "operational",
            batch_scanner: "operational"
        }
    });
});

module.exports = router;
