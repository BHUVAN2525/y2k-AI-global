/**
 * Settings Route — API Key Management
 * Stores keys server-side so agents can use them at runtime
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const SETTINGS_FILE = path.join(__dirname, '../config/settings.json');

// Load settings from file (or defaults)
function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        }
    } catch { }
    return {};
}

// Save settings to file
function saveSettings(data) {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
}

// Mask a key — show only last 4 chars
function maskKey(key) {
    if (!key || key.length < 8) return key ? '****' : '';
    return '•'.repeat(key.length - 4) + key.slice(-4);
}

// In-memory settings cache (loaded at startup)
let settingsCache = loadSettings();

// Export getter for use by agents
function getSetting(key) {
    return settingsCache[key] || process.env[key.toUpperCase()] || '';
}

// GET /api/settings/keys — return masked keys
router.get('/keys', (req, res) => {
    const keys = [
        'gemini_api_key', 'vt_api_key', 'abuseipdb_key',
        'python_api_url', 'mongo_uri'
    ];
    const masked = {};
    keys.forEach(k => {
        const val = settingsCache[k] || '';
        masked[k] = maskKey(val);
        masked[`${k}_set`] = !!val;
    });
    res.json({ settings: masked });
});

// POST /api/settings/keys — save keys
router.post('/keys', (req, res) => {
    try {
        const allowed = ['gemini_api_key', 'vt_api_key', 'abuseipdb_key', 'python_api_url', 'mongo_uri'];
        const updates = {};
        allowed.forEach(k => {
            if (req.body[k] !== undefined && req.body[k] !== '') {
                updates[k] = req.body[k];
            }
        });

        settingsCache = { ...settingsCache, ...updates };
        saveSettings(settingsCache);

        // Also update process.env so existing services pick up new values
        if (updates.vt_api_key) process.env.VT_API_KEY = updates.vt_api_key;
        if (updates.gemini_api_key) process.env.GEMINI_API_KEY = updates.gemini_api_key;
        if (updates.python_api_url) process.env.PYTHON_API_URL = updates.python_api_url;

        res.json({ success: true, message: 'Settings saved', updated: Object.keys(updates) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/settings/test-ssh — test SSH connectivity
router.post('/test-ssh', (req, res) => {
    const { host, port = 22, username, password, privateKey, authMethod = 'password' } = req.body;
    if (!host || !username) return res.status(400).json({ error: 'host and username required' });

    const conn = new Client();
    let responded = false;

    const timeout = setTimeout(() => {
        if (!responded) {
            responded = true;
            conn.end();
            res.status(408).json({ success: false, error: 'Connection timed out (10s)' });
        }
    }, 10000);

    conn.on('ready', () => {
        if (responded) return;
        responded = true;
        clearTimeout(timeout);
        conn.exec('uname -a || ver', (err, stream) => {
            let info = '';
            if (!err && stream) {
                stream.on('data', d => info += d.toString());
                stream.on('close', () => {
                    conn.end();
                    res.json({ success: true, message: 'SSH connection successful', system: info.trim().slice(0, 200) });
                });
            } else {
                conn.end();
                res.json({ success: true, message: 'SSH connection successful' });
            }
        });
    });

    conn.on('error', err => {
        if (responded) return;
        responded = true;
        clearTimeout(timeout);
        console.error('[SSH TEST] connection error:', err);
        // expose code/type for easier debugging
        const payload = { success: false, error: err.message };
        if (err.code) payload.code = err.code;
        if (err.level) payload.level = err.level;
        res.status(400).json(payload);
    });

    const cfg = { host, port: Number(port), username, readyTimeout: 9000 };
    if (authMethod === 'key' && privateKey) cfg.privateKey = privateKey;
    else cfg.password = password;

    conn.connect(cfg);
});

module.exports = router;
module.exports.getSetting = getSetting;
