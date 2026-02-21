/**
 * Supervisor Agent — Multi-Agent Swarm Controller
 * 
 * Upgraded from simple safety controller to full swarm orchestrator.
 * Routes messages to specialized agents, merges results, resolves conflicts.
 * 
 * Agent Roster:
 *   ├── Blue Defender Agent     (SOC defense, detection, response)
 *   ├── Red Planner Agent       (offensive simulation, lab instructor)
 *   ├── Malware Analysis Agent  (deep file analysis, ML classification)
 *   ├── Threat Intel Agent      (IOC enrichment, feed correlation)
 *   └── Compliance Agent        (CIS, NIST, zero trust, hardening)
 */
const agentCore = require('./y2kAgentCore');
const malwareAgent = require('./malwareAnalysisAgent');
const threatIntelAgent = require('./threatIntelAgent');
const complianceAgent = require('./complianceAgent');

// All specialized agents in the swarm
const AGENT_SWARM = [
    malwareAgent,
    threatIntelAgent,
    complianceAgent,
];

// Allowed private/lab IP ranges for Red Mode
const ALLOWED_PRIVATE_RANGES = [
    /^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./,
    /^localhost$/i, /^0\.0\.0\.0$/
];

// Audit log
const auditLog = [];

function logAudit(mode, action, details, severity = 'info') {
    const entry = { mode, action, details, severity, timestamp: new Date().toISOString() };
    auditLog.unshift(entry);
    if (auditLog.length > 2000) auditLog.pop();
    if (severity === 'critical' || severity === 'warning') {
        console.warn(`[SUPERVISOR][${severity.toUpperCase()}] ${action}: ${details}`);
    }
    return entry;
}

function isAllowedTarget(target) {
    if (!target) return true;
    return ALLOWED_PRIVATE_RANGES.some(r => r.test(target));
}

// Multi-layer misuse detection
function detectMisuse(message, mode) {
    const violations = [];

    if (/real\s*(target|system|server|network|company|org)/i.test(message)) violations.push('real_target');
    if (/production|live\s*server|corporate\s*network/i.test(message)) violations.push('production_target');
    if (/actual\s*attack|real\s*exploit|working\s*payload/i.test(message)) violations.push('real_exploit');
    if (/bypass\s*(lab|restriction|safety|filter)/i.test(message)) violations.push('bypass_attempt');
    if (/ignore\s*(rules|restrictions|safety|lab)/i.test(message)) violations.push('rule_bypass');

    if (mode === 'red') {
        if (/create\s*(virus|worm|ransomware|malware)/i.test(message)) violations.push('malware_creation');
        if (/ddos|denial.of.service.*real/i.test(message)) violations.push('ddos_real');
        if (/steal\s*(credentials|data|money)/i.test(message)) violations.push('theft');
    }

    return violations;
}

class SupervisorAgent {
    constructor() {
        this.name = 'Supervisor Agent';
        this.version = '3.0';
        this.currentMode = 'blue';
        this.sessionRateLimits = new Map();
        this.swarm = AGENT_SWARM;
    }

    setMode(mode) {
        if (!['blue', 'red'].includes(mode)) throw new Error('Invalid mode');
        const prev = this.currentMode;
        this.currentMode = mode;
        logAudit(mode, 'mode_switch', `Switched from ${prev} to ${mode}`, 'info');
        return { success: true, mode, previous: prev };
    }

    getMode() { return this.currentMode; }

    checkRateLimit(sessionId) {
        const now = Date.now();
        const limit = this.sessionRateLimits.get(sessionId) || { count: 0, resetAt: now + 60000 };
        if (now > limit.resetAt) { limit.count = 0; limit.resetAt = now + 60000; }
        limit.count++;
        this.sessionRateLimits.set(sessionId, limit);
        return limit.count <= 30;
    }

    /**
     * Determine which agents should handle a message.
     * Returns array of { agent, relevance } sorted by relevance.
     */
    classifyMessage(message, mode) {
        const candidates = [];

        // Always include the mode-specific core agent as fallback
        candidates.push({ agent: agentCore, relevance: 0.5, agentMode: mode });

        // Check each specialist agent
        for (const agent of this.swarm) {
            if (agent.canHandle(message)) {
                candidates.push({ agent, relevance: 0.8, agentMode: 'blue' });
            }
        }

        // Sort by relevance (highest first)
        candidates.sort((a, b) => b.relevance - a.relevance);
        return candidates;
    }

    /**
     * Route message — delegate to best specialist or core agent.
     * When multiple agents match, the highest-relevance specialist handles it.
     * The supervisor merges context from multiple agents if needed.
     */
    async route(message, mode, sessionId, history = []) {
        // Rate limiting
        if (sessionId && !this.checkRateLimit(sessionId)) {
            logAudit(mode, 'rate_limit', `Session ${sessionId} exceeded rate limit`, 'warning');
            return {
                response: '⏳ **Rate Limit Reached**\n\nYou\'ve sent too many messages too quickly. Please wait a moment.',
                intent: 'rate_limited', steps: [], blocked: true
            };
        }

        // Misuse detection
        const violations = detectMisuse(message, mode);
        if (violations.length > 0) {
            logAudit(mode, 'misuse_blocked', `Violations: ${violations.join(', ')} | Message: "${message.slice(0, 100)}"`, 'critical');
            return {
                response: `🚫 **Request Blocked by Supervisor**\n\n**Violations detected:** ${violations.join(', ')}\n\nY2K Cyber AI is strictly for **authorized lab simulation only**.\n\n**Rules:**\n• Only target private/lab IP ranges (10.x, 192.168.x, 127.x)\n• No real exploit code or working payloads\n• No targeting real production systems\n\nThis action has been logged.`,
                intent: 'blocked', steps: [{ type: 'blocked', message: `Supervisor blocked: ${violations.join(', ')}` }],
                blocked: true, violations
            };
        }

        // Classify and route
        const candidates = this.classifyMessage(message, mode);
        const primary = candidates[0];

        logAudit(mode, 'agent_route', `Routed to: ${primary.agent.name} (${candidates.length} candidates) | "${message.slice(0, 80)}"`, 'info');

        let result;
        if (primary.agent === agentCore) {
            // Use the core agent with mode
            result = await agentCore.think(message, mode, sessionId, history);
        } else {
            // Use specialist agent
            result = await primary.agent.think(message, sessionId, history);
        }

        // Enrich result with swarm metadata
        result.swarm = {
            routing_agent: primary.agent.name,
            candidates: candidates.map(c => ({
                agent: c.agent.name,
                relevance: c.relevance
            })),
            supervisor_version: this.version
        };

        return result;
    }

    async routeStream(message, mode, sessionId, history = [], callbacks = {}) {
        const violations = detectMisuse(message, mode);
        if (violations.length > 0) {
            logAudit(mode, 'misuse_blocked', `Violations: ${violations.join(', ')}`, 'critical');
            callbacks.onChunk?.(`🚫 **Request Blocked** — Violations: ${violations.join(', ')}`);
            return { blocked: true, violations };
        }

        // For streaming, check if a specialist should handle it
        const candidates = this.classifyMessage(message, mode);
        const primary = candidates[0];

        logAudit(mode, 'stream_route', `Routed stream to: ${primary.agent.name} | "${message.slice(0, 80)}"`, 'info');

        // Specialists don't stream yet — fall back to core for streaming
        return agentCore.thinkStream(message, mode, sessionId, history, callbacks);
    }

    /**
     * Multi-agent consultation — ask multiple agents and merge their perspectives
     */
    async consult(message, mode, sessionId, history = []) {
        const candidates = this.classifyMessage(message, mode);
        const agentsToConsult = candidates.filter(c => c.relevance >= 0.7).slice(0, 3);

        if (agentsToConsult.length <= 1) {
            return this.route(message, mode, sessionId, history);
        }

        logAudit(mode, 'multi_consult', `Consulting ${agentsToConsult.length} agents: ${agentsToConsult.map(c => c.agent.name).join(', ')}`, 'info');

        // Run agents in parallel
        const results = await Promise.allSettled(
            agentsToConsult.map(c =>
                c.agent === agentCore
                    ? agentCore.think(message, mode, sessionId, history)
                    : c.agent.think(message, sessionId, history)
            )
        );

        // Merge successful results
        const responses = [];
        const allSteps = [];
        const allToolsUsed = [];

        for (let i = 0; i < results.length; i++) {
            if (results[i].status === 'fulfilled') {
                const r = results[i].value;
                responses.push({
                    agent: agentsToConsult[i].agent.name,
                    response: r.response,
                    relevance: agentsToConsult[i].relevance
                });
                allSteps.push(...(r.steps || []));
                allToolsUsed.push(...(r.toolsUsed || []));
            }
        }

        // Build merged response
        let mergedResponse;
        if (responses.length === 1) {
            mergedResponse = responses[0].response;
        } else {
            mergedResponse = `## 🧠 Multi-Agent Analysis\n\n*${responses.length} specialized agents collaborated on this response:*\n\n`;
            for (const r of responses) {
                const icon = r.agent.includes('Malware') ? '🦠' :
                    r.agent.includes('Threat') ? '📡' :
                        r.agent.includes('Compliance') ? '🛡️' :
                            r.agent.includes('Blue') ? '🔵' :
                                r.agent.includes('Red') ? '🔴' : '🤖';
                mergedResponse += `### ${icon} ${r.agent}\n\n${r.response}\n\n---\n\n`;
            }
        }

        return {
            response: mergedResponse,
            steps: allSteps,
            intent: 'multi_agent',
            toolsUsed: allToolsUsed,
            mode,
            swarm: {
                type: 'multi_consult',
                agents_consulted: responses.map(r => r.agent),
                supervisor_version: this.version
            }
        };
    }

    getSwarmStatus() {
        return {
            supervisor: this.name,
            version: this.version,
            current_mode: this.currentMode,
            agents: [
                { name: 'Y2K Agent Core (Blue)', status: 'active', specialty: 'soc_defense' },
                { name: 'Y2K Agent Core (Red)', status: 'active', specialty: 'offensive_simulation' },
                ...this.swarm.map(a => ({
                    name: a.name,
                    status: 'active',
                    specialty: a.specialty
                }))
            ],
            audit_entries: auditLog.length,
            active_sessions: this.sessionRateLimits.size,
        };
    }

    getAuditLog(limit = 100, severity = null) {
        let log = auditLog.slice(0, limit);
        if (severity) log = log.filter(e => e.severity === severity);
        return log;
    }

    getStatus() {
        return this.getSwarmStatus();
    }
}

module.exports = new SupervisorAgent();
