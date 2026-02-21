/**
 * Unified Agent Route — Blue + Red mode chat with SSE streaming
 */
const express = require('express');
const router = express.Router();
const supervisor = require('../agents/supervisorAgent');
const AgentSession = require('../models/AgentSession');
const { broadcast } = require('../services/ws');

// POST /api/agent/chat — standard (non-streaming) chat
router.post('/chat', async (req, res) => {
    try {
        const { session_id, message, mode = 'blue', sandbox_session_id = null } = req.body;
        if (!message) return res.status(400).json({ error: 'message required' });

        // Get or create session
        let session = session_id ? await AgentSession.findOne({ session_id }) : null;
        if (!session) {
            session = await AgentSession.create({
                session_id: session_id || `session_${Date.now()}`,
                mode, messages: []
            });
        }

        // Build history for multi-turn context
        const history = session.messages.slice(-6).map(m => ({
            role: m.role === 'agent' ? 'assistant' : 'user',
            content: m.content
        }));

        session.messages.push({ role: 'user', content: message, timestamp: new Date() });

        // Route through supervisor (with sandbox session if available)
        const result = await supervisor.route(message, mode, session.session_id, history);
        // Pass sandbox session to agent core via result enrichment
        if (sandbox_session_id && !result.blocked) {
            // Re-run with sandbox context if needed
        }

        session.messages.push({
            role: 'agent', content: result.response, timestamp: new Date(),
            metadata: { intent: result.intent, mode, tools_used: result.toolsUsed?.length || 0 }
        });
        await session.save();

        // Broadcast steps via WebSocket
        result.steps?.forEach(step => broadcast({ type: 'agent_step', session_id: session.session_id, step }));

        res.json({
            session_id: session.session_id,
            response: result.response,
            intent: result.intent,
            tools_used: result.toolsUsed || [],
            mode,
            blocked: result.blocked || false,
            educational_note: result.educational_note || null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agent/stream — SSE streaming chat
// Usage: GET /api/agent/stream?message=...&mode=blue&session_id=...&sandbox_session_id=...
router.get('/stream', async (req, res) => {
    const { message, mode = 'blue', session_id, sandbox_session_id } = req.query;
    if (!message) return res.status(400).json({ error: 'message required' });

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    const send = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
        // Get session history
        let session = session_id ? await AgentSession.findOne({ session_id }) : null;
        if (!session) {
            session = await AgentSession.create({
                session_id: session_id || `session_${Date.now()}`,
                mode, messages: []
            });
        }

        const history = session.messages.slice(-6).map(m => ({
            role: m.role === 'agent' ? 'assistant' : 'user',
            content: m.content
        }));

        session.messages.push({ role: 'user', content: message, timestamp: new Date() });

        send('start', { session_id: session.session_id, mode });

        let fullResponse = '';

        const result = await supervisor.routeStream(message, mode, session.session_id, history, {
            onChunk: (text) => {
                fullResponse += text;
                send('chunk', { text });
            },
            onTool: (toolInfo) => {
                send('tool', toolInfo);
            },
            onStep: (step) => {
                send('step', step);
            }
        });

        // If blocked, send block event
        if (result?.blocked) {
            send('blocked', { message: result.response || 'Request blocked by supervisor' });
        }

        // Save to session
        session.messages.push({
            role: 'agent', content: fullResponse || result?.response || '',
            timestamp: new Date(),
            metadata: { intent: 'stream', mode }
        });
        await session.save();

        send('done', { session_id: session.session_id, mode, intent: result?.intent });
        res.end();

    } catch (err) {
        send('error', { message: err.message });
        res.end();
    }
});

// POST /api/agent/mode — switch mode
router.post('/mode', (req, res) => {
    try {
        const { mode } = req.body;
        const result = supervisor.setMode(mode);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /api/agent/mode
router.get('/mode', (req, res) => res.json({ mode: supervisor.getMode() }));

// GET /api/agent/status
router.get('/status', (req, res) => res.json(supervisor.getStatus()));

// GET /api/agent/audit
router.get('/audit', (req, res) => {
    const { severity, limit = 100 } = req.query;
    res.json({ audit: supervisor.getAuditLog(Number(limit), severity) });
});

// GET /api/agent/sessions
router.get('/sessions', async (req, res) => {
    try {
        const sessions = await AgentSession.find().sort({ updatedAt: -1 }).limit(20)
            .select('session_id mode updatedAt messages');
        res.json({ sessions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agent/swarm — get full swarm status
router.get('/swarm', (req, res) => {
    res.json(supervisor.getSwarmStatus());
});

// POST /api/agent/consult — multi-agent consultation (asks multiple specialists)
router.post('/consult', async (req, res) => {
    try {
        const { session_id, message, mode = 'blue', sandbox_session_id = null } = req.body;
        if (!message) return res.status(400).json({ error: 'message required' });

        let session = session_id ? await AgentSession.findOne({ session_id }) : null;
        if (!session) {
            session = await AgentSession.create({
                session_id: session_id || `session_${Date.now()}`,
                mode, messages: []
            });
        }

        const history = session.messages.slice(-6).map(m => ({
            role: m.role === 'agent' ? 'assistant' : 'user',
            content: m.content
        }));

        session.messages.push({ role: 'user', content: message, timestamp: new Date() });

        const result = await supervisor.consult(message, mode, session.session_id, history);

        session.messages.push({
            role: 'agent', content: result.response, timestamp: new Date(),
            metadata: { intent: result.intent, mode, swarm: result.swarm }
        });
        await session.save();

        res.json({
            session_id: session.session_id,
            response: result.response,
            intent: result.intent,
            tools_used: result.toolsUsed || [],
            mode,
            swarm: result.swarm
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
