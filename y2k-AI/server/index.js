require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const connectDB = require('./config/db');
const { registerClient, broadcast } = require('./services/ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// WebSocket
wss.on('connection', (ws) => registerClient(ws));

// ── Routes ──────────────────────────────────────────────────────────────────
// Core (existing)
app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/batch', require('./routes/batch'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/monitor', require('./routes/monitor'));
app.use('/api/status', require('./routes/status'));

// Agent (unified blue+red)
app.use('/api/agent', require('./routes/agent'));

// Settings (API key management)
app.use('/api/settings', require('./routes/settings'));

// Sandbox (dynamic analysis)
app.use('/api/sandbox', require('./routes/sandbox'));
// Digital twin infrastructure data (frontend will fetch this)
app.use('/api/digital-twin', require('./routes/digitalTwin'));

// 🤖 Autonomous Operations (Blue + Red + Orchestrator)
app.use('/api/autonomous', require('./routes/autonomous'));

// 🔵 Blue Mode
app.use('/api/blue', require('./routes/blue/logs'));
app.use('/api/blue/soar', require('./routes/blue/soar'));

// 🔴 Red Mode
app.use('/api/red', require('./routes/red/recon'));
app.use('/api/red', require('./routes/red/cve'));

// 📡 Threat Intelligence
app.use('/api/threatintel', require('./routes/threatintel'));

// 🩹 Self-Healing + Policy Generation
app.use('/api/selfheal', require('./routes/selfheal'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 Y2K Cyber AI Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws`);
    console.log(`🐍 Python API expected at ${process.env.PYTHON_API_URL}`);
    console.log(`🔵 Blue Mode: /api/blue/*`);
    console.log(`🔴 Red Mode:  /api/red/*`);
    console.log(`🤖 Agents:    /api/agent/*`);
    console.log(`⚡ Autonomous Operations: /api/autonomous/* (Blue, Red, Orchestrator)`);
  });
}

start().catch(err => { console.error('Startup failed:', err); process.exit(1); });
