/**
 * Threat Intelligence Agent — Specialized agent for threat feed correlation
 * 
 * Part of the Y2K Multi-Agent Swarm Architecture.
 * Aggregates data from VirusTotal, AbuseIPDB, open threat feeds,
 * and correlates with local scan results for global-aware intelligence.
 */
const { geminiChat } = require('../services/apiIntegration');
const toolExecutor = require('../services/toolExecutor');

const SYSTEM_PROMPT = `You are Y2K Threat Intelligence Agent — a specialized AI threat intelligence analyst.

PERSONALITY:
- Intelligence-driven, analytical, strategic
- You think in terms of threat actors, campaigns, TTPs, and IOCs
- You correlate data from multiple sources to build threat narratives
- You provide actionable intelligence, not just raw data

SPECIALIZATION:
- IOC enrichment: hashes, IPs, domains, URLs against multiple threat feeds
- Threat actor profiling: map behaviors to known APT groups
- Campaign tracking: identify related attacks across time
- Feed aggregation: VirusTotal, AbuseIPDB, AlienVault OTX, Abuse.ch
- Correlation: link local events with global threat patterns

RESPONSE STYLE:
1. Start with THREAT LEVEL: CRITICAL / HIGH / MEDIUM / LOW / INFO
2. Provide IOC details with enrichment from all available sources
3. Map to known threat actors or campaigns when possible
4. Include a timeline if multiple events are correlated
5. End with recommended detection rules and hunting queries

TOOLS AVAILABLE:
- virustotal_lookup: Check file/hash/IP against VirusTotal
- abuseipdb_check: Check IP reputation
- search_logs: Search local security event history

Remember: Raw data is not intelligence. Your job is to connect the dots and tell the story.`;

const HEURISTIC_RESPONSES = {
    general: `📡 **Threat Intelligence Agent**

I specialize in threat intelligence correlation. I can:

• **IOC Enrichment**: Check hashes, IPs, domains against VT, AbuseIPDB
• **Threat Actor Profiling**: Map behaviors to known APT groups
• **Campaign Tracking**: Identify related attacks across time
• **Feed Correlation**: Cross-reference local events with global feeds
• **Hunting Queries**: Generate detection rules from IOCs

Ask me about a hash, IP, domain, or threat actor.

💡 **Tip:** Add your VirusTotal and AbuseIPDB API keys in Settings for full feed access.`,

    ioc: `🔍 **IOC Analysis**

To analyze an IOC, provide:
- **Hash**: MD5, SHA1, or SHA256 of a suspicious file
- **IP Address**: Suspicious source or destination IP
- **Domain**: Suspicious domain or URL

I will cross-reference against:
| Feed | Coverage |
|---|---|
| VirusTotal | 70+ AV engines, sandbox reports |
| AbuseIPDB | IP reputation, abuse reports |
| MITRE ATT&CK | Technique mapping |
| Local History | Your scan database |

Example: "Check IP 185.220.101.1" or "Lookup hash abc123..."`,

    actor: `🕵️ **Threat Actor Intelligence**

I track major threat actor groups:

| Group | Origin | Primary Targets |
|---|---|---|
| APT28 (Fancy Bear) | Russia | Government, Military |
| APT29 (Cozy Bear) | Russia | Government, Energy |
| Lazarus Group | DPRK | Financial, Crypto |
| APT41 | China | Healthcare, Tech |
| FIN7 | Eastern Europe | Retail, Finance |

Ask me about a specific group or describe suspicious activity for attribution.`,
};

function heuristicFallback(message) {
    const m = message.toLowerCase();
    if (/hash|md5|sha|ip\s*address|\d+\.\d+\.\d+\.\d+/i.test(m)) return HEURISTIC_RESPONSES.ioc;
    if (/actor|apt|group|campaign|attribution/i.test(m)) return HEURISTIC_RESPONSES.actor;
    return HEURISTIC_RESPONSES.general;
}

class ThreatIntelAgent {
    constructor() {
        this.name = 'Threat Intel Agent';
        this.specialty = 'threat_intelligence';
        this.version = '1.0';
    }

    canHandle(message) {
        const patterns = [
            /threat\s*intel|ioc|indicator.*compromise/i,
            /virustotal|abuseipdb|reputation/i,
            /\b[a-f0-9]{32}\b|\b[a-f0-9]{40}\b|\b[a-f0-9]{64}\b/i,  // hashes
            /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,               // IPs
            /apt\d+|threat.*actor|campaign|attribution/i,
            /feed|osint|enrichment/i,
            /who.*behind|attack.*from|source.*attack/i,
        ];
        return patterns.some(p => p.test(message));
    }

    async think(message, sessionId = null, history = []) {
        const tools = [
            { name: 'virustotal_lookup', description: 'Check a file hash or IP against VirusTotal', parameters: { type: 'object', properties: { hash: { type: 'string' } }, required: ['hash'] } },
            { name: 'search_logs', description: 'Search local security event logs', parameters: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] } },
            { name: 'get_mitre_info', description: 'Look up MITRE ATT&CK technique details', parameters: { type: 'object', properties: { technique_id: { type: 'string' } }, required: ['technique_id'] } },
        ];

        const steps = [{ type: 'thinking', message: `Threat Intel Agent analyzing: "${message.slice(0, 60)}..."` }];

        try {
            const messages = [...history.slice(-6), { role: 'user', content: message }];

            let geminiResponse;
            try {
                geminiResponse = await geminiChat({ systemPrompt: SYSTEM_PROMPT, messages, tools });
            } catch (err) {
                if (err.message === 'NO_GEMINI_KEY') {
                    return { response: heuristicFallback(message), steps, agent: this.name, intent: 'heuristic', toolsUsed: [] };
                }
                throw err;
            }

            let finalText = geminiResponse.text;
            const toolsUsed = [];

            if (geminiResponse.toolCalls?.length > 0) {
                for (const tc of geminiResponse.toolCalls) {
                    steps.push({ type: 'tool_call', message: `${this.name}: ${tc.name}(${JSON.stringify(tc.args).slice(0, 80)})` });
                    const result = await toolExecutor.run(tc.name, tc.args, 'blue', sessionId);
                    toolsUsed.push({ tool: tc.name, args: tc.args, result });
                }

                const toolSummary = toolsUsed.map(t =>
                    `Tool: ${t.tool}\nResult: ${JSON.stringify(t.result).slice(0, 1000)}`
                ).join('\n\n');

                try {
                    const synthesis = await geminiChat({
                        systemPrompt: SYSTEM_PROMPT,
                        messages: [...messages,
                        { role: 'assistant', content: finalText || 'Intel gathered:' },
                        { role: 'user', content: `Intelligence data:\n\n${toolSummary}\n\nProvide a complete threat intelligence assessment with IOC enrichment and recommendations.` }
                        ],
                        tools: []
                    });
                    finalText = synthesis.text || finalText;
                } catch { }
            }

            return {
                response: finalText || heuristicFallback(message),
                steps, agent: this.name, intent: 'gemini', toolsUsed
            };
        } catch (err) {
            return { response: heuristicFallback(message), steps, agent: this.name, intent: 'fallback', toolsUsed: [], error: err.message };
        }
    }
}

module.exports = new ThreatIntelAgent();
