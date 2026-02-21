/**
 * Tool Executor
 * Executes tools requested by the Y2K Agent Core.
 * Enforces mode-based permission matrix.
 * SSH tools run on user's VM via sandboxService — never on platform host.
 */
const { vtLookup, abuseIPDB, shodanHost } = require('./apiIntegration');
const sandboxService = require('./sandboxService');
const LogEntry = require('../models/LogEntry');
const Incident = require('../models/Incident');

// ── Permission Matrix ─────────────────────────────────────────────────────────
const TOOL_PERMISSIONS = {
    search_logs: { blue: true, red: false },
    get_incidents: { blue: true, red: false },
    virustotal_lookup: { blue: true, red: true },
    abuseipdb_check: { blue: true, red: false },
    shodan_lookup: { blue: false, red: true },
    ssh_exec: { blue: true, red: true }, // requires active session
    get_sandbox_artifacts: { blue: true, red: false },
    get_mitre_info: { blue: true, red: true },
    generate_siem_rule: { blue: true, red: false },
    build_playbook: { blue: true, red: false },
};

// SSH command whitelist — only safe commands allowed
const SSH_COMMAND_WHITELIST = [
    /^ps\s/i, /^netstat/i, /^ss\s/i, /^ls\s/i, /^cat\s/i,
    /^find\s/i, /^grep\s/i, /^nmap\s/i, /^ping\s/i,
    /^uname/i, /^whoami/i, /^id$/i, /^ifconfig/i, /^ip\s/i,
    /^nikto/i, /^curl\s/i, /^wget\s/i, /^file\s/i,
    /^strings\s/i, /^md5sum/i, /^sha256sum/i, /^hexdump/i,
    /^strace\s/i, /^ltrace\s/i, /^lsof/i, /^top\s/i,
];

function isCommandAllowed(cmd) {
    return SSH_COMMAND_WHITELIST.some(r => r.test(cmd.trim()));
}

// MITRE ATT&CK quick reference
const MITRE_DB = {
    'T1059': { name: 'Command and Scripting Interpreter', tactic: 'Execution', detection: 'Monitor process creation events for cmd.exe, powershell.exe, bash with unusual parent processes', mitigation: 'Disable or restrict scripting languages, use application whitelisting' },
    'T1110': { name: 'Brute Force', tactic: 'Credential Access', detection: 'Alert on >5 failed auth attempts in 60s from same source (Sigma rule: event_id=4625)', mitigation: 'Account lockout policy, MFA, fail2ban' },
    'T1021': { name: 'Remote Services', tactic: 'Lateral Movement', detection: 'Monitor RDP/SSH connections from unusual source IPs, especially internal pivoting', mitigation: 'Network segmentation, jump hosts, MFA for remote access' },
    'T1041': { name: 'Exfiltration Over C2 Channel', tactic: 'Exfiltration', detection: 'Monitor large outbound transfers, unusual DNS queries, encrypted traffic to unknown IPs', mitigation: 'DLP solution, egress filtering, proxy inspection' },
    'T1190': { name: 'Exploit Public-Facing Application', tactic: 'Initial Access', detection: 'WAF alerts, unusual HTTP error rates, web shell detection', mitigation: 'Patch management, WAF, input validation' },
    'T1003': { name: 'OS Credential Dumping', tactic: 'Credential Access', detection: 'Monitor LSASS access (Sysmon Event 10), unusual process accessing SAM/NTDS', mitigation: 'Credential Guard, Protected Users group, restrict debug privileges' },
    'T1046': { name: 'Network Service Scanning', tactic: 'Discovery', detection: 'Alert on port scan patterns (many ports from one source in short time)', mitigation: 'Network segmentation, IDS/IPS rules for scan detection' },
    'T1204': { name: 'User Execution', tactic: 'Execution', detection: 'Monitor file execution from temp/download directories, email attachment execution', mitigation: 'User training, email filtering, application whitelisting' },
    'T1548': { name: 'Abuse Elevation Control Mechanism', tactic: 'Privilege Escalation', detection: 'Monitor sudo usage, UAC bypass attempts, unusual SUID/SGID file creation', mitigation: 'Principle of least privilege, sudo logging, PAM configuration' },
    'T1105': { name: 'Ingress Tool Transfer', tactic: 'Command and Control', detection: 'Monitor outbound connections from servers, unusual file downloads', mitigation: 'Egress filtering, proxy enforcement, file integrity monitoring' },
};

// ── Tool Implementations ──────────────────────────────────────────────────────

async function searchLogs(args) {
    const { query = '', level = null, limit = 10 } = args;
    const filter = {};
    if (level) filter.level = level;
    if (query) filter.$or = [
        { message: { $regex: query, $options: 'i' } },
        { source: { $regex: query, $options: 'i' } }
    ];
    filter.threat_score = { $gte: 10 };
    const logs = await LogEntry.find(filter).sort({ timestamp: -1 }).limit(limit);
    return {
        count: logs.length,
        logs: logs.map(l => ({
            id: l._id, timestamp: l.timestamp, level: l.level,
            message: l.message?.slice(0, 200), source: l.source,
            threat_score: l.threat_score, tags: l.tags
        }))
    };
}

async function getIncidents(args) {
    const { status = null, severity = null, limit = 10 } = args;
    const filter = {};
    if (status) filter.status = status;
    else filter.status = { $ne: 'resolved' };
    if (severity) filter.severity = severity;
    const incidents = await Incident.find(filter).sort({ timestamp: -1 }).limit(limit);
    return {
        count: incidents.length,
        incidents: incidents.map(i => ({
            id: i._id, title: i.title, severity: i.severity,
            status: i.status, type: i.type, source_ip: i.source_ip,
            mitre_technique: i.mitre_technique, timestamp: i.timestamp
        }))
    };
}

function getMitreInfo(args) {
    const { technique_id } = args;
    const id = technique_id?.toUpperCase().replace('MITRE:', '').trim();
    const info = MITRE_DB[id];
    if (!info) return { error: `Technique ${id} not in local database`, technique_id: id };
    return { technique_id: id, ...info };
}

function generateSiemRule(args) {
    const { behavior, platform = 'splunk' } = args;
    const b = behavior?.toLowerCase() || '';

    let rule = '';
    if (/brute.?force|failed.?login|auth.?fail/i.test(b)) {
        rule = platform === 'splunk'
            ? `index=auth sourcetype=linux_secure "Failed password"\n| stats count by src_ip, user\n| where count > 5\n| eval severity="high"\n| table _time, src_ip, user, count, severity`
            : `title: Brute Force Detection\ndetection:\n  selection:\n    EventID: 4625\n  timeframe: 1m\n  condition: selection | count() by src_ip > 5`;
    } else if (/lateral.?move|rdp|smb/i.test(b)) {
        rule = platform === 'splunk'
            ? `index=windows EventCode=4624 Logon_Type=10\n| stats count by src_ip, dest_ip, user\n| where src_ip != dest_ip\n| eval severity="high"`
            : `title: Lateral Movement via RDP\ndetection:\n  selection:\n    EventID: 4624\n    LogonType: 10\n  condition: selection`;
    } else if (/exfil|large.?transfer|data.?out/i.test(b)) {
        rule = platform === 'splunk'
            ? `index=network dest_port!=443 dest_port!=80\n| stats sum(bytes_out) as total_bytes by src_ip, dest_ip\n| where total_bytes > 10000000\n| eval severity="critical"`
            : `title: Data Exfiltration Detection\ndetection:\n  selection:\n    dst_port|not_in: [80, 443]\n    bytes_out|gt: 10000000\n  condition: selection`;
    } else {
        rule = platform === 'splunk'
            ? `index=* "${behavior}"\n| stats count by host, source\n| where count > 3`
            : `title: Custom Detection - ${behavior}\ndetection:\n  keywords:\n    - "${behavior}"\n  condition: keywords`;
    }

    return { platform, behavior, rule, format: platform === 'splunk' ? 'SPL' : 'Sigma YAML' };
}

function buildPlaybook(args) {
    const { threat_type } = args;
    const t = threat_type?.toLowerCase() || '';

    const playbooks = {
        brute_force: {
            name: 'Brute Force Response',
            mitre: 'T1110',
            immediate: ['Block source IP at firewall', 'Lock targeted accounts', 'Alert security team'],
            investigate: ['Check for successful logins after attempts', 'Identify all targeted accounts', 'Review for lateral movement'],
            contain: ['Enable MFA on all accounts', 'Review account lockout policy', 'Deploy fail2ban'],
            eradicate: ['Reset compromised credentials', 'Audit all privileged accounts', 'Review authentication logs'],
            recover: ['Re-enable accounts after password reset', 'Monitor for repeat attempts', 'Update detection rules'],
            lessons: ['Implement MFA', 'Set account lockout after 5 attempts', 'Deploy honeypot accounts']
        },
        malware: {
            name: 'Malware Incident Response',
            mitre: 'T1204',
            immediate: ['Isolate infected host from network', 'Trigger EDR quarantine', 'Preserve memory dump'],
            investigate: ['Run full malware scan', 'Check persistence mechanisms (startup, cron, registry)', 'Review process tree and network connections'],
            contain: ['Block C2 IPs/domains at perimeter', 'Scan all connected systems', 'Check for lateral movement'],
            eradicate: ['Remove malware and persistence', 'Patch exploited vulnerability', 'Update AV signatures'],
            recover: ['Restore from clean backup', 'Verify system integrity', 'Re-enable network access'],
            lessons: ['User security training', 'Email filtering improvement', 'Application whitelisting']
        },
        data_exfiltration: {
            name: 'Data Exfiltration Response',
            mitre: 'T1041',
            immediate: ['Block outbound connection', 'Capture network traffic (PCAP)', 'Isolate affected host'],
            investigate: ['Identify what data was accessed', 'Check DLP alerts', 'Review network flows for destination'],
            contain: ['Block destination IP/domain', 'Revoke compromised credentials', 'Enable enhanced logging'],
            eradicate: ['Remove attacker access', 'Patch entry point', 'Rotate all credentials'],
            recover: ['Notify affected parties if required', 'File incident report', 'Restore normal operations'],
            lessons: ['Implement DLP solution', 'Encrypt sensitive data at rest', 'Monitor large outbound transfers']
        }
    };

    const key = Object.keys(playbooks).find(k => t.includes(k.replace('_', ' ')) || t.includes(k));
    return playbooks[key] || { error: `No playbook for: ${threat_type}`, available: Object.keys(playbooks) };
}

async function sshExec(args, sessionId) {
    const { command, session_id } = args;
    const sid = session_id || sessionId;

    if (!sid) return { error: 'No active sandbox session. Connect a VM first via the Sandbox page.' };
    if (!isCommandAllowed(command)) {
        return { error: `Command not in whitelist: "${command}". Only safe analysis commands are allowed.`, blocked: true };
    }

    const session = sandboxService.getSession(sid);
    if (!session) return { error: 'Session not found or expired. Reconnect your VM.' };

    return new Promise((resolve) => {
        session.conn.exec(command, (err, stream) => {
            if (err) return resolve({ error: err.message });
            let stdout = '', stderr = '';
            stream.on('data', d => stdout += d.toString());
            stream.stderr.on('data', d => stderr += d.toString());
            stream.on('close', () => resolve({
                command, stdout: stdout.slice(0, 3000),
                stderr: stderr.slice(0, 500), success: true
            }));
        });
    });
}

async function getSandboxArtifacts(args) {
    const { session_id } = args;
    if (!session_id) return { error: 'session_id required' };
    try {
        return await sandboxService.collectArtifacts(session_id);
    } catch (err) {
        return { error: err.message };
    }
}

// ── Main Executor ─────────────────────────────────────────────────────────────

async function run(toolName, args, mode, sessionId) {
    const perms = TOOL_PERMISSIONS[toolName];
    if (!perms) return { error: `Unknown tool: ${toolName}` };
    if (!perms[mode]) return { error: `Tool "${toolName}" is not available in ${mode} mode`, blocked: true };

    switch (toolName) {
        case 'search_logs': return searchLogs(args);
        case 'get_incidents': return getIncidents(args);
        case 'virustotal_lookup': return vtLookup(args.hash);
        case 'abuseipdb_check': return abuseIPDB(args.ip);
        case 'shodan_lookup': return shodanHost(args.ip);
        case 'ssh_exec': return sshExec(args, sessionId);
        case 'get_sandbox_artifacts': return getSandboxArtifacts(args);
        case 'get_mitre_info': return getMitreInfo(args);
        case 'generate_siem_rule': return generateSiemRule(args);
        case 'build_playbook': return buildPlaybook(args);
        default: return { error: `Tool not implemented: ${toolName}` };
    }
}

// Tool definitions for Gemini function calling
const TOOL_DEFINITIONS = {
    blue: [
        { name: 'search_logs', description: 'Search security logs for threats or events', parameters: { type: 'object', properties: { query: { type: 'string' }, level: { type: 'string', enum: ['error', 'warning', 'critical'] }, limit: { type: 'integer' } } } },
        { name: 'get_incidents', description: 'Get open security incidents', parameters: { type: 'object', properties: { status: { type: 'string' }, severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] } } } },
        { name: 'virustotal_lookup', description: 'Check a file hash against VirusTotal', parameters: { type: 'object', properties: { hash: { type: 'string', description: 'MD5, SHA1, or SHA256 hash' } }, required: ['hash'] } },
        { name: 'abuseipdb_check', description: 'Check IP reputation on AbuseIPDB', parameters: { type: 'object', properties: { ip: { type: 'string' } }, required: ['ip'] } },
        { name: 'get_mitre_info', description: 'Get MITRE ATT&CK technique details, detection, and mitigation', parameters: { type: 'object', properties: { technique_id: { type: 'string', description: 'e.g. T1059' } }, required: ['technique_id'] } },
        { name: 'generate_siem_rule', description: 'Generate a SIEM detection rule (Splunk SPL or Sigma)', parameters: { type: 'object', properties: { behavior: { type: 'string' }, platform: { type: 'string', enum: ['splunk', 'sigma'] } }, required: ['behavior'] } },
        { name: 'build_playbook', description: 'Build an incident response playbook for a threat type', parameters: { type: 'object', properties: { threat_type: { type: 'string' } }, required: ['threat_type'] } },
        { name: 'ssh_exec', description: 'Run a safe analysis command on the connected sandbox VM', parameters: { type: 'object', properties: { command: { type: 'string' }, session_id: { type: 'string' } }, required: ['command'] } },
        { name: 'get_sandbox_artifacts', description: 'Get process, network, and file artifacts from sandbox execution', parameters: { type: 'object', properties: { session_id: { type: 'string' } }, required: ['session_id'] } },
    ],
    red: [
        { name: 'virustotal_lookup', description: 'Check a file hash against VirusTotal', parameters: { type: 'object', properties: { hash: { type: 'string' } }, required: ['hash'] } },
        { name: 'shodan_lookup', description: 'Look up a lab target IP on Shodan (lab IPs only)', parameters: { type: 'object', properties: { ip: { type: 'string' } }, required: ['ip'] } },
        { name: 'get_mitre_info', description: 'Get MITRE ATT&CK technique details', parameters: { type: 'object', properties: { technique_id: { type: 'string' } }, required: ['technique_id'] } },
        { name: 'ssh_exec', description: 'Run a recon/analysis command on the connected lab VM', parameters: { type: 'object', properties: { command: { type: 'string' }, session_id: { type: 'string' } }, required: ['command'] } },
    ]
};

module.exports = { run, TOOL_DEFINITIONS };
