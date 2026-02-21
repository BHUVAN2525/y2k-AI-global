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
        res.status(500).json({ success: false, error: err.message });
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

// POST /api/sandbox/analyze — Full dynamic analysis with agentic orchestration
router.post('/analyze', async (req, res) => {
    try {
        const { session_id } = req.body;
        const sessionInfo = sandbox.getSession(session_id);
        if (!sessionInfo) return res.status(404).json({ error: 'Session not found' });

        const { artifacts } = sessionInfo;
        const geminiKey = process.env.GEMINI_API_KEY || '';

        // Run agentic orchestration on artifacts
        const agent = new DynamicAnalysisAgent(geminiKey);
        const dynamicReport = await agent.orchestrateAnalysis(artifacts);

        // VirusTotal hash lookup for static baseline
        let vtResult = null;
        const vtKey = process.env.VT_API_KEY || '';
        if (vtKey && artifacts.sha256) {
            try {
                const vtRes = await axios.get(`https://www.virustotal.com/api/v3/files/${artifacts.sha256}`, {
                    headers: { 'x-apikey': vtKey }, timeout: 10000
                });
                const stats = vtRes.data?.data?.attributes?.last_analysis_stats || {};
                vtResult = {
                    malicious: stats.malicious || 0,
                    suspicious: stats.suspicious || 0,
                    harmless: stats.harmless || 0,
                    total: Object.values(stats).reduce((a, b) => a + b, 0),
                    verdict: stats.malicious > 0 ? 'MALICIOUS' : stats.suspicious > 0 ? 'SUSPICIOUS' : 'CLEAN',
                    link: `https://www.virustotal.com/gui/file/${artifacts.sha256}`
                };
            } catch { }
        }

        // Combine dynamic + static analysis into comprehensive report
        const finalReport = {
            metadata: {
                filename: artifacts.filename,
                md5: artifacts.md5,
                sha256: artifacts.sha256,
                fileSize: artifacts.fileSize,
                executedAt: artifacts.startTime,
                executionTime: (new Date(artifacts.endTime) - new Date(artifacts.startTime)) / 1000,
                exitCode: artifacts.exitCode
            },
            static_analysis: vtResult,
            dynamic_analysis: dynamicReport,
            consolidated_verdict: determineConsolidatedVerdict(vtResult, dynamicReport),
            analysis_summary: {
                total_iocs: (dynamicReport.iocs.ips || []).length + (dynamicReport.iocs.domains || []).length + (dynamicReport.iocs.files || []).length,
                techniques_detected: (dynamicReport.techniques || []).length,
                technologies_identified: (dynamicReport.technologies || {})
            },
            timestamp: new Date().toISOString()
        };

        // Broadcast completion
        broadcast({ type: 'sandbox_analysis_complete', sessionId: session_id, report: finalReport });

        res.json({ success: true, report: finalReport, artifacts: { md5: artifacts.md5, sha256: artifacts.sha256, filename: artifacts.filename } });
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

module.exports = router;
