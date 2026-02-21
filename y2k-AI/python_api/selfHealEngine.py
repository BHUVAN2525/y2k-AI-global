"""
Self-Healing Security Engine — Python AI Backend
Risk scoring, remediation script generation, and validation pipeline.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict
import json

router = APIRouter(prefix="/selfheal", tags=["Self-Healing"])

# ── Risk Scoring Matrix ──────────────────────────────────────────────────────

SEVERITY_WEIGHTS = {
    "critical": 10,
    "high": 7,
    "medium": 4,
    "low": 2,
    "info": 1
}

ASSET_CRITICALITY = {
    "database": 10,
    "auth_server": 9,
    "web_server": 8,
    "api_gateway": 8,
    "file_server": 6,
    "workstation": 4,
    "dev_server": 3,
    "sandbox": 1
}

# ── Remediation Templates ────────────────────────────────────────────────────

REMEDIATION_TEMPLATES = {
    "brute_force": {
        "name": "Brute Force Mitigation",
        "mitre": "T1110",
        "risk_reduction": 0.85,
        "steps": [
            {"action": "block_ip", "command": "sudo ufw deny from {source_ip}", "risk": "low", "auto_approve": True},
            {"action": "install_fail2ban", "command": "sudo apt-get install -y fail2ban && sudo systemctl enable fail2ban", "risk": "low", "auto_approve": True},
            {"action": "configure_fail2ban", "command": 'echo "[sshd]\nenabled = true\nmaxretry = 3\nbantime = 3600" | sudo tee /etc/fail2ban/jail.local', "risk": "medium", "auto_approve": False},
            {"action": "enforce_strong_passwords", "command": "sudo apt-get install -y libpam-pwquality", "risk": "low", "auto_approve": True},
        ]
    },
    "open_ports": {
        "name": "Unnecessary Open Ports",
        "mitre": "T1046",
        "risk_reduction": 0.70,
        "steps": [
            {"action": "enable_firewall", "command": "sudo ufw --force enable", "risk": "medium", "auto_approve": False},
            {"action": "default_deny", "command": "sudo ufw default deny incoming", "risk": "medium", "auto_approve": False},
            {"action": "allow_ssh", "command": "sudo ufw allow 22/tcp", "risk": "low", "auto_approve": True},
            {"action": "allow_http", "command": "sudo ufw allow 80/tcp && sudo ufw allow 443/tcp", "risk": "low", "auto_approve": True},
        ]
    },
    "ssh_hardening": {
        "name": "SSH Hardening",
        "mitre": "T1021.004",
        "risk_reduction": 0.75,
        "steps": [
            {"action": "disable_root_login", "command": 'sudo sed -i "s/^PermitRootLogin.*/PermitRootLogin no/" /etc/ssh/sshd_config', "risk": "medium", "auto_approve": False},
            {"action": "disable_password_auth", "command": 'sudo sed -i "s/^#PasswordAuthentication.*/PasswordAuthentication no/" /etc/ssh/sshd_config', "risk": "high", "auto_approve": False},
            {"action": "set_max_auth_tries", "command": 'echo "MaxAuthTries 3" | sudo tee -a /etc/ssh/sshd_config', "risk": "low", "auto_approve": True},
            {"action": "restart_sshd", "command": "sudo systemctl restart sshd", "risk": "medium", "auto_approve": False},
        ]
    },
    "malware_detected": {
        "name": "Malware Containment",
        "mitre": "T1204",
        "risk_reduction": 0.90,
        "steps": [
            {"action": "quarantine_file", "command": "sudo mv {file_path} /var/quarantine/ && sudo chmod 000 /var/quarantine/{filename}", "risk": "medium", "auto_approve": False},
            {"action": "kill_process", "command": "sudo kill -9 {pid}", "risk": "high", "auto_approve": False},
            {"action": "block_c2", "command": "sudo ufw deny out to {c2_ip}", "risk": "low", "auto_approve": True},
            {"action": "scan_system", "command": "sudo clamscan -r /home /tmp /var/tmp --infected --remove", "risk": "medium", "auto_approve": False},
        ]
    },
    "credential_exposure": {
        "name": "Credential Rotation",
        "mitre": "T1552",
        "risk_reduction": 0.80,
        "steps": [
            {"action": "force_password_reset", "command": "sudo passwd -e {username}", "risk": "medium", "auto_approve": False},
            {"action": "revoke_ssh_keys", "command": "sudo rm -f /home/{username}/.ssh/authorized_keys", "risk": "high", "auto_approve": False},
            {"action": "rotate_api_keys", "command": "echo 'API keys must be rotated manually in application config'", "risk": "info", "auto_approve": True},
        ]
    },
    "privilege_escalation": {
        "name": "Privilege Escalation Mitigation",
        "mitre": "T1548",
        "risk_reduction": 0.85,
        "steps": [
            {"action": "audit_sudoers", "command": "sudo cat /etc/sudoers", "risk": "low", "auto_approve": True},
            {"action": "remove_suid", "command": "sudo find / -perm -4000 -type f 2>/dev/null", "risk": "low", "auto_approve": True},
            {"action": "restrict_cron", "command": "sudo chmod 600 /etc/crontab", "risk": "low", "auto_approve": True},
        ]
    }
}

# ── Patch Database ───────────────────────────────────────────────────────────

CVE_PATCHES = {
    "CVE-2021-44228": {
        "name": "Log4Shell",
        "severity": "critical",
        "affected": "Apache Log4j 2.x",
        "fix": "Upgrade to Log4j 2.17.1+",
        "commands": [
            "# Check if Log4j is present",
            "find / -name 'log4j-core-*.jar' 2>/dev/null",
            "# Update if using Maven",
            "mvn versions:use-dep-version -Dincludes=org.apache.logging.log4j:log4j-core -DdepVersion=2.17.1",
        ],
        "downtime": "5-10 minutes (application restart)",
    },
    "CVE-2023-44487": {
        "name": "HTTP/2 Rapid Reset",
        "severity": "high",
        "affected": "HTTP/2 implementations",
        "fix": "Update web server (Nginx 1.25.3+, Apache 2.4.58+)",
        "commands": [
            "sudo apt-get update && sudo apt-get upgrade nginx",
            "sudo systemctl restart nginx",
        ],
        "downtime": "2-3 minutes",
    },
    "CVE-2024-3094": {
        "name": "XZ Utils Backdoor",
        "severity": "critical",
        "affected": "xz-utils 5.6.0-5.6.1",
        "fix": "Downgrade to xz-utils 5.4.x",
        "commands": [
            "xz --version",
            "sudo apt-get install xz-utils=5.4.1-0.2",
        ],
        "downtime": "None",
    },
}


# ── Data Models ──────────────────────────────────────────────────────────────

class ThreatInput(BaseModel):
    threat_type: str  # e.g., "brute_force", "malware_detected"
    severity: str = "medium"
    asset_type: str = "web_server"
    source_ip: Optional[str] = None
    file_path: Optional[str] = None
    filename: Optional[str] = None
    pid: Optional[int] = None
    c2_ip: Optional[str] = None
    username: Optional[str] = None
    additional_context: Optional[Dict] = None

class PatchRequest(BaseModel):
    cve_id: Optional[str] = None
    service: Optional[str] = None
    os_type: str = "ubuntu"


# ── API Endpoints ────────────────────────────────────────────────────────────

@router.post("/analyze")
async def analyze_threat(threat: ThreatInput):
    """Analyze a threat and generate a remediation plan with risk scoring."""
    
    # Risk Score = Severity × Asset Criticality
    severity_score = SEVERITY_WEIGHTS.get(threat.severity, 4)
    asset_score = ASSET_CRITICALITY.get(threat.asset_type, 5)
    risk_score = round((severity_score * asset_score) / 10, 1)  # 0-10 scale
    
    # Get remediation template
    template = REMEDIATION_TEMPLATES.get(threat.threat_type)
    if not template:
        return {
            "risk_score": risk_score,
            "threat_type": threat.threat_type,
            "remediation": None,
            "message": f"No automated remediation template for '{threat.threat_type}'. Manual intervention required."
        }
    
    # Substitute variables in commands
    context = {
        "source_ip": threat.source_ip or "UNKNOWN",
        "file_path": threat.file_path or "UNKNOWN",
        "filename": threat.filename or "UNKNOWN",
        "pid": str(threat.pid or "UNKNOWN"),
        "c2_ip": threat.c2_ip or "UNKNOWN",
        "username": threat.username or "UNKNOWN",
    }
    
    steps = []
    for step in template["steps"]:
        cmd = step["command"]
        for key, val in context.items():
            cmd = cmd.replace(f"{{{key}}}", val)
        steps.append({
            **step,
            "command": cmd,
            "status": "pending",
        })
    
    # Determine approval mode
    auto_steps = [s for s in steps if s.get("auto_approve")]
    manual_steps = [s for s in steps if not s.get("auto_approve")]
    
    return {
        "risk_score": risk_score,
        "risk_level": "critical" if risk_score >= 8 else "high" if risk_score >= 5 else "medium" if risk_score >= 3 else "low",
        "threat_type": threat.threat_type,
        "mitre_technique": template["mitre"],
        "remediation_name": template["name"],
        "risk_reduction": f"{template['risk_reduction'] * 100}%",
        "total_steps": len(steps),
        "auto_approve_steps": len(auto_steps),
        "manual_approve_steps": len(manual_steps),
        "steps": steps,
        "estimated_risk_after": round(risk_score * (1 - template["risk_reduction"]), 1),
    }


@router.get("/templates")
async def get_templates():
    """Get all available remediation templates."""
    return {
        "templates": {
            k: {
                "name": v["name"],
                "mitre": v["mitre"],
                "risk_reduction": f"{v['risk_reduction'] * 100}%",
                "step_count": len(v["steps"])
            }
            for k, v in REMEDIATION_TEMPLATES.items()
        }
    }


@router.post("/patch/recommend")
async def recommend_patch(req: PatchRequest):
    """Recommend patches for known CVEs."""
    if req.cve_id:
        patch = CVE_PATCHES.get(req.cve_id.upper())
        if patch:
            return {"found": True, "cve": req.cve_id.upper(), **patch}
        return {"found": False, "message": f"No patch data for {req.cve_id}"}
    
    # Return all known patches
    return {
        "patches": [
            {"cve": cve, **data}
            for cve, data in CVE_PATCHES.items()
        ]
    }


@router.get("/patch/database")
async def get_patch_database():
    """Get the full patch recommendation database."""
    return {
        "total_cves": len(CVE_PATCHES),
        "patches": CVE_PATCHES
    }
