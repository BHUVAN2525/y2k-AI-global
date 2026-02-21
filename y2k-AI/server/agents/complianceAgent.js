/**
 * Compliance Agent — Specialized agent for security compliance and hardening
 * 
 * Part of the Y2K Multi-Agent Swarm Architecture.
 * Checks configurations against CIS benchmarks, NIST, ISO 27001,
 * recommends hardening steps, validates zero trust posture.
 */
const { geminiChat } = require('../services/apiIntegration');
const toolExecutor = require('../services/toolExecutor');

const SYSTEM_PROMPT = `You are Y2K Compliance Agent — a specialized AI security compliance analyst and zero trust consultant.

PERSONALITY:
- Thorough, standards-driven, risk-aware
- You think in terms of compliance frameworks, controls, and audit readiness
- You translate technical findings into compliance language
- You recommend specific, actionable hardening steps

SPECIALIZATION:
- CIS Benchmarks: OS hardening, service configuration
- NIST Cybersecurity Framework: Identify, Protect, Detect, Respond, Recover
- ISO 27001: Information security management controls
- Zero Trust: Network segmentation, least privilege, micro-segmentation
- Policy generation: UFW rules, SSH hardening, fail2ban, password policies
- Patch management: CVE assessment, update prioritization

RESPONSE STYLE:
1. Start with COMPLIANCE STATUS: PASS / PARTIAL / FAIL with score
2. List findings organized by framework control
3. For each finding: severity, current state, recommended state, remediation command
4. Provide a prioritized remediation plan
5. Use tables for structured compliance data

CAPABILITIES:
- Analyze system configurations via SSH (sandbox VM)
- Generate hardening scripts (UFW, SSH, fail2ban, sysctl)
- Check against CIS benchmarks
- Assess zero trust posture
- Generate compliance reports

Remember: Compliance is not security, but it's a baseline. Always go beyond checkbox compliance.`;

const CIS_CHECKS = {
    ssh: {
        title: 'SSH Configuration Hardening',
        checks: [
            { id: 'CIS-5.2.1', control: 'Ensure SSH Protocol is 2', command: 'grep "^Protocol" /etc/ssh/sshd_config', expected: 'Protocol 2', fix: 'echo "Protocol 2" >> /etc/ssh/sshd_config' },
            { id: 'CIS-5.2.2', control: 'Disable SSH root login', command: 'grep "^PermitRootLogin" /etc/ssh/sshd_config', expected: 'PermitRootLogin no', fix: 'sed -i "s/^PermitRootLogin.*/PermitRootLogin no/" /etc/ssh/sshd_config' },
            { id: 'CIS-5.2.3', control: 'Set SSH MaxAuthTries', command: 'grep "^MaxAuthTries" /etc/ssh/sshd_config', expected: 'MaxAuthTries 4', fix: 'echo "MaxAuthTries 4" >> /etc/ssh/sshd_config' },
            { id: 'CIS-5.2.4', control: 'Disable empty passwords', command: 'grep "^PermitEmptyPasswords" /etc/ssh/sshd_config', expected: 'PermitEmptyPasswords no', fix: 'echo "PermitEmptyPasswords no" >> /etc/ssh/sshd_config' },
        ]
    },
    firewall: {
        title: 'Firewall Configuration',
        checks: [
            { id: 'CIS-3.5.1', control: 'Ensure UFW is installed', command: 'dpkg -l | grep ufw', expected: 'ii  ufw', fix: 'apt-get install -y ufw' },
            { id: 'CIS-3.5.2', control: 'Ensure UFW is enabled', command: 'ufw status', expected: 'Status: active', fix: 'ufw --force enable' },
            { id: 'CIS-3.5.3', control: 'Ensure default deny policy', command: 'ufw status verbose | grep Default', expected: 'deny (incoming)', fix: 'ufw default deny incoming' },
        ]
    },
    passwords: {
        title: 'Password Policy',
        checks: [
            { id: 'CIS-5.4.1', control: 'Password max days', command: 'grep PASS_MAX_DAYS /etc/login.defs', expected: 'PASS_MAX_DAYS 90', fix: 'sed -i "s/^PASS_MAX_DAYS.*/PASS_MAX_DAYS 90/" /etc/login.defs' },
            { id: 'CIS-5.4.2', control: 'Password min length', command: 'grep PASS_MIN_LEN /etc/login.defs', expected: 'PASS_MIN_LEN 14', fix: 'sed -i "s/^PASS_MIN_LEN.*/PASS_MIN_LEN 14/" /etc/login.defs' },
        ]
    }
};

const HEURISTIC_RESPONSES = {
    general: `🛡️ **Compliance Agent**

I specialize in security compliance and hardening. I can:

• **CIS Benchmarks**: Check OS and service configurations
• **NIST Framework**: Map controls to Identify, Protect, Detect, Respond, Recover
• **Zero Trust**: Analyze network trust levels, recommend micro-segmentation
• **Policy Generation**: Create UFW, SSH, fail2ban, and password policies
• **Patch Assessment**: CVE prioritization and update commands

Ask me to audit a specific area or generate a hardening config.

💡 **Tip:** Connect your sandbox VM for live compliance scanning.`,

    hardening: (area) => `🔒 **${area} Hardening Guide**

| Check | CIS ID | Status | Fix |
|---|---|---|---|
${(CIS_CHECKS[area.toLowerCase()]?.checks || CIS_CHECKS.ssh.checks).map(c =>
        `| ${c.control} | ${c.id} | ⚠️ Check | \`${c.fix}\` |`
    ).join('\n')}

Connect your sandbox VM and I can run these checks automatically.`,

    zerotrust: `🌐 **Zero Trust Assessment**

Zero Trust Principles to validate:

| Principle | Check | Tool |
|---|---|---|
| Verify explicitly | MFA on all access | SSH config audit |
| Least privilege | User permissions | \`cat /etc/sudoers\` |
| Assume breach | Network segmentation | \`iptables -L\`, \`ufw status\` |
| Micro-segmentation | Service isolation | \`netstat -tlnp\` |
| Encrypt everywhere | TLS termination | Certificate checks |

I can run a full zero trust assessment on your sandbox VM.`,
};

function heuristicFallback(message) {
    const m = message.toLowerCase();
    if (/harden|cis|benchmark|audit/i.test(m)) {
        if (/ssh/i.test(m)) return HEURISTIC_RESPONSES.hardening('SSH');
        if (/firewall|ufw|iptable/i.test(m)) return HEURISTIC_RESPONSES.hardening('Firewall');
        if (/password/i.test(m)) return HEURISTIC_RESPONSES.hardening('Passwords');
        return HEURISTIC_RESPONSES.hardening('SSH');
    }
    if (/zero.*trust|segmentation|least.*privilege/i.test(m)) return HEURISTIC_RESPONSES.zerotrust;
    return HEURISTIC_RESPONSES.general;
}

class ComplianceAgent {
    constructor() {
        this.name = 'Compliance Agent';
        this.specialty = 'compliance';
        this.version = '1.0';
        this.cisChecks = CIS_CHECKS;
    }

    canHandle(message) {
        const patterns = [
            /complian|cis|nist|iso.*27001|benchmark/i,
            /harden|hardening|secure.*config/i,
            /zero.*trust|segmentation|least.*privilege|micro.*segment/i,
            /policy|ufw|iptable|firewall.*rule|fail2ban/i,
            /password.*policy|ssh.*config|audit/i,
            /patch.*recommend|cve.*fix|update.*command/i,
        ];
        return patterns.some(p => p.test(message));
    }

    async think(message, sessionId = null, history = []) {
        const tools = [
            { name: 'ssh_exec', description: 'Run a safe analysis command on the connected sandbox VM', parameters: { type: 'object', properties: { command: { type: 'string' }, session_id: { type: 'string' } }, required: ['command'] } },
            { name: 'get_mitre_info', description: 'Look up MITRE ATT&CK technique details', parameters: { type: 'object', properties: { technique_id: { type: 'string' } }, required: ['technique_id'] } },
        ];

        const steps = [{ type: 'thinking', message: `Compliance Agent analyzing: "${message.slice(0, 60)}..."` }];

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
                        { role: 'assistant', content: finalText || 'Audit results:' },
                        { role: 'user', content: `Audit data:\n\n${toolSummary}\n\nProvide a compliance assessment with findings, scores, and remediation steps.` }
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

module.exports = new ComplianceAgent();
