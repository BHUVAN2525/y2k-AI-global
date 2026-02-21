/**
 * Blue Mode — Log Ingestion + Threat Detection Engine
 * Handles syslog, Windows, Linux log ingestion and real-time threat analysis
 */
const express = require('express');
const router = express.Router();
const LogEntry = require('../../models/LogEntry');
const Incident = require('../../models/Incident');
const { broadcast } = require('../../services/ws');

// MITRE ATT&CK technique lookup (local, no API needed)
const MITRE_PATTERNS = [
    { pattern: /failed (login|password|auth)/i, technique: 'T1110', tactic: 'Credential Access', name: 'Brute Force', severity: 'high' },
    { pattern: /invalid user/i, technique: 'T1110.001', tactic: 'Credential Access', name: 'Password Guessing', severity: 'medium' },
    { pattern: /sudo|privilege|escalat/i, technique: 'T1548', tactic: 'Privilege Escalation', name: 'Privilege Escalation', severity: 'high' },
    { pattern: /wget|curl|download|invoke-web/i, technique: 'T1105', tactic: 'Command & Control', name: 'Ingress Tool Transfer', severity: 'high' },
    { pattern: /powershell|cmd\.exe|bash -c/i, technique: 'T1059', tactic: 'Execution', name: 'Command Interpreter', severity: 'medium' },
    { pattern: /netcat|nc -|reverse shell/i, technique: 'T1059.004', tactic: 'Execution', name: 'Unix Shell', severity: 'critical' },
    { pattern: /exfil|data transfer|upload.*\d+MB/i, technique: 'T1041', tactic: 'Exfiltration', name: 'Exfiltration Over C2', severity: 'critical' },
    { pattern: /new user|useradd|net user/i, technique: 'T1136', tactic: 'Persistence', name: 'Create Account', severity: 'high' },
    { pattern: /crontab|scheduled task|at\.exe/i, technique: 'T1053', tactic: 'Persistence', name: 'Scheduled Task', severity: 'medium' },
    { pattern: /mimikatz|lsass|credential dump/i, technique: 'T1003', tactic: 'Credential Access', name: 'OS Credential Dumping', severity: 'critical' },
    { pattern: /nmap|masscan|port scan/i, technique: 'T1046', tactic: 'Discovery', name: 'Network Service Scan', severity: 'medium' },
    { pattern: /ransomware|encrypt.*files|\.locked/i, technique: 'T1486', tactic: 'Impact', name: 'Data Encrypted', severity: 'critical' },
];

// Brute force tracker (in-memory, per IP)
const bruteForceTracker = new Map();

function detectThreats(message, ip, user) {
    const flags = [];
    let maxSeverity = 'info';
    let mitreTechnique = null;
    let mitreTactic = null;
    let threatScore = 0;

    const severityOrder = ['info', 'low', 'medium', 'high', 'critical'];

    for (const rule of MITRE_PATTERNS) {
        if (rule.pattern.test(message)) {
            flags.push(rule.name);
            if (severityOrder.indexOf(rule.severity) > severityOrder.indexOf(maxSeverity)) {
                maxSeverity = rule.severity;
                mitreTechnique = rule.technique;
                mitreTactic = rule.tactic;
            }
            threatScore += { info: 5, low: 15, medium: 30, high: 50, critical: 80 }[rule.severity] || 0;
        }
    }

    // Brute force detection: >5 failed logins from same IP in 60s
    if (ip && /failed (login|password|auth)/i.test(message)) {
        const now = Date.now();
        const key = ip;
        if (!bruteForceTracker.has(key)) bruteForceTracker.set(key, []);
        const attempts = bruteForceTracker.get(key).filter(t => now - t < 60000);
        attempts.push(now);
        bruteForceTracker.set(key, attempts);
        if (attempts.length >= 5) {
            flags.push('Brute Force Detected');
            maxSeverity = 'critical';
            mitreTechnique = 'T1110';
            mitreTactic = 'Credential Access';
            threatScore = Math.min(100, threatScore + 40);
        }
    }

    return { flags, severity: maxSeverity, mitreTechnique, mitreTactic, threatScore: Math.min(100, threatScore) };
}

// POST /api/blue/logs — ingest logs
router.post('/logs', async (req, res) => {
    try {
        const { source = 'custom', message, raw, host, ip, user, process: proc, event_id, timestamp } = req.body;

        if (!message) return res.status(400).json({ error: 'message is required' });

        const { flags, severity, mitreTechnique, mitreTactic, threatScore } = detectThreats(message, ip, user);

        const level = threatScore > 70 ? 'critical' : threatScore > 40 ? 'error' : threatScore > 20 ? 'warning' : 'info';

        const entry = await LogEntry.create({
            source, message, raw, host, ip, user, process: proc, event_id,
            level, threat_score: threatScore, threat_flags: flags,
            mitre_technique: mitreTechnique,
            timestamp: timestamp ? new Date(timestamp) : new Date()
        });

        // Auto-create incident for high/critical threats
        let incident = null;
        if (threatScore >= 50 && flags.length > 0) {
            incident = await Incident.create({
                title: `${flags[0]} detected from ${ip || host || 'unknown'}`,
                severity: severity,
                type: flags[0]?.toLowerCase().replace(/ /g, '_'),
                mitre_technique: mitreTechnique,
                mitre_tactic: mitreTactic,
                source_ip: ip,
                target: host,
                description: message,
                evidence: [entry._id.toString()]
            });
            entry.incident_id = incident._id;
            await entry.save();
        }

        // Broadcast via WebSocket
        broadcast({ type: 'blue_log', entry, incident });

        res.json({ success: true, entry, incident, threat_score: threatScore, flags });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/blue/logs/batch — bulk ingest
router.post('/logs/batch', async (req, res) => {
    try {
        const { logs } = req.body;
        if (!Array.isArray(logs)) return res.status(400).json({ error: 'logs array required' });

        const results = [];
        for (const log of logs.slice(0, 500)) {
            const { flags, severity, mitreTechnique, threatScore } = detectThreats(log.message || '', log.ip, log.user);
            const level = threatScore > 70 ? 'critical' : threatScore > 40 ? 'error' : threatScore > 20 ? 'warning' : 'info';
            results.push({ ...log, level, threat_score: threatScore, threat_flags: flags, mitre_technique: mitreTechnique });
        }

        const entries = await LogEntry.insertMany(results);
        res.json({ success: true, count: entries.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/blue/logs — query logs
router.get('/logs', async (req, res) => {
    try {
        const { host, level, threat_min = 0, limit = 100, page = 1, search } = req.query;
        const filter = {};
        if (host) filter.host = host;
        if (level) filter.level = level;
        if (threat_min > 0) filter.threat_score = { $gte: Number(threat_min) };
        if (search) filter.message = { $regex: search, $options: 'i' };

        const logs = await LogEntry.find(filter)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await LogEntry.countDocuments(filter);
        res.json({ logs, total, page: Number(page) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/blue/threats — recent threats
router.get('/threats', async (req, res) => {
    try {
        const threats = await LogEntry.find({ threat_score: { $gte: 30 } })
            .sort({ timestamp: -1 }).limit(50);
        const incidents = await Incident.find({ status: { $ne: 'resolved' } })
            .sort({ timestamp: -1 }).limit(20);
        const stats = {
            total_logs: await LogEntry.countDocuments(),
            threats_today: await LogEntry.countDocuments({ threat_score: { $gte: 30 }, timestamp: { $gte: new Date(Date.now() - 86400000) } }),
            open_incidents: await Incident.countDocuments({ status: 'open' }),
            critical_incidents: await Incident.countDocuments({ severity: 'critical', status: { $ne: 'resolved' } })
        };
        res.json({ threats, incidents, stats });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/blue/incidents — list incidents
router.get('/incidents', async (req, res) => {
    try {
        const { status, severity, limit = 50 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (severity) filter.severity = severity;
        const incidents = await Incident.find(filter).sort({ timestamp: -1 }).limit(Number(limit));
        const total = await Incident.countDocuments(filter);
        res.json({ incidents, total });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/blue/incidents/:id — update incident
router.patch('/incidents/:id', async (req, res) => {
    try {
        const incident = await Incident.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(incident);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/blue/stats — dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const now = new Date();
        const day = new Date(now - 86400000);
        const week = new Date(now - 7 * 86400000);

        const [totalLogs, logsToday, threatsToday, openIncidents, criticalIncidents, byMitre, bySeverity] = await Promise.all([
            LogEntry.countDocuments(),
            LogEntry.countDocuments({ timestamp: { $gte: day } }),
            LogEntry.countDocuments({ threat_score: { $gte: 30 }, timestamp: { $gte: day } }),
            Incident.countDocuments({ status: 'open' }),
            Incident.countDocuments({ severity: 'critical', status: { $ne: 'resolved' } }),
            Incident.aggregate([{ $group: { _id: '$mitre_tactic', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
            Incident.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
            // Timeline: incidents per hour last 24h
        ]);

        const timeline = await LogEntry.aggregate([
            { $match: { timestamp: { $gte: day } } },
            { $group: { _id: { $hour: '$timestamp' }, total: { $sum: 1 }, threats: { $sum: { $cond: [{ $gte: ['$threat_score', 30] }, 1, 0] } } } },
            { $sort: { '_id': 1 } }
        ]);

        res.json({ totalLogs, logsToday, threatsToday, openIncidents, criticalIncidents, byMitre, bySeverity, timeline });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
