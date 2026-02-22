const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const connectDB = require('../config/db');

// GET /api/digital-twin
// returns current infrastructure nodes for the UI
router.get('/', async (req, res) => {
    try {
        if (!connectDB.isConnected()) {
            // require MongoDB for true infrastructure data
            return res.status(503).json({ error: 'MongoDB not connected; start the database to load digital twin assets.' });
        }

        const assets = await Asset.find();

        // Map assets to Digital Twin node format
        const infrastructure = assets.map((a, i) => ({
            id: a._id || `node_${i}`,
            name: a.hostname,
            ip: a.ip,
            type: a.type === 'network_device' ? 'firewall' : a.type,
            status: a.vulnerabilities.some(v => v.severity === 'critical') ? 'critical' :
                a.vulnerabilities.length > 0 ? 'warning' : 'healthy',
            cpu: a.cpu || 0,
            mem: a.mem || 0,
            risk: a.vulnerabilities.length * 15 + (100 - a.patchLevel),
            connections: a.connections || 0
        }));

        res.json({ infrastructure });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/digital-twin/attack-paths
// computes potential attack paths based on vulnerabilities
router.get('/attack-paths', async (req, res) => {
    try {
        if (!connectDB.isConnected()) {
            return res.status(503).json({ error: 'MongoDB not connected; cannot compute attack paths.' });
        }
        const assets = await Asset.find();

        const paths = [];
        const external = assets.filter(a => (a.tags && (a.tags.includes('dmz') || a.tags.includes('edge'))) || a.type === 'server');
        const internal = assets.filter(a => a.type === 'database' || (a.tags && a.tags.includes('internal')));

        external.forEach(ext => {
            internal.forEach(int => {
                if (ext.vulnerabilities && ext.vulnerabilities.length > 0) {
                    paths.push({
                        id: `path_${ext._id}_${int._id}`,
                        from: ext.hostname,
                        to: int.hostname,
                        method: ext.vulnerabilities[0].cve || 'Lateral Movement',
                        probability: (Math.random() * 0.8 + 0.1).toFixed(2),
                        risk: 'high'
                    });
                }
            });
        });

        res.json({ paths });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/digital-twin/nodes — add/update nodes
router.post('/nodes', async (req, res) => {
    try {
        if (!connectDB.isConnected()) {
            return res.status(503).json({ error: 'MongoDB not connected; cannot add node.' });
        }
        const asset = await Asset.findOneAndUpdate(
            { hostname: req.body.hostname },
            req.body,
            { upsert: true, new: true }
        );
        res.json(asset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/digital-twin/vulnerabilities — tag node vulnerabilities
router.post('/vulnerabilities', async (req, res) => {
    try {
        const { hostname, vulnerability } = req.body;
        if (!connectDB.isConnected()) {
            return res.status(503).json({ error: 'MongoDB not connected; cannot tag vulnerability.' });
        }
        const asset = await Asset.findOneAndUpdate(
            { hostname },
            { $push: { vulnerabilities: vulnerability } },
            { new: true }
        );
        res.json(asset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
