/**
 * Self-Healing Security Engine — Y2K Cyber AI (Node.js Port)
 * Risk scoring, remediation script generation, and validation pipeline.
 */

const SEVERITY_WEIGHTS = {
    critical: 10,
    high: 7,
    medium: 4,
    low: 2,
    info: 1
};

const ASSET_CRITICALITY = {
    database: 10,
    auth_server: 9,
    web_server: 8,
    api_gateway: 8,
    file_server: 6,
    workstation: 4,
    dev_server: 3,
    sandbox: 1
};

const REMEDIATION_TEMPLATES = {
    brute_force: {
        name: "Brute Force Mitigation", mitre: "T1110", risk_reduction: 0.85,
        steps: [
            { action: "block_ip", command: "sudo ufw deny from {source_ip}", risk: "low", auto_approve: true },
            { action: "install_fail2ban", command: "sudo apt-get install -y fail2ban && sudo systemctl enable fail2ban", risk: "low", auto_approve: true },
            { action: "configure_fail2ban", command: 'echo "[sshd]\\nenabled = true\\nmaxretry = 3\\nbantime = 3600" | sudo tee /etc/fail2ban/jail.local', risk: "medium", auto_approve: false },
            { action: "enforce_strong_passwords", command: "sudo apt-get install -y libpam-pwquality", risk: "low", auto_approve: true }
        ]
    },
    open_ports: {
        name: "Unnecessary Open Ports", mitre: "T1046", risk_reduction: 0.70,
        steps: [
            { action: "enable_firewall", command: "sudo ufw --force enable", risk: "medium", auto_approve: false },
            { action: "default_deny", command: "sudo ufw default deny incoming", risk: "medium", auto_approve: false },
            { action: "allow_ssh", command: "sudo ufw allow 22/tcp", risk: "low", auto_approve: true },
            { action: "allow_http", command: "sudo ufw allow 80/tcp && sudo ufw allow 443/tcp", risk: "low", auto_approve: true }
        ]
    },
    ssh_hardening: {
        name: "SSH Hardening", mitre: "T1021.004", risk_reduction: 0.75,
        steps: [
            { action: "disable_root_login", command: 'sudo sed -i "s/^PermitRootLogin.*/PermitRootLogin no/" /etc/ssh/sshd_config', risk: "medium", auto_approve: false },
            { action: "disable_password_auth", command: 'sudo sed -i "s/^#PasswordAuthentication.*/PasswordAuthentication no/" /etc/ssh/sshd_config', risk: "high", auto_approve: false },
            { action: "set_max_auth_tries", command: 'echo "MaxAuthTries 3" | sudo tee -a /etc/ssh/sshd_config', risk: "low", auto_approve: true },
            { action: "restart_sshd", command: "sudo systemctl restart sshd", risk: "medium", auto_approve: false }
        ]
    },
    malware_detected: {
        name: "Malware Containment", mitre: "T1204", risk_reduction: 0.90,
        steps: [
            { action: "quarantine_file", command: "sudo mv {file_path} /var/quarantine/ && sudo chmod 000 /var/quarantine/{filename}", risk: "medium", auto_approve: false },
            { action: "kill_process", command: "sudo kill -9 {pid}", risk: "high", auto_approve: false },
            { action: "block_c2", command: "sudo ufw deny out to {c2_ip}", risk: "low", auto_approve: true },
            { action: "scan_system", command: "sudo clamscan -r /home /tmp /var/tmp --infected --remove", risk: "medium", auto_approve: false }
        ]
    },
    credential_exposure: {
        name: "Credential Rotation", mitre: "T1552", risk_reduction: 0.80,
        steps: [
            { action: "force_password_reset", command: "sudo passwd -e {username}", risk: "medium", auto_approve: false },
            { action: "revoke_ssh_keys", command: "sudo rm -f /home/{username}/.ssh/authorized_keys", risk: "high", auto_approve: false },
            { action: "rotate_api_keys", command: "echo 'API keys must be rotated manually in application config'", risk: "info", auto_approve: true }
        ]
    },
    privilege_escalation: {
        name: "Privilege Escalation Mitigation", mitre: "T1548", risk_reduction: 0.85,
        steps: [
            { action: "audit_sudoers", command: "sudo cat /etc/sudoers", risk: "low", auto_approve: true },
            { action: "remove_suid", command: "sudo find / -perm -4000 -type f 2>/dev/null", risk: "low", auto_approve: true },
            { action: "restrict_cron", command: "sudo chmod 600 /etc/crontab", risk: "low", auto_approve: true }
        ]
    }
};

const CVE_PATCHES = {
    "CVE-2021-44228": {
        name: "Log4Shell", severity: "critical", affected: "Apache Log4j 2.x", fix: "Upgrade to Log4j 2.17.1+",
        commands: [
            "# Check if Log4j is present",
            "find / -name 'log4j-core-*.jar' 2>/dev/null",
            "# Update if using Maven",
            "mvn versions:use-dep-version -Dincludes=org.apache.logging.log4j:log4j-core -DdepVersion=2.17.1",
        ],
        downtime: "5-10 minutes (application restart)",
    },
    "CVE-2023-44487": {
        name: "HTTP/2 Rapid Reset", severity: "high", affected: "HTTP/2 implementations", fix: "Update web server (Nginx 1.25.3+, Apache 2.4.58+)",
        commands: [
            "sudo apt-get update && sudo apt-get upgrade nginx",
            "sudo systemctl restart nginx",
        ],
        downtime: "2-3 minutes",
    },
    "CVE-2024-3094": {
        name: "XZ Utils Backdoor", severity: "critical", affected: "xz-utils 5.6.0-5.6.1", fix: "Downgrade to xz-utils 5.4.x",
        commands: [
            "xz --version",
            "sudo apt-get install xz-utils=5.4.1-0.2",
        ],
        downtime: "None",
    },
};

/**
 * Generate Actionable Mitigation Plan
 */
function analyzeThreat(threat) {
    const severityScore = SEVERITY_WEIGHTS[threat.severity] || 4;
    const assetScore = ASSET_CRITICALITY[threat.asset_type] || 5;
    const riskScore = Number(((severityScore * assetScore) / 10).toFixed(1));

    const template = REMEDIATION_TEMPLATES[threat.threat_type];
    if (!template) {
        return {
            risk_score: riskScore,
            threat_type: threat.threat_type,
            remediation: null,
            message: `No automated remediation template for '${threat.threat_type}'. Manual intervention required.`
        };
    }

    const context = {
        source_ip: threat.source_ip || "UNKNOWN",
        file_path: threat.file_path || "UNKNOWN",
        filename: threat.filename || "UNKNOWN",
        pid: String(threat.pid || "UNKNOWN"),
        c2_ip: threat.c2_ip || "UNKNOWN",
        username: threat.username || "UNKNOWN"
    };

    const steps = template.steps.map(step => {
        let cmd = step.command;
        for (const [key, val] of Object.entries(context)) {
            cmd = cmd.split(`{${key}}`).join(val); // equivalent to Python string `.replace('{key}', val)`
        }
        return { ...step, command: cmd, status: "pending" };
    });

    const autoSteps = steps.filter(s => s.auto_approve).length;
    const manualSteps = steps.filter(s => !s.auto_approve).length;

    return {
        risk_score: riskScore,
        risk_level: riskScore >= 8 ? "critical" : riskScore >= 5 ? "high" : riskScore >= 3 ? "medium" : "low",
        threat_type: threat.threat_type,
        mitre_technique: template.mitre,
        remediation_name: template.name,
        risk_reduction: `${(template.risk_reduction * 100).toFixed(0)}%`,
        total_steps: steps.length,
        auto_approve_steps: autoSteps,
        manual_approve_steps: manualSteps,
        steps: steps,
        estimated_risk_after: Number((riskScore * (1 - template.risk_reduction)).toFixed(1))
    };
}

module.exports = {
    analyzeThreat,
    REMEDIATION_TEMPLATES,
    CVE_PATCHES
};
