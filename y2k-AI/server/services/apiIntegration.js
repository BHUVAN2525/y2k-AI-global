/**
 * API Integration Service
 * Centralized caller for Gemini, VirusTotal, AbuseIPDB, Shodan
 * Reads keys from config/settings.json at runtime
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../config/settings.json');

function getKey(name) {
    try {
        const s = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        return s[name] || process.env[name.toUpperCase()] || '';
    } catch {
        return process.env[name.toUpperCase()] || '';
    }
}

// ── Gemini ────────────────────────────────────────────────────────────────────

/**
 * Call Gemini with system prompt, message history, and optional tool definitions.
 * Returns { text, toolCalls } where toolCalls = [{ name, args }]
 */
async function geminiChat({ systemPrompt, messages, tools = [], temperature = 0.7 }) {
    const key = getKey('gemini_api_key');
    if (!key) throw new Error('NO_GEMINI_KEY');

    const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    const body = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature, maxOutputTokens: 2048 },
    };

    if (tools.length > 0) {
        body.tools = [{
            function_declarations: tools.map(t => ({
                name: t.name,
                description: t.description,
                parameters: t.parameters
            }))
        }];
    }

    const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
        body,
        { timeout: 30000 }
    );

    const candidate = res.data?.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const text = parts.filter(p => p.text).map(p => p.text).join('');
    const toolCalls = parts
        .filter(p => p.functionCall)
        .map(p => ({ name: p.functionCall.name, args: p.functionCall.args || {} }));

    return { text, toolCalls };
}

/**
 * Stream Gemini response — calls onChunk(text) for each token chunk
 */
async function geminiStream({ systemPrompt, messages, onChunk }) {
    const key = getKey('gemini_api_key');
    if (!key) throw new Error('NO_GEMINI_KEY');

    const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${key}&alt=sse`,
        {
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        },
        { responseType: 'stream', timeout: 60000 }
    );

    return new Promise((resolve, reject) => {
        let fullText = '';
        res.data.on('data', chunk => {
            const lines = chunk.toString().split('\n').filter(l => l.startsWith('data: '));
            for (const line of lines) {
                try {
                    const data = JSON.parse(line.slice(6));
                    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    if (text) { fullText += text; onChunk(text); }
                } catch { }
            }
        });
        res.data.on('end', () => resolve(fullText));
        res.data.on('error', reject);
    });
}

// ── VirusTotal ────────────────────────────────────────────────────────────────

async function vtLookup(hash) {
    const key = getKey('vt_api_key');
    if (!key) return { error: 'No VirusTotal API key configured', configured: false };
    try {
        const res = await axios.get(`https://www.virustotal.com/api/v3/files/${hash}`, {
            headers: { 'x-apikey': key }, timeout: 10000
        });
        const attrs = res.data?.data?.attributes || {};
        const stats = attrs.last_analysis_stats || {};
        return {
            configured: true,
            hash,
            name: attrs.meaningful_name || attrs.name || 'Unknown',
            type: attrs.type_description || 'Unknown',
            size: attrs.size,
            malicious: stats.malicious || 0,
            suspicious: stats.suspicious || 0,
            harmless: stats.harmless || 0,
            total: Object.values(stats).reduce((a, b) => a + b, 0),
            verdict: stats.malicious > 5 ? 'MALICIOUS' : stats.malicious > 0 ? 'SUSPICIOUS' : 'CLEAN',
            tags: attrs.tags || [],
            link: `https://www.virustotal.com/gui/file/${hash}`
        };
    } catch (err) {
        if (err.response?.status === 404) return { configured: true, hash, verdict: 'NOT_FOUND', error: 'Hash not found in VirusTotal database' };
        return { configured: true, error: err.message };
    }
}

// ── AbuseIPDB ─────────────────────────────────────────────────────────────────

async function abuseIPDB(ip) {
    const key = getKey('abuseipdb_key');
    if (!key) return { error: 'No AbuseIPDB API key configured', configured: false };
    try {
        const res = await axios.get('https://api.abuseipdb.com/api/v2/check', {
            params: { ipAddress: ip, maxAgeInDays: 90, verbose: true },
            headers: { Key: key, Accept: 'application/json' },
            timeout: 8000
        });
        const d = res.data?.data || {};
        return {
            configured: true,
            ip,
            abuse_score: d.abuseConfidenceScore,
            country: d.countryCode,
            isp: d.isp,
            domain: d.domain,
            total_reports: d.totalReports,
            last_reported: d.lastReportedAt,
            is_tor: d.isTor,
            verdict: d.abuseConfidenceScore > 80 ? 'HIGH_RISK' : d.abuseConfidenceScore > 25 ? 'SUSPICIOUS' : 'CLEAN'
        };
    } catch (err) {
        return { configured: true, error: err.message };
    }
}

// ── Shodan ────────────────────────────────────────────────────────────────────

async function shodanHost(ip) {
    const key = getKey('shodan_api_key');
    if (!key) return { error: 'No Shodan API key configured', configured: false };
    try {
        const res = await axios.get(`https://api.shodan.io/shodan/host/${ip}?key=${key}`, { timeout: 10000 });
        const d = res.data || {};
        return {
            configured: true,
            ip,
            org: d.org,
            country: d.country_name,
            city: d.city,
            os: d.os,
            open_ports: d.ports || [],
            vulns: Object.keys(d.vulns || {}),
            hostnames: d.hostnames || [],
            tags: d.tags || [],
            last_update: d.last_update
        };
    } catch (err) {
        return { configured: true, error: err.message };
    }
}

module.exports = { geminiChat, geminiStream, vtLookup, abuseIPDB, shodanHost, getKey };
