/**
 * Sandbox Route — Dynamic Malware Analysis via SSH VM
 * All execution happens on the user's VM, never on this host.
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const sandbox = require('../services/sandboxService');
const DynamicAnalysisAgent = require('../services/dynamicAnalysisAgent');
const { broadcast } = require('../services/ws');
const axios = require('axios');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// POST /api/sandbox/connect — SSH into VM, create sandbox dir
router.post('/connect', async (req, res) => {
    try {
        const { host, port, username, password, privateKey, authMethod = 'password' } = req.body;
        if (!host || !username) return res.status(400).json({ error: 'host and username are required' });

        const result = await sandbox.createSession({ host, port, username, password, privateKey, authMethod });
        broadcast({ type: 'sandbox_connected', sessionId: result.sessionId, host });
        res.json({ success: true, ...result, message: `Connected to ${host} — sandbox ready at ${result.sandboxDir}` });
    } catch (err) {
        const status = err.message.includes('Authentication failed') || err.message.includes('SSH connection') || err.message.includes('Failed to create') ? 400 : 500;
        res.status(status).json({ success: false, error: err.message });
    }
});

// POST /api/sandbox/upload — SCP sample to VM
router.post('/upload', upload.single('sample'), async (req, res) => {
    try {
        const { session_id } = req.body;
        if (!session_id) return res.status(400).json({ error: 'session_id required' });
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const result = await sandbox.uploadSample(session_id, req.file.buffer, req.file.originalname);
        broadcast({ type: 'sandbox_upload', sessionId: session_id, filename: req.file.originalname, ...result });
        res.json({ success: true, ...result, filename: req.file.originalname });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/sandbox/execute — run sample, stream output via WebSocket
router.post('/execute', async (req, res) => {
    try {
        const { session_id, timeout = 30, capture_network = true, capture_processes = true } = req.body;
        if (!session_id) return res.status(400).json({ error: 'session_id required' });

        const sessionInfo = sandbox.getSession(session_id);
        if (!sessionInfo) return res.status(404).json({ error: 'Session not found' });

        // Respond immediately — output streams via WebSocket
        res.json({ success: true, message: 'Execution started — watch WebSocket for live output', session_id });

        const emitter = sandbox.executeInSandbox(session_id, { timeout, captureNetwork: capture_network, captureProcesses: capture_processes });

        broadcast({ type: 'sandbox_exec_start', sessionId: session_id, filename: sessionInfo.artifacts.filename });

        emitter.on('data', (text) => {
            broadcast({ type: 'sandbox_output', sessionId: session_id, text });
        });

        emitter.on('close', async (code) => {
            broadcast({ type: 'sandbox_exec_done', sessionId: session_id, exitCode: code });
            // Auto-collect artifacts
            try {
                const artifacts = await sandbox.collectArtifacts(session_id);
                broadcast({ type: 'sandbox_artifacts', sessionId: session_id, artifacts });
            } catch { }
        });

        emitter.on('error', (err) => {
            broadcast({ type: 'sandbox_error', sessionId: session_id, error: err });
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/sandbox/artifacts/:id — get collected artifacts
router.get('/artifacts/:id', async (req, res) => {
    try {
        const artifacts = await sandbox.collectArtifacts(req.params.id);
        res.json({ success: true, artifacts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/sandbox/analyze — Full forensic analysis pipeline
router.post('/analyze', async (req, res) => {
    try {
        const { session_id, file_path, file_name } = req.body;
        if (!session_id) return res.status(400).json({ error: 'session_id required' });

        const sessionInfo = sandbox.getSession(session_id);
        if (!sessionInfo) return res.status(404).json({ error: 'Session not found' });

        const targetPath = file_path || (sessionInfo.artifacts && sessionInfo.artifacts.sandboxPath);
        const targetName = file_name || (sessionInfo.artifacts && sessionInfo.artifacts.filename);

        if (!targetPath) return res.status(400).json({ error: 'Target file path missing - upload or specify a sample' });

        const malwareService = require('../services/malwareAnalysisService');
        const result = await malwareService.analyzeFile(session_id, targetPath, targetName);

        // Broadcast completion for UI update
        broadcast({ type: 'sandbox_analysis_complete', sessionId: session_id, report: result });

        res.json({ success: true, report: result });
    } catch (err) {
        console.error('[Sandbox] Analysis error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/sandbox/session/:id — cleanup
router.delete('/session/:id', async (req, res) => {
    try {
        const result = await sandbox.cleanupSession(req.params.id);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/sandbox/restore — Soft reset sandbox
router.post('/restore', async (req, res) => {
    try {
        const { session_id } = req.body;
        if (!session_id) return res.status(400).json({ error: 'session_id required' });
        const result = await sandbox.restoreSnapshot(session_id);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/sandbox/sessions — list active sessions
router.get('/sessions', (req, res) => {
    res.json({ sessions: sandbox.listSessions() });
});

// GET /api/sandbox/session/:id — get session info
router.get('/session/:id', (req, res) => {
    const s = sandbox.getSession(req.params.id);
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json(s);
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function determineConsolidatedVerdict(vtResult, dynamicReport) {
    const vtVerdict = vtResult?.verdict || 'UNKNOWN';
    const dynamicSeverity = dynamicReport?.severity || 'unknown';
    const dynamicClass = dynamicReport?.classification || 'unknown';

    if (vtVerdict === 'MALICIOUS' || dynamicSeverity === 'critical' || dynamicSeverity === 'high') {
        return { verdict: 'MALICIOUS', confidence: 'HIGH', action: 'QUARANTINE_IMMEDIATELY' };
    }
    if (vtVerdict === 'SUSPICIOUS' || dynamicClass === 'suspicious' || dynamicSeverity === 'medium') {
        return { verdict: 'SUSPICIOUS', confidence: 'MEDIUM', action: 'ISOLATE_AND_INVESTIGATE' };
    }
    if (vtVerdict === 'HARMLESS' && dynamicSeverity === 'low') {
        return { verdict: 'CLEAN', confidence: 'HIGH', action: 'ALLOW' };
    }
    return { verdict: 'UNKNOWN', confidence: 'LOW', action: 'MANUAL_REVIEW_REQUIRED' };
}

// POST /api/sandbox/analyze — Trigger autonomous malware analysis
router.post('/analyze', async (req, res) => {
    try {
        const { session_id, file_path, file_name } = req.body;
        if (!session_id || !file_path) {
            return res.status(400).json({ error: 'session_id and file_path are required' });
        }

        const orchestrator = require('../services/autonomousOrchestrator');
        const instance = new orchestrator(); // Or use a singleton if available
        const result = await instance.runAutonomousMalwareAnalysis(session_id, file_path, file_name || 'unknown_sample');

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
