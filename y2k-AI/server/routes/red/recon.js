/**
 * Red Mode — Recon Engine
 * Port scanning, subdomain enumeration, banner grabbing
 * ⚠️ AUTHORIZED LAB SIMULATION MODE ONLY
 */
const express = require('express');
const router = express.Router();
const dns = require('dns').promises;
const net = require('net');
const { exec } = require('child_process');
const ReconResult = require('../../models/ReconResult');
const connectDB = require('../../config/db');
const { broadcast } = require('../../services/ws');

// fallbacks if database unavailable
const inMemoryRecons = [];

// Common ports to scan (fast scan set)
const COMMON_PORTS = [21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443, 445, 993, 995, 1723, 3306, 3389, 5900, 8080, 8443, 8888];

// Service fingerprints
const SERVICE_MAP = {
    21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS',
    80: 'HTTP', 110: 'POP3', 135: 'RPC', 139: 'NetBIOS', 143: 'IMAP',
    443: 'HTTPS', 445: 'SMB', 993: 'IMAPS', 995: 'POP3S', 1723: 'PPTP',
    3306: 'MySQL', 3389: 'RDP', 5900: 'VNC', 8080: 'HTTP-Alt', 8443: 'HTTPS-Alt', 8888: 'HTTP-Alt2'
};

// Known risky services
const RISKY_SERVICES = {
    21: 'high', 23: 'critical', 135: 'high', 139: 'high',
    445: 'critical', 1723: 'medium', 3389: 'high', 5900: 'high'
};

// Scan a single port with timeout
function scanPort(host, port, timeout = 1500) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let banner = '';
        socket.setTimeout(timeout);
        socket.on('connect', () => {
            socket.write('HEAD / HTTP/1.0\r\n\r\n');
        });
        socket.on('data', (data) => {
            banner = data.toString().slice(0, 200);
            socket.destroy();
        });
        socket.on('timeout', () => { socket.destroy(); resolve(null); });
        socket.on('error', () => resolve(null));
        socket.on('close', () => {
            resolve({ port, service: SERVICE_MAP[port] || 'unknown', banner: banner.trim() });
        });
        socket.connect(port, host);
    });
}

// POST /api/red/recon — start recon scan
router.post('/recon', async (req, res) => {
    try {
        const { target, scan_type = 'full', ports, session_id } = req.body;
        if (!target) return res.status(400).json({ error: 'target is required' });

        // Safety check — only allow private IPs and localhost in lab mode
        const isPrivate = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|localhost)/.test(target);
        if (!isPrivate && process.env.NODE_ENV !== 'development') {
            return res.status(403).json({ error: 'Red Mode only allows scanning private/lab IPs. Set target to a local IP.' });
        }

        // Create recon record (persist if DB available, otherwise stub)
        let recon;
        if (connectDB.isConnected()) {
            recon = await ReconResult.create({ target, scan_type, session_id, status: 'running' });
        } else {
            recon = { _id: `local-${Date.now()}`, target, scan_type, session_id, status: 'running', timestamp: new Date() };
            inMemoryRecons.push(recon);
        }

        // Broadcast start
        broadcast({ type: 'recon_started', recon_id: recon._id, target });

        // Run scan async
        (async () => {
            try {
                const portsToScan = ports || COMMON_PORTS;
                const scanPromises = portsToScan.map(p => scanPort(target, p, 1200));
                const results = await Promise.all(scanPromises);
                const openPorts = results.filter(Boolean).map(r => ({
                    ...r,
                    protocol: 'tcp',
                    risk: RISKY_SERVICES[r.port] || 'low',
                    version: r.banner ? r.banner.split('\n')[0].slice(0, 80) : ''
                }));

                // DNS resolution
                let hostInfo = {};
                try {
                    const addrs = await dns.resolve4(target).catch(() => []);
                    const reverse = await dns.reverse(target).catch(() => []);
                    hostInfo = { ipv4: addrs, hostnames: reverse };
                } catch { }

                if (connectDB.isConnected()) {
                    await ReconResult.findByIdAndUpdate(recon._id, {
                        status: 'complete', open_ports: openPorts, host_info: hostInfo
                    });
                } else {
                    // update in-memory record
                    const idx = inMemoryRecons.findIndex(r => r._id === recon._id);
                    if (idx !== -1) {
                        inMemoryRecons[idx].status = 'complete';
                        inMemoryRecons[idx].open_ports = openPorts;
                        inMemoryRecons[idx].host_info = hostInfo;
                    }
                }

                broadcast({ type: 'recon_complete', recon_id: recon._id, target, open_ports: openPorts });
            } catch (err) {
                if (connectDB.isConnected()) {
                    await ReconResult.findByIdAndUpdate(recon._id, { status: 'failed' });
                } else {
                    const idx = inMemoryRecons.findIndex(r => r._id === recon._id);
                    if (idx !== -1) inMemoryRecons[idx].status = 'failed';
                }
                broadcast({ type: 'recon_failed', recon_id: recon._id, error: err.message });
            }
        })();

        res.json({ success: true, recon_id: recon._id, message: `Scanning ${target}...` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/red/recon/:id — get recon result
router.get('/recon/:id', async (req, res) => {
    if (!connectDB.isConnected()) {
        const r = inMemoryRecons.find(r => r._id === req.params.id);
        if (!r) return res.status(404).json({ error: 'Not found' });
        return res.json(r);
    }
    try {
        const recon = await ReconResult.findById(req.params.id);
        if (!recon) return res.status(404).json({ error: 'Not found' });
        res.json(recon);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/red/recon — list all recon sessions
router.get('/recon', async (req, res) => {
    if (!connectDB.isConnected()) {
        // return latest in-memory scans (reverse chronological)
        return res.json({ results: inMemoryRecons.slice().sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)).slice(0,20) });
    }
    try {
        const results = await ReconResult.find().sort({ timestamp: -1 }).limit(20);
        res.json({ results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/red/subdomain — subdomain enumeration via crt.sh
router.post('/subdomain', async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain) return res.status(400).json({ error: 'domain required' });

        // Use crt.sh (free, no API key)
        const axios = require('axios');
        let subdomains = [];
        try {
            const r = await axios.get(`https://crt.sh/?q=%.${domain}&output=json`, { timeout: 8000 });
            const seen = new Set();
            subdomains = r.data
                .map(e => e.name_value?.split('\n')).flat()
                .filter(h => h && !seen.has(h) && seen.add(h))
                .slice(0, 100)
                .map(host => ({ host, ip: '', resolved: false }));
        } catch {
            subdomains = [{ host: `www.${domain}`, ip: '', resolved: false }];
        }

        // Try to resolve a few
        for (const sub of subdomains.slice(0, 10)) {
            try {
                const addrs = await dns.resolve4(sub.host);
                sub.ip = addrs[0]; sub.resolved = true;
            } catch { }
        }

        res.json({ domain, subdomains, count: subdomains.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// helper for external users (cve route)
router.getInMemory = (id) => inMemoryRecons.find(r => r._id === id);

module.exports = router;
