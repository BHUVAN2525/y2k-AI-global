/**
 * Y2K Agent Core — Unified Dual-Personality AI Agent
 *
 * One brain. Two personalities. Powered by Gemini.
 *
 * Blue Mode: SOC Defender, Analyst, Trainer
 * Red Mode:  Offensive Simulator, Lab Instructor
 *
 * Architecture:
 *   User Message → Personality Loader → Gemini (with tools) → Tool Executor → Final Response
 */
const { geminiChat } = require('../services/apiIntegration');
const toolExecutor = require('../services/toolExecutor');

// ── System Prompts ────────────────────────────────────────────────────────────

const BLUE_SYSTEM_PROMPT = `You are Y2K Blue Agent — an elite AI SOC Analyst, Defender, and Cybersecurity Trainer.

PERSONALITY:
- Calm, analytical, methodical
- You think like a defender: detect, contain, eradicate, recover
- You speak in SOC language: incidents, TTPs, MITRE, SIEM, EDR, SOAR
- You are also a teacher — every response must educate the user

CAPABILITIES:
- Analyze security logs and detect anomalies
- Map threats to MITRE ATT&CK framework
- Generate SIEM detection rules (Splunk SPL, Sigma)
- Build incident response playbooks
- Check file hashes against VirusTotal
- Check IP reputation via AbuseIPDB
- Analyze sandbox malware execution artifacts
- Run safe analysis commands on connected sandbox VM

RESPONSE STYLE:
1. Answer the question directly and clearly
2. Use MITRE technique IDs when relevant (e.g., T1059)
3. Provide actionable steps, not just theory
4. ALWAYS end with a 💡 EDUCATIONAL NOTE: teach the user one thing — a detection rule, a monitoring tip, how to build a SIEM alert, or how to defend against this technique
5. Use markdown formatting with headers and bullet points

SAFETY:
- You only analyze, detect, and defend
- You never provide offensive capabilities
- You always recommend defense-in-depth

Remember: You are both a SOC analyst AND a cybersecurity instructor. Make every interaction a learning opportunity.`;

const RED_SYSTEM_PROMPT = `You are Y2K Red Agent — an AI Red Team Instructor and Offensive Security Simulator.

PERSONALITY:
- Strategic, methodical, thinks like an attacker
- You simulate attack scenarios for AUTHORIZED LAB ENVIRONMENTS ONLY
- You explain HOW attackers think, not just what they do
- You are a teacher — every attack concept must include how to DETECT and DEFEND against it

CAPABILITIES:
- Design attack paths and lateral movement scenarios
- Explain exploitation techniques conceptually (no working exploit code)
- Map attacks to MITRE ATT&CK framework
- Look up lab target info via Shodan (lab IPs only)
- Check file hashes via VirusTotal
- Run reconnaissance commands on connected lab VM via SSH
- Explain how vulnerabilities are structured and why they exist

RESPONSE STYLE:
1. Explain the attack scenario clearly with step-by-step logic
2. Map each step to MITRE ATT&CK technique IDs
3. Show the attack path as a chain
4. ALWAYS end with a 🎓 DEFENDER'S PERSPECTIVE: explain how a Blue Team would detect and stop this attack
5. Use markdown formatting

ABSOLUTE RULES:
- NEVER provide working exploit code, shellcode, or actual payloads
- NEVER target real production systems — lab/private IP ranges only
- NEVER help bypass real security controls on real systems
- If asked to attack real systems: refuse and explain why

Remember: You are a Red Team INSTRUCTOR. Your goal is to teach defenders by showing them how attackers think.`;

// ── Educational Note Generator (fallback when no Gemini) ─────────────────────

const BLUE_EDUCATIONAL_NOTES = [
    '💡 **Detection Tip:** Enable Windows Event ID 4625 alerting for failed logins. Alert when >5 failures from same IP in 60 seconds.',
    '💡 **SIEM Rule:** In Splunk: `index=auth "Failed password" | stats count by src_ip | where count > 5`',
    '💡 **Defense:** Implement the principle of least privilege — users should only have access to what they need, nothing more.',
    '💡 **Monitoring:** Deploy Sysmon with a good config (SwiftOnSecurity template) to get rich process and network telemetry.',
    '💡 **EDR Tip:** Monitor for LSASS memory access (Sysmon Event 10) — this is a key indicator of credential dumping.',
    '💡 **Network:** Segment your network. Attackers who compromise one host should not be able to reach everything else.',
];

const RED_EDUCATIONAL_NOTES = [
    '🎓 **Defender\'s Perspective:** This technique is detected by monitoring process creation events with unusual parent-child relationships.',
    '🎓 **Blue Team Counter:** Enable network flow logging. Lateral movement creates unusual internal traffic patterns.',
    '🎓 **Detection:** This attack leaves traces in Windows Security Event Log. Event IDs 4624, 4625, 4648 are your friends.',
    '🎓 **Mitigation:** The best defense against this is network segmentation + MFA + privileged access workstations (PAW).',
    '🎓 **Sigma Rule:** Write a Sigma rule for this behavior and load it into your SIEM to catch it in real-time.',
];

function getRandomNote(mode) {
    const notes = mode === 'blue' ? BLUE_EDUCATIONAL_NOTES : RED_EDUCATIONAL_NOTES;
    return notes[Math.floor(Math.random() * notes.length)];
}

// ── Heuristic Fallback (when no Gemini key) ───────────────────────────────────

function heuristicBlue(message) {
    const m = message.toLowerCase();
    if (/brute.?force|failed.?login|auth.?fail/i.test(m)) {
        return `🛡️ **Brute Force Attack Detected Pattern**\n\n**MITRE:** T1110 — Brute Force (Credential Access)\n\n**Immediate Actions:**\n• Block source IP at firewall\n• Lock targeted accounts temporarily\n• Alert security team\n\n**Investigation:**\n• Check for successful logins after failed attempts\n• Identify all targeted accounts\n• Look for lateral movement\n\n**Mitigation:**\n• Enable MFA on all accounts\n• Set account lockout after 5 attempts\n• Deploy fail2ban or equivalent\n\n${getRandomNote('blue')}`;
    }
    if (/malware|virus|ransomware|trojan/i.test(m)) {
        return `🦠 **Malware Incident Response**\n\n**MITRE:** T1204 — User Execution\n\n**Immediate Actions:**\n• Isolate infected host from network immediately\n• Trigger EDR quarantine\n• Preserve memory dump before remediation\n\n**Investigation:**\n• Run full malware scan\n• Check persistence mechanisms (startup, cron, registry)\n• Review process tree and network connections\n\n**Mitigation:**\n• Update AV signatures\n• Patch exploited vulnerability\n• User security training\n\n${getRandomNote('blue')}`;
    }
    if (/log|event|syslog/i.test(m)) {
        return `📡 **Log Analysis**\n\nI can analyze your security logs for:\n• Failed authentication attempts (T1110)\n• Privilege escalation (T1548)\n• Lateral movement (T1021)\n• Data exfiltration (T1041)\n• Malware execution (T1204)\n\nTo get started, ingest logs via the **Log Viewer** page or ask me about a specific threat.\n\n${getRandomNote('blue')}`;
    }
    if (/mitre|technique|tactic/i.test(m)) {
        return `🎯 **MITRE ATT&CK Framework**\n\nKey techniques to monitor:\n\n| Technique | ID | Tactic |\n|---|---|---|\n| Brute Force | T1110 | Credential Access |\n| Command Execution | T1059 | Execution |\n| Lateral Movement | T1021 | Lateral Movement |\n| Credential Dumping | T1003 | Credential Access |\n| Data Exfiltration | T1041 | Exfiltration |\n\nAsk me about any specific technique for detection rules and mitigation.\n\n${getRandomNote('blue')}`;
    }
    if (/siem|rule|detect|sigma|splunk/i.test(m)) {
        return `📊 **SIEM Detection Rules**\n\nI can generate detection rules for:\n• Brute force attacks\n• Lateral movement\n• Data exfiltration\n• Privilege escalation\n• Malware execution\n\n**Example Splunk rule for brute force:**\n\`\`\`\nindex=auth "Failed password"\n| stats count by src_ip, user\n| where count > 5\n| eval severity="high"\n\`\`\`\n\nAsk me to generate a rule for any specific behavior.\n\n${getRandomNote('blue')}`;
    }
    return `🛡️ **Y2K Blue Agent — SOC Defender**\n\nI'm your AI-powered SOC analyst and cybersecurity trainer. I can help you:\n\n• **Analyze** threats and security logs\n• **Map** attacks to MITRE ATT&CK\n• **Generate** SIEM detection rules (Splunk/Sigma)\n• **Build** incident response playbooks\n• **Check** file hashes via VirusTotal\n• **Analyze** malware sandbox artifacts\n\n💡 **Tip:** Add your Gemini API key in Settings to unlock full AI-powered analysis.\n\n${getRandomNote('blue')}`;
}

function heuristicRed(message) {
    const m = message.toLowerCase();
    if (/web.*db|database|sql|lateral/i.test(m)) {
        return `⚔️ **Attack Path: Web Server → Database Lateral Movement**\n\n**MITRE Chain:**\n1. T1190 — Exploit Public-Facing Application (SQLi/RCE) → 75% success\n2. T1059 — Command Execution (web shell) → 70% success\n3. T1046 — Network Service Scanning (find DB) → 90% success\n4. T1552 — Unsecured Credentials (config files) → 65% success\n5. T1041 — Data Exfiltration → 70% success\n\n**Overall probability:** ~22% | **Time:** 2-4 hours\n\n**Prerequisites:** HTTP/HTTPS open, MySQL/PostgreSQL on internal network\n\n🎓 **Defender's Perspective:** Detect this with WAF alerts on SQLi patterns + monitor internal port 3306/5432 connections from web servers. Config files should never contain plaintext credentials.\n\n⚠️ *Authorized lab simulation only*`;
    }
    if (/rdp|remote.?desktop/i.test(m)) {
        return `⚔️ **Attack Path: RDP Lateral Movement**\n\n**MITRE Chain:**\n1. T1110 — Brute Force on RDP (port 3389) → 60% success\n2. T1021.001 — Remote Desktop Protocol access → 80% success\n3. T1003 — Credential Dumping (Mimikatz) → 65% success\n4. T1550.002 — Pass-the-Hash to other hosts → 70% success\n5. T1078.002 — Domain Admin escalation → 50% success\n\n**Overall probability:** ~11% | **Time:** 4-8 hours\n\n🎓 **Defender's Perspective:** Restrict RDP to jump hosts only. Enable Network Level Authentication. Monitor Event ID 4624 (Logon Type 10) from unusual sources. Deploy Credential Guard to prevent Mimikatz.\n\n⚠️ *Authorized lab simulation only*`;
    }
    if (/smb|eternal|445/i.test(m)) {
        return `⚔️ **Attack Path: EternalBlue SMB Exploitation**\n\n**MITRE Chain:**\n1. T1046 — Network Service Scanning (find port 445) → 95% success\n2. T1190 — Check for MS17-010 vulnerability → 80% success\n3. T1210 — EternalBlue exploit (CVE-2017-0144) → 85% success\n4. T1543 — Deploy DoublePulsar backdoor → 75% success\n5. T1053 — Establish persistence → 80% success\n\n**Overall probability:** ~43% | **Time:** 30 minutes\n\n🎓 **Defender's Perspective:** Patch MS17-010 immediately. Block SMB (445) at perimeter. Use Sigma rule: alert on SMBv1 connections. Run \`nmap --script smb-vuln-ms17-010\` on your lab to verify patching.\n\n⚠️ *Authorized lab simulation only*`;
    }
    if (/recon|scan|nmap/i.test(m)) {
        return `🔍 **Reconnaissance Simulation**\n\n**Phase 1 — Passive Recon:**\n• OSINT: WHOIS, DNS records, certificate transparency\n• Shodan: exposed services and banners\n• LinkedIn: employee enumeration for phishing targets\n\n**Phase 2 — Active Recon (Lab VM only):**\n• Port scan: \`nmap -sV -sC -O <lab_ip>\`\n• Service enumeration: banner grabbing\n• Vulnerability scan: Nikto, OpenVAS\n\n**MITRE:** T1595 (Active Scanning), T1596 (Search Open Sources)\n\n🎓 **Defender's Perspective:** Detect active recon with IDS rules for port scan patterns. Monitor for unusual DNS queries. Use honeypots to detect internal recon.\n\n⚠️ *Connect your lab VM in Sandbox to run actual commands*`;
    }
    return `⚔️ **Y2K Red Agent — Offensive Simulator**\n\nI simulate attack scenarios for authorized lab testing. Ask me:\n\n• "How would an attacker move from web server to database?"\n• "Show me RDP lateral movement steps"\n• "EternalBlue SMB exploitation path"\n• "How does phishing work technically?"\n• "What is pass-the-hash attack?"\n\n🎓 **Remember:** Every attack I explain includes how to detect and defend against it. I'm a Red Team INSTRUCTOR.\n\n💡 **Tip:** Add your Gemini API key in Settings for full AI-powered attack simulation.\n\n⚠️ *Authorized Lab Simulation Mode Only*`;
}

// ── Main Agent Core ───────────────────────────────────────────────────────────

class Y2KAgentCore {
    constructor() {
        this.name = 'Y2K Agent Core';
        this.version = '2.0';
    }

    /**
     * Main think method — uses Gemini if key available, falls back to heuristics
     * @param {string} message - User message
     * @param {string} mode - 'blue' or 'red'
     * @param {string} sessionId - Active sandbox session ID (optional)
     * @param {Array} history - Previous messages [{role, content}]
     */
    async think(message, mode = 'blue', sessionId = null, history = []) {
        const systemPrompt = mode === 'red' ? RED_SYSTEM_PROMPT : BLUE_SYSTEM_PROMPT;
        const tools = toolExecutor.TOOL_DEFINITIONS[mode] || [];
        const steps = [{ type: 'thinking', message: `Y2K ${mode.toUpperCase()} Agent analyzing: "${message.slice(0, 60)}..."` }];
        const toolsUsed = [];

        try {
            // Build message history for Gemini
            const messages = [
                ...history.slice(-6), // last 3 exchanges
                { role: 'user', content: message }
            ];

            // Try Gemini first
            let geminiResponse;
            try {
                geminiResponse = await geminiChat({ systemPrompt, messages, tools });
            } catch (err) {
                if (err.message === 'NO_GEMINI_KEY') {
                    // Graceful fallback to heuristics
                    steps.push({ type: 'info', message: 'No Gemini key — using built-in intelligence' });
                    const response = mode === 'red' ? heuristicRed(message) : heuristicBlue(message);
                    return { response, steps, intent: 'heuristic', toolsUsed: [], mode, educational_note: null };
                }
                throw err;
            }

            // Handle tool calls from Gemini
            let finalText = geminiResponse.text;
            let toolResults = [];

            if (geminiResponse.toolCalls?.length > 0) {
                for (const tc of geminiResponse.toolCalls) {
                    steps.push({ type: 'tool_call', message: `Calling ${tc.name}(${JSON.stringify(tc.args).slice(0, 80)})` });
                    const result = await toolExecutor.run(tc.name, tc.args, mode, sessionId);
                    toolsUsed.push({ tool: tc.name, args: tc.args, result });
                    toolResults.push({ name: tc.name, result });
                    steps.push({ type: 'tool_result', message: `${tc.name} → ${result.error ? 'Error: ' + result.error : 'Success'}` });
                }

                // Feed tool results back to Gemini for final synthesis
                if (toolResults.length > 0) {
                    const toolSummary = toolResults.map(tr =>
                        `Tool: ${tr.name}\nResult: ${JSON.stringify(tr.result).slice(0, 1000)}`
                    ).join('\n\n');

                    const synthesisMessages = [
                        ...messages,
                        { role: 'assistant', content: geminiResponse.text || 'I found the following information:' },
                        { role: 'user', content: `Here are the tool results:\n\n${toolSummary}\n\nPlease provide a complete, educational response based on these results.` }
                    ];

                    try {
                        const synthesis = await geminiChat({ systemPrompt, messages: synthesisMessages, tools: [] });
                        finalText = synthesis.text || finalText;
                    } catch { }
                }
            }

            steps.push({ type: 'synthesizing', message: 'Generating final response...' });

            return {
                response: finalText || (mode === 'red' ? heuristicRed(message) : heuristicBlue(message)),
                steps,
                intent: 'gemini',
                toolsUsed,
                mode,
                educational_note: null // embedded in Gemini response
            };

        } catch (err) {
            // Final fallback
            const response = mode === 'red' ? heuristicRed(message) : heuristicBlue(message);
            return { response, steps, intent: 'fallback', toolsUsed: [], mode, error: err.message };
        }
    }

    /**
     * Stream version — calls onChunk for each text token, onTool for each tool call
     */
    async thinkStream(message, mode = 'blue', sessionId = null, history = [], { onChunk, onTool, onStep } = {}) {
        const { geminiStream } = require('../services/apiIntegration');
        const systemPrompt = mode === 'red' ? RED_SYSTEM_PROMPT : BLUE_SYSTEM_PROMPT;

        onStep?.({ type: 'thinking', message: `Y2K ${mode.toUpperCase()} Agent analyzing...` });

        const messages = [
            ...history.slice(-6),
            { role: 'user', content: message }
        ];

        try {
            const fullText = await geminiStream({
                systemPrompt,
                messages,
                onChunk: (text) => onChunk?.(text)
            });
            return { response: fullText, mode, intent: 'gemini_stream' };
        } catch (err) {
            if (err.message === 'NO_GEMINI_KEY') {
                const response = mode === 'red' ? heuristicRed(message) : heuristicBlue(message);
                // Stream heuristic response word by word
                const words = response.split(' ');
                for (const word of words) {
                    onChunk?.(word + ' ');
                    await new Promise(r => setTimeout(r, 15));
                }
                return { response, mode, intent: 'heuristic_stream' };
            }
            throw err;
        }
    }
}

module.exports = new Y2KAgentCore();
