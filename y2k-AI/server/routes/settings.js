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
    try {
        const keys = [
            'gemini_api_key', 'vt_api_key', 'abuseipdb_key',
            'mongo_uri'
        ];
        const masked = {};
        keys.forEach(k => {
            const val = settingsCache[k] || '';
            masked[k] = maskKey(val);
            masked[`${k}_set`] = !!val;
        });
        res.json({ settings: masked });
    } catch (err) {
        console.error('[SETTINGS] GET keys error', err);
        res.status(500).json({ error: 'Unable to load settings: ' + err.message });
    }
});

// POST /api/settings/keys — save keys
router.post('/keys', (req, res) => {
    try {
        console.log('[SETTINGS] saving keys', req.body);
        const updates = {};
        const keys = ['gemini_api_key', 'vt_api_key', 'abuseipdb_key', 'mongo_uri'];
        keys.forEach(k => {
            if (req.body[k] !== undefined && req.body[k] !== '') {
                updates[k] = req.body[k];
            }
        });

        settingsCache = { ...settingsCache, ...updates };
        saveSettings(settingsCache);

        // Also update process.env so existing services pick up new values
        if (updates.vt_api_key) process.env.VT_API_KEY = updates.vt_api_key;
        if (updates.gemini_api_key) process.env.GEMINI_API_KEY = updates.gemini_api_key;
        // python_api_url setting removed; Python service runs on localhost by default


        res.json({ success: true, message: 'Settings saved', updated: Object.keys(updates) });
    } catch (err) {
        console.error('[SETTINGS] save error', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/settings/test-ssh — test SSH connectivity
router.post('/test-ssh', (req, res) => {
    // always respond 200; client will inspect success flag
    try {
        const { host, port = 22, username, password, privateKey, authMethod = 'password' } = req.body;
        if (!host || !username) return res.json({ success: false, error: 'host and username required' });

        const conn = new Client();
        let responded = false;

        const timeout = setTimeout(() => {
            if (!responded) {
                responded = true;
                conn.end();
                res.json({ success: false, error: 'Connection timed out (10s)' });
            }
        }, 10000);

        conn.on('ready', () => {
            try {
                if (responded) return;
                responded = true;
                clearTimeout(timeout);
                conn.exec('uname -a || ver', (err, stream) => {
                    try {
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
                    } catch (e) {
                        console.error('[SSH TEST] exec callback error', e);
                        if (!responded) {
                            responded = true;
                            res.json({ success: false, error: e.message });
                        }
                    }
                });
            } catch (e) {
                console.error('[SSH TEST] ready handler error', e);
                if (!responded) {
                    responded = true;
                    res.json({ success: false, error: e.message });
                }
            }
        });

        conn.on('error', err => {
            try {
                if (responded) return;
                responded = true;
                clearTimeout(timeout);
                console.error('[SSH TEST] connection error:', err);
                const payload = { success: false, error: err.message };
                if (err.code) payload.code = err.code;
                if (err.level) payload.level = err.level;
                res.json(payload);
            } catch (e) {
                console.error('[SSH TEST] error handler failed', e);
                if (!responded) res.json({ success: false, error: e.message });
            }
        });

        const cfg = {
            host, port: Number(port), username, readyTimeout: 12000,
            tryKeyboard: true,
            algorithms: {
                kex: ['curve25519-sha256', 'curve25519-sha256@libssh.org', 'ecdh-sha2-nistp256', 'ecdh-sha2-nistp384', 'ecdh-sha2-nistp521', 'diffie-hellman-group-exchange-sha256', 'diffie-hellman-group14-sha256', 'diffie-hellman-group14-sha1', 'diffie-hellman-group1-sha1'],
                serverHostKey: ['ssh-ed25519', 'ecdsa-sha2-nistp256', 'ecdsa-sha2-nistp384', 'ecdsa-sha2-nistp521', 'rsa-sha2-512', 'rsa-sha2-256', 'ssh-rsa'],
                cipher: ['aes128-gcm', 'aes128-gcm@openssh.com', 'aes256-gcm', 'aes256-gcm@openssh.com', 'aes128-ctr', 'aes192-ctr', 'aes256-ctr', 'chacha20-poly1305@openssh.com']
            }
        };
        if (authMethod === 'key' && privateKey) cfg.privateKey = privateKey;
        else cfg.password = password;

        conn.on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
            console.log('[SSH TEST] keyboard-interactive auth requested');
            finish([password || '']);
        });

        conn.connect(cfg);
    } catch (ex) {
        console.error('[SSH TEST] unexpected error', ex);
        res.json({ success: false, error: ex.message });
    }
});

module.exports = router;
module.exports.getSetting = getSetting;
