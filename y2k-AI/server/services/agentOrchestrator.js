/**
 * CEREBUS Agentic AI Orchestrator
 * 
 * Implements a reasoning loop: Think → Plan → Execute Tools → Respond
 * Works without an LLM — uses rule-based intent parsing with structured tool calls.
 * Optional: Set OPENAI_API_KEY or GEMINI_API_KEY in .env for LLM-enhanced responses.
 */

const Scan = require('../models/Scan');
const AgentSession = require('../models/AgentSession');

// ─── Intent Detection ─────────────────────────────────────────────────────────

const INTENTS = {
    ANALYZE_FILE: ['analyze', 'scan', 'check', 'examine', 'inspect'],
    EXPLAIN: ['explain', 'why', 'how', 'reason', 'shap', 'feature'],
    SEARCH_HISTORY: ['history', 'past', 'previous', 'recent', 'last', 'found', 'detected'],
    STATS: ['stats', 'statistics', 'count', 'total', 'how many', 'summary', 'report'],
    THREAT_INFO: ['what is', 'tell me about', 'ransomware', 'trojan', 'worm', 'spyware', 'virus'],
    COMPARE: ['compare', 'difference', 'similar', 'versus', 'vs'],
    HELP: ['help', 'what can you do', 'capabilities', 'commands']
};

function detectIntent(message) {
    const lower = message.toLowerCase();
    for (const [intent, keywords] of Object.entries(INTENTS)) {
        if (keywords.some(kw => lower.includes(kw))) {
            return intent;
        }
    }
    return 'GENERAL';
}

// ─── Tool Definitions ─────────────────────────────────────────────────────────

const TOOLS = {
    async search_scan_history({ query, limit = 10, filter = {} }) {
        const dbFilter = { ...filter };
        if (query) {
            dbFilter.$or = [
                { filename: { $regex: query, $options: 'i' } },
                { malware_type: { $regex: query, $options: 'i' } }
            ];
        }
        const scans = await Scan.find(dbFilter)
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
        return { scans, count: scans.length };
    },

    async get_stats() {
        const [total, malware, byType] = await Promise.all([
            Scan.countDocuments(),
            Scan.countDocuments({ is_malware: true }),
            Scan.aggregate([
                { $match: { is_malware: true } },
                { $group: { _id: '$malware_type', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ])
        ]);
        const recent = await Scan.find().sort({ timestamp: -1 }).limit(5).lean();
        return {
            total_scans: total,
            malware_detected: malware,
            clean_files: total - malware,
            detection_rate: total > 0 ? ((malware / total) * 100).toFixed(1) + '%' : '0%',
            by_type: byType,
            recent_scans: recent
        };
    },

    async get_threat_info({ threat_type }) {
        const info = {
            ransomware: {
                name: 'Ransomware',
                description: 'Encrypts victim files and demands payment for decryption key.',
                indicators: ['File encryption APIs', 'Bitcoin wallet addresses', 'Ransom note creation', 'Shadow copy deletion'],
                examples: ['WannaCry', 'REvil', 'LockBit', 'Conti'],
                mitigation: ['Regular backups', 'Patch management', 'Email filtering', 'Endpoint protection']
            },
            trojan: {
                name: 'Trojan',
                description: 'Disguises itself as legitimate software while performing malicious actions.',
                indicators: ['Backdoor connections', 'Keylogging APIs', 'Data exfiltration', 'Hidden processes'],
                examples: ['Emotet', 'TrickBot', 'Zeus', 'Remcos RAT'],
                mitigation: ['Application whitelisting', 'Network monitoring', 'User education']
            },
            worm: {
                name: 'Worm',
                description: 'Self-replicating malware that spreads across networks without user interaction.',
                indicators: ['Network scanning', 'Self-replication', 'Port exploitation', 'Mass email sending'],
                examples: ['Conficker', 'Stuxnet', 'Blaster', 'ILOVEYOU'],
                mitigation: ['Network segmentation', 'Firewall rules', 'Patch management']
            },
            spyware: {
                name: 'Spyware',
                description: 'Secretly monitors user activity and collects sensitive information.',
                indicators: ['Screen capture APIs', 'Keylogger hooks', 'Browser data access', 'Microphone/camera access'],
                examples: ['Pegasus', 'FinFisher', 'DarkComet', 'Agent Tesla'],
                mitigation: ['Anti-spyware tools', 'Regular scans', 'Privacy settings review']
            },
            virus: {
                name: 'Virus',
                description: 'Attaches to legitimate files and spreads when infected files are executed.',
                indicators: ['File infection', 'Boot sector modification', 'System file tampering'],
                examples: ['CIH', 'Melissa', 'Sasser', 'MyDoom'],
                mitigation: ['Antivirus software', 'File integrity monitoring', 'Safe browsing']
            }
        };
        const key = Object.keys(info).find(k => threat_type?.toLowerCase().includes(k));
        return info[key] || { error: 'Unknown threat type', available_types: Object.keys(info) };
    }
};

// ─── Response Synthesizer ─────────────────────────────────────────────────────

function synthesizeResponse(intent, toolResults, userMessage) {
    switch (intent) {
        case 'STATS': {
            const s = toolResults[0];
            if (!s) return { text: 'No scan data available yet. Upload a file to get started!', data: null };
            return {
                text: `📊 **CEREBUS Analysis Summary**\n\n` +
                    `• **Total Scans:** ${s.total_scans}\n` +
                    `• **Malware Detected:** ${s.malware_detected} (${s.detection_rate})\n` +
                    `• **Clean Files:** ${s.clean_files}\n\n` +
                    (s.by_type.length > 0
                        ? `**Top Threat Types:**\n${s.by_type.slice(0, 5).map(t => `  - ${t._id || 'Unknown'}: ${t.count}`).join('\n')}`
                        : 'No malware detected yet.'),
                data: s
            };
        }

        case 'SEARCH_HISTORY': {
            const result = toolResults[0];
            if (!result || result.count === 0) {
                return { text: '🔍 No matching scans found in history.', data: null };
            }
            const lines = result.scans.map(s =>
                `• **${s.filename}** — ${s.is_malware ? `⚠️ ${s.malware_type}` : '✅ Clean'} (${new Date(s.timestamp).toLocaleDateString()})`
            );
            return {
                text: `🔍 **Found ${result.count} scan(s):**\n\n${lines.join('\n')}`,
                data: result
            };
        }

        case 'THREAT_INFO': {
            const info = toolResults[0];
            if (info?.error) return { text: `❓ ${info.error}`, data: null };
            return {
                text: `🦠 **${info.name}**\n\n${info.description}\n\n` +
                    `**Key Indicators:**\n${info.indicators.map(i => `  • ${i}`).join('\n')}\n\n` +
                    `**Known Examples:** ${info.examples.join(', ')}\n\n` +
                    `**Mitigation:**\n${info.mitigation.map(m => `  • ${m}`).join('\n')}`,
                data: info
            };
        }

        case 'HELP': {
            return {
                text: `🤖 **CEREBUS AI Agent — Capabilities**\n\n` +
                    `I can help you with:\n\n` +
                    `• 📁 **File Analysis** — Upload a file and ask me to analyze it\n` +
                    `• 📊 **Statistics** — "Show me scan statistics" or "How many malware files found?"\n` +
                    `• 🔍 **Search History** — "Show recent ransomware detections"\n` +
                    `• 🦠 **Threat Intel** — "Tell me about trojans" or "What is ransomware?"\n` +
                    `• 💡 **Explain Results** — "Why was this file flagged as malware?"\n\n` +
                    `Just type naturally — I'll figure out what you need!`,
                data: null
            };
        }

        default: {
            return {
                text: `I understand you're asking about: "${userMessage}"\n\n` +
                    `Try asking me to:\n• Show scan statistics\n• Search for recent malware\n• Explain a threat type\n\nOr upload a file for analysis!`,
                data: null
            };
        }
    }
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────

async function runAgent({ sessionId, message, attachedFile, broadcast }) {
    const steps = [];

    const emit = (type, payload) => {
        steps.push({ type, ...payload });
        if (broadcast) broadcast({ type: 'agent_step', session_id: sessionId, step: { type, ...payload } });
    };

    // Step 1: Think
    emit('thinking', { message: 'Analyzing your request...' });
    const intent = detectIntent(message);
    emit('intent', { intent, message: `Detected intent: ${intent.replace('_', ' ').toLowerCase()}` });

    // Step 2: Plan tools
    const toolCalls = [];

    if (intent === 'STATS') {
        toolCalls.push({ tool: 'get_stats', args: {} });
    } else if (intent === 'SEARCH_HISTORY') {
        const keywords = message.match(/\b(ransomware|trojan|worm|spyware|virus|malware|clean)\b/gi);
        const filter = {};
        if (keywords?.some(k => k.toLowerCase() === 'malware')) filter.is_malware = true;
        if (keywords?.some(k => ['ransomware', 'trojan', 'worm', 'spyware', 'virus'].includes(k.toLowerCase()))) {
            filter.malware_type = { $regex: keywords[0], $options: 'i' };
        }
        toolCalls.push({ tool: 'search_scan_history', args: { query: message, filter, limit: 10 } });
    } else if (intent === 'THREAT_INFO') {
        const types = ['ransomware', 'trojan', 'worm', 'spyware', 'virus'];
        const found = types.find(t => message.toLowerCase().includes(t));
        toolCalls.push({ tool: 'get_threat_info', args: { threat_type: found || message } });
    } else if (intent === 'HELP' || intent === 'GENERAL') {
        // No tool calls needed
    }

    emit('planning', { tools: toolCalls.map(t => t.tool), message: `Using ${toolCalls.length} tool(s)` });

    // Step 3: Execute tools
    const toolResults = [];
    for (const call of toolCalls) {
        emit('tool_call', { tool: call.tool, message: `Calling ${call.tool}...` });
        try {
            const result = await TOOLS[call.tool](call.args);
            toolResults.push(result);
            emit('tool_result', { tool: call.tool, success: true, message: `${call.tool} completed` });
        } catch (err) {
            emit('tool_result', { tool: call.tool, success: false, message: `${call.tool} failed: ${err.message}` });
            toolResults.push({ error: err.message });
        }
    }

    // Step 4: Synthesize response
    emit('synthesizing', { message: 'Generating response...' });
    const response = synthesizeResponse(intent, toolResults, message);

    emit('complete', { message: 'Done' });

    return {
        response: response.text,
        data: response.data,
        intent,
        tool_calls: toolCalls,
        steps
    };
}

module.exports = { runAgent };
