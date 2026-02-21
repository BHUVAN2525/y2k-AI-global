const express = require('express');
const pythonBridge = require('../services/pythonBridge');

const router = express.Router();

// GET /api/status — system health
router.get('/', async (req, res) => {
    const pythonHealth = await pythonBridge.health();

    let dbStatus = 'unavailable';
    try {
        const mongoose = require('mongoose');
        dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    } catch { }

    res.json({
        timestamp: new Date().toISOString(),
        services: {
            python_api: pythonHealth.available ? 'operational' : 'unavailable',
            database: dbStatus,
            node_server: 'operational'
        },
        components: pythonHealth.components || {},
        python_api_url: process.env.PYTHON_API_URL
    });
});

module.exports = router;
