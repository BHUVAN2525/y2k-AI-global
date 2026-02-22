/**
 * Dynamic Analysis Agent — Agentic Orchestrator for Malware Analysis
 * Chains multiple AI calls to extract IOCs, technologies, behaviors, and root causes.
 * Integrates with Gemini Pro for intelligent analysis.
 */
const axios = require('axios');

class DynamicAnalysisAgent {
    constructor(geminiKey) {
        this.geminiKey = geminiKey;
        this.apiBase = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro';
        this.conversationHistory = [];
    }

    /**
     * Full orchestration: Run multi-turn analysis on sandbox artifacts
     * Returns structured report with IOCs, behaviors, and mitigations
     */
    async orchestrateAnalysis(artifacts) {
        if (!this.geminiKey) {
            return this.buildLocalReport(artifacts);
        }

        try {
            this.conversationHistory = [];
            const report = {
                summary: '',
                classification: '',
                severity: 'unknown',
                behaviors: [],
                iocs: {
                    ips: [],
                    domains: [],
                    files: [],
                    registry: [],
                    urls: []
                },
                techniques: [],
                technologies: [],
                rootcauses: [],
                mitigations: [],
                recommendedActions: [],
                timestamp: new Date().toISOString()
            };

            // Step 1: Behavior Classification
            console.log('[DynamicAnalysis] Step 1: Behavior Classification...');
            const behaviorAnalysis = await this.analyzeBehaviors(artifacts);
            report.summary = behaviorAnalysis.summary;
            report.classification = behaviorAnalysis.classification;
            report.severity = behaviorAnalysis.severity;
            report.behaviors = behaviorAnalysis.behaviors || [];

            // Step 2: IOC Extraction
            console.log('[DynamicAnalysis] Step 2: IOC Extraction...');
            const iocAnalysis = await this.extractIOCs(artifacts, report.behaviors);
            report.iocs = iocAnalysis;

            // Step 3: MITRE ATT&CK Technique Mapping
            console.log('[DynamicAnalysis] Step 3: MITRE ATT&CK Mapping...');
            const techniques = await this.mapMITRETechniques(artifacts, report.behaviors);
            report.techniques = techniques;

            // Step 4: Technology & Framework Identification
            console.log('[DynamicAnalysis] Step 4: Technology Identification...');
            const technologies = await this.identifyTechnologies(artifacts, report.iocs);
            report.technologies = technologies;

            // Step 5: Root Cause & Attack Chain Analysis
            console.log('[DynamicAnalysis] Step 5: Root Cause & Attack Chain...');
            const rootcauses = await this.analyzeRootCauses(artifacts, report);
            report.rootcauses = rootcauses;

            // Step 6: Recommended Mitigations
            console.log('[DynamicAnalysis] Step 6: Mitigations & Response...');
            const mitigations = await this.generateMitigations(report);
            report.mitigations = mitigations.mitigations;
            report.recommendedActions = mitigations.actions;

            return report;
        } catch (err) {
            console.error('[DynamicAnalysis] Orchestration error:', err.message);
            return this.buildLocalReport(artifacts);
        }
    }

    /**
     * Step 1: Classify behavior from execution artifacts
     */
    async analyzeBehaviors(artifacts) {
        const prompt = `You are a malware behavior analyst. Analyze the following sandbox execution and classify the malware behavior.

FILE: ${artifacts.filename}
SIZE: ${artifacts.fileSize} bytes
EXIT CODE: ${artifacts.exitCode}

=== EXECUTION OUTPUT ===
${this.truncate(artifacts.output || '', 2000)}

=== PROCESS SNAPSHOT (After Execution) ===
${this.truncate(artifacts.processes?.after || 'N/A', 1000)}

=== NETWORK SNAPSHOT (After Execution) ===
${this.truncate(artifacts.network?.after || 'N/A', 1000)}

=== FILE CHANGES ===
${this.truncate(artifacts.files?.after || 'N/A', 800)}

Analyze and provide:
1. SUMMARY: Brief 2-3 sentence description of what the malware does
2. CLASSIFICATION: Type of malware (trojan/ransomware/worm/botnet/backdoor/dropper/spyware/adware/rootkit/unknown)
3. SEVERITY: critical/high/medium/low (based on impact potential)
4. BEHAVIORS: List specific malicious behaviors observed (e.g., "Process injection detected", "C2 communication attempted", "File encryption observed")

Respond in JSON format with keys: summary, classification, severity, behaviors (array of strings)`;

        const response = await this.callGemini(prompt);
        return this.parseJSON(response, {
            summary: 'Execution artifact analysis inconclusive',
            classification: 'unknown',
            severity: 'medium',
            behaviors: []
        });
    }

    /**
     * Step 2: Extract IOCs from artifacts
     */
    async extractIOCs(artifacts, behaviors = []) {
        const prompt = `You are an IOC (Indicator of Compromise) extraction specialist. Extract all indicators from the malware execution.

BEHAVIORS DETECTED:
${(behaviors || []).map(b => `- ${b}`).join('\n')}

=== EXECUTION OUTPUT ===
${this.truncate(artifacts.output || '', 2000)}

=== NETWORK DATA ===
${this.truncate(artifacts.network?.after || 'N/A', 1000)}

=== FILE SYSTEM ===
${this.truncate(artifacts.files?.after || 'N/A', 800)}

Extract and list:
1. IPs: All IPv4/IPv6 addresses contacted or spawned
2. DOMAINS: All domains/hostnames accessed
3. FILES: All files created, modified, or accessed
4. REGISTRY: All registry keys modified or accessed (Windows)
5. URLS: Complete URLs with protocols

For each IOC, estimate if it's part of C2 infrastructure, data exfiltration, or malicide logic.

Respond in JSON: { ips: [{value, context}], domains: [{value, context}], files: [{value, purpose}], registry: [{value, purpose}], urls: [{value, purpose}] }`;

        const response = await this.callGemini(prompt);
        return this.parseJSON(response, {
            ips: [],
            domains: [],
            files: [],
            registry: [],
            urls: []
        });
    }

    /**
     * Step 3: Map MITRE ATT&CK techniques
     */
    async mapMITRETechniques(artifacts, behaviors = []) {
        const prompt = `You are a MITRE ATT&CK framework expert. Map observed behaviors to MITRE techniques.

OBSERVED BEHAVIORS:
${(behaviors || []).map(b => `- ${b}`).join('\n')}

=== EXECUTION DETAILS ===
${this.truncate(artifacts.output || '', 1500)}

Maps observed malware behaviors to MITRE ATT&CK techniques. For each technique, provide:
- ID (e.g., T1234)
- Name (technique name)
- Tactic (Execution, Persistence, Privilege Escalation, etc.)
- Evidence: Specific evidence from execution that maps to this technique

Return a JSON array: [{ id, name, tactic, evidence }, ...]`;

        const response = await this.callGemini(prompt);
        const techniques = this.parseJSON(response, []);
        return Array.isArray(techniques) ? techniques : [];
    }

    /**
     * Step 4: Identify malware frameworks, encoding, and technologies used
     */
    async identifyTechnologies(artifacts, iocs = {}) {
        const prompt = `You are a malware reverse engineering expert. Identify technologies, frameworks, and encoding methods in this malware.

=== EXECUTION OUTPUT ===
${this.truncate(artifacts.output || '', 2000)}

=== IOCs EXTRACTED ===
IPs: ${(iocs.ips || []).map(i => i.value).join(', ') || 'None'}
Domains: ${(iocs.domains || []).map(d => d.value).join(', ') || 'None'}
Files: ${(iocs.files || []).map(f => f.value).join(', ') || 'None'}

Identify and analyze:
1. IMPLANTS: Command frameworks, C2 protocols (HTTP, DNS, ICMP, etc.)
2. ENCODING: Obfuscation methods, encryption algorithms, packing
3. FRAMEWORKS: Known malware frameworks (Metasploit, xHunt, etc.)
4. PAYLOADS: Dropper/loader/stager/final payload
5. INFRASTRUCTURE: C2 hosting patterns, botnet architecture

Respond in JSON: { implants: [name], encodings: [method], frameworks: [name], payloads: [type], infrastructure: [pattern] }`;

        const response = await this.callGemini(prompt);
        return this.parseJSON(response, {
            implants: [],
            encodings: [],
            frameworks: [],
            payloads: [],
            infrastructure: []
        });
    }

    /**
     * Step 5: Analyze root causes and attack chain
     */
    async analyzeRootCauses(artifacts, report = {}) {
        const prompt = `You are an incident response expert. Analyze the root cause and attack chain of this malware infection.

MALWARE CLASS: ${report.classification || 'unknown'}
SEVERITY: ${report.severity || 'unknown'}
BEHAVIORS: ${(report.behaviors || []).map(b => `- ${b}`).join('\n')}
IOC COUNT: IPs=${(report.iocs?.ips || []).length}, Domains=${(report.iocs?.domains || []).length}, Files=${(report.iocs?.files || []).length}

=== EXECUTION OUTPUT ===
${this.truncate(artifacts.output || '', 2000)}

Analyze:
1. INITIAL ACCESS: How did the malware execute? (User click, system vulnerability, supply chain, etc.)
2. PERSISTENCE: How does it stay on the system? (Registry run keys, cron jobs, scheduled tasks, etc.)
3. LATERAL MOVEMENT: Does it attempt to spread? Evidence?
4. DATA EXFILTRATION: What data is it trying to steal/encrypt?
5. IMPACT: Immediate and long-term impacts of infection

Respond in JSON: { initial_access: string, persistence: [method], lateral_movement: bool, exfiltration: bool, impact: string }`;

        const response = await this.callGemini(prompt);
        return this.parseJSON(response, {
            initial_access: 'Unknown',
            persistence: [],
            lateral_movement: false,
            exfiltration: false,
            impact: 'Requires investigation'
        });
    }

    /**
     * Step 6: Generate mitigations and response playbook
     */
    async generateMitigations(report = {}) {
        const prompt = `You are a security operations center (SOC) responder. Generate incident response actions and mitigations.

MALWARE CLASSIFICATION: ${report.classification}
SEVERITY: ${report.severity}
IOCs EXTRACTED:
- IPs: ${(report.iocs?.ips || []).map(i => i.value).join(', ') || 'None'}
- Domains: ${(report.iocs?.domains || []).map(d => d.value).join(', ') || 'None'}
- Files: ${(report.iocs?.files || []).map(f => f.value).join(', ') || 'None'}

TECHNIQUES: ${(report.techniques || []).map(t => t.id).join(', ') || 'None'}

Generate:
1. IMMEDIATE ACTIONS: First 24 hours response steps (isolation, containment, evidence preservation)
2. SHORT-TERM: 1-7 days post-incident (eradication, recovery, monitoring)
3. LONG-TERM: Prevention (hardening, detection rules, awareness training)

Respond in JSON: { immediate: [action], shortterm: [action], longterm: [action] }`;

        const response = await this.callGemini(prompt);
        const parsed = this.parseJSON(response, { immediate: [], shortterm: [], longterm: [] });
        
        return {
            mitigations: parsed,
            actions: [
                ...(parsed.immediate || []),
                ...(parsed.shortterm || []),
                ...(parsed.longterm || [])
            ]
        };
    }

    /**
     * Helper: Call Gemini API with conversation history
     */
    async callGemini(userMessage, retries = 2) {
        try {
            const contents = [
                ...this.conversationHistory,
                {
                    role: 'user',
                    parts: [{ text: userMessage }]
                }
            ];

            const response = await axios.post(
                `${this.apiBase}:generateContent?key=${this.geminiKey}`,
                {
                    contents,
                    systemInstruction: {
                        parts: [{ text: 'You are a malware analysis assistant. Use only the data provided and do not hallucinate behaviors or IOCs. If you cannot determine an answer, return null or empty arrays. Output must follow requested JSON schemas.' }]
                    }
                },
                { timeout: 30000 }
            );

            const assistantText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            // Save to history for context
            this.conversationHistory.push(
                { role: 'user', parts: [{ text: userMessage }] },
                { role: 'model', parts: [{ text: assistantText }] }
            );

            return assistantText;
        } catch (err) {
            if (retries > 0 && err.response?.status === 429) {
                await new Promise(r => setTimeout(r, 2000));
                return this.callGemini(userMessage, retries - 1);
            }
            throw err;
        }
    }

    /**
     * Helper: Parse JSON from text response
     */
    parseJSON(text, fallback = {}) {
        try {
            const match = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
            if (match) return JSON.parse(match[0]);
        } catch { }
        return fallback;
    }

    /**
     * Helper: Truncate text to max length
     */
    truncate(text, maxLen = 1000) {
        if (!text) return 'N/A';
        return text.length > maxLen ? text.slice(0, maxLen) + '\n... (truncated)' : text;
    }

    /**
     * Fallback: Local heuristic analysis (no Gemini)
     */
    buildLocalReport(artifacts) {
        const output = artifacts.output || '';
        const isSuspicious = /exec|shell|connect|bind|listen|download|wget|curl|chmod|bash|sh\s/i.test(output);
        const hasNetwork = /\d+\.\d+\.\d+\.\d+:\d+|\d+\.\d+\.\d+\.\d+/g.test((artifacts.network?.after || '') + output);
        const severity = isSuspicious ? (hasNetwork ? 'high' : 'medium') : 'low';

        const behaviors = [];
        if (/exec|shell|cmd|bash|sh\s/i.test(output)) behaviors.push('Shell command execution detected');
        if (/connect|socket|bind|listen/i.test(output)) behaviors.push('Network connection attempt detected');
        if (/wget|curl|download|http|ftp/i.test(output)) behaviors.push('File download or transfer detected');
        if (/cron|@reboot|startup|rc\.d/i.test(output)) behaviors.push('Persistence mechanism detected');
        if (/encrypt|lock|ransom|crypto/i.test(output)) behaviors.push('Encryption or ransomware activity detected');

        const iocs = { ips: [], domains: [], files: [], registry: [], urls: [] };
        const ipMatches = output.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || [];
        const domainMatches = output.match(/\b[a-z0-9-]+\.[a-z]{2,}\b/gi) || [];
        const fileMatches = output.match(/\/[a-zA-Z0-9._\/-]+|C:\\[a-zA-Z0-9._\\-]+/g) || [];
        
        ipMatches.slice(0, 10).forEach(ip => iocs.ips.push({ value: ip, context: 'From execution output' }));
        domainMatches.slice(0, 10).forEach(d => iocs.domains.push({ value: d, context: 'From execution output' }));
        fileMatches.slice(0, 10).forEach(f => iocs.files.push({ value: f, purpose: 'Referenced in execution' }));

        const techniques = [];
        if (/exec|shell/i.test(output)) techniques.push({ id: 'T1059', name: 'Command and Scripting Interpreter', tactic: 'Execution' });
        if (/connect|socket/i.test(output)) techniques.push({ id: 'T1071', name: 'Application Layer Protocol', tactic: 'Command and Control' });
        if (/wget|curl|download/i.test(output)) techniques.push({ id: 'T1105', name: 'Ingress Tool Transfer', tactic: 'Command and Control' });
        if (/cron|startup|persist/i.test(output)) techniques.push({ id: 'T1053', name: 'Scheduled Task', tactic: 'Persistence' });

        return {
            summary: isSuspicious 
                ? `Malware executes suspicious commands${hasNetwork ? ' and initiates network connections' : ''}. requires immediate containment.`
                : 'Execution appears benign or heavily obfuscated. May require deeper analysis.',
            classification: isSuspicious ? 'suspicious' : 'unknown',
            severity,
            behaviors: behaviors.length ? behaviors : ['General suspicious activity'],
            iocs,
            techniques,
            technologies: { implants: [], encodings: [], frameworks: [], payloads: [], infrastructure: [] },
            rootcauses: {
                initial_access: 'User execution or system compromise',
                persistence: [],
                lateral_movement: hasNetwork,
                exfiltration: hasNetwork,
                impact: isSuspicious ? 'System integrity compromised' : 'Unknown'
            },
            mitigations: {
                immediate: ['Isolate affected system from network', 'Preserve evidence and logs'],
                shortterm: ['Remove malware and clean system', 'Monitor for reinfection'],
                longterm: ['Update OS and software', 'Implement EDR solution', 'Security awareness training']
            },
            recommendedActions: [
                'Isolate affected system from network immediately',
                `Block detected IPs/domains at perimeter`,
                'Capture full memory dump for analysis',
                'Scan all connected systems for similar indicators',
                'Review and harden system hardening controls'
            ],
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = DynamicAnalysisAgent;
