/**
 * Blue Mode — SOAR Automation Engine
 * Mini Security Orchestration, Automation and Response
 */
const express = require('express');
const router = express.Router();
const Incident = require('../../models/Incident');
const { broadcast } = require('../../services/ws');
const connectDB = require('../../config/db');

// Simulated firewall/EDR state (in production, these call real APIs)
const blockedIPs = new Set();
const disabledUsers = new Set();
const soarAuditLog = [];

function logAction(action, target, result, automated = false) {
    const entry = { action, target, result, automated, timestamp: new Date().toISOString() };
    soarAuditLog.unshift(entry);
    if (soarAuditLog.length > 500) soarAuditLog.pop();
    return entry;
}

// POST /api/blue/soar/block-ip
router.post('/block-ip', async (req, res) => {
    try {
        const { ip, incident_id, reason } = req.body;
        if (!ip) return res.status(400).json({ error: 'IP required' });

        blockedIPs.add(ip);
        const entry = logAction('block_ip', ip, `IP ${ip} blocked in firewall`, !!incident_id);

        if (incident_id && connectDB.isConnected()) {
            await Incident.findByIdAndUpdate(incident_id, {
                $push: { soar_actions: { action: 'block_ip', result: `Blocked ${ip}`, automated: !!incident_id } }
            });
        }

        broadcast({ type: 'soar_action', action: 'block_ip', target: ip, result: entry });

        res.json({ success: true, message: `IP ${ip} has been blocked`, entry });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/blue/soar/unblock-ip
router.post('/unblock-ip', async (req, res) => {
    const { ip } = req.body;
    blockedIPs.delete(ip);
    const entry = logAction('unblock_ip', ip, `IP ${ip} unblocked`);
    res.json({ success: true, entry });
});

// POST /api/blue/soar/disable-user
router.post('/disable-user', async (req, res) => {
    try {
        const { username, incident_id, reason } = req.body;
        if (!username) return res.status(400).json({ error: 'username required' });

        disabledUsers.add(username);
        const entry = logAction('disable_user', username, `User ${username} disabled`, !!incident_id);

        if (incident_id && connectDB.isConnected()) {
            await Incident.findByIdAndUpdate(incident_id, {
                $push: { soar_actions: { action: 'disable_user', result: `Disabled ${username}`, automated: false } }
            });
        }

        broadcast({ type: 'soar_action', action: 'disable_user', target: username, result: entry });

        res.json({ success: true, message: `User ${username} has been disabled`, entry });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/blue/soar/trigger-edr
router.post('/trigger-edr', async (req, res) => {
    try {
        const { host, incident_id, severity = 'high' } = req.body;
        const entry = logAction('trigger_edr', host, `EDR alert triggered on ${host} [${severity}]`);

        if (incident_id && connectDB.isConnected()) {
            await Incident.findByIdAndUpdate(incident_id, {
                $push: { soar_actions: { action: 'trigger_edr', result: `EDR alert on ${host}`, automated: false } }
            });
        }

        broadcast({ type: 'soar_action', action: 'trigger_edr', target: host, severity, result: entry });

        res.json({ success: true, message: `EDR alert triggered on ${host}`, entry });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/blue/soar/generate-report
router.post('/generate-report', async (req, res) => {
    try {
        const { incident_id } = req.body;
        const incident = (incident_id && connectDB.isConnected()) ? await Incident.findById(incident_id) : null;
        const entry = logAction('generate_report', incident_id || 'manual', 'Incident report generated');
        res.json({ success: true, message: 'Report generated', entry, incident });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/blue/soar/status
router.get('/status', (req, res) => {
    res.json({
        blocked_ips: Array.from(blockedIPs),
        disabled_users: Array.from(disabledUsers),
        audit_log: soarAuditLog.slice(0, 50)
    });
});

// GET /api/blue/soar/audit
router.get('/audit', (req, res) => {
    res.json({ audit_log: soarAuditLog });
});

module.exports = router;
module.exports.blockedIPs = blockedIPs;
module.exports.disabledUsers = disabledUsers;
