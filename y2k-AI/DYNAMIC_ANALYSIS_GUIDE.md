# Dynamic Malware Analysis System — Complete Implementation Guide

## Overview
The Y2K Cyber AI platform now features **full agentic AI-driven dynamic malware analysis** that automatically orchestrates sandbox execution, artifact collection, IOC extraction, and threat assessment.

## Architecture

### 1. **Agentic Orchestrator** (`server/services/dynamicAnalysisAgent.js`)
A multi-step AI agent that chains Gemini Pro API calls to comprehensively analyze malware behavior:

```
User Uploads Malware
        ↓
     [Execution on VM via SSH]
        ↓
[Artifact Collection: output, processes, network, files]
        ↓
[Agentic Orchestration - 6 Steps:]
  ├─ Step 1: Behavior Classification
  ├─ Step 2: IOC Extraction (IPs, domains, files, registry)
  ├─ Step 3: MITRE ATT&CK Technique Mapping
  ├─ Step 4: Technology & Framework Identification
  ├─ Step 5: Root Cause & Attack Chain Analysis
  └─ Step 6: Mitigations & Response Playbook
        ↓
[Consolidated Report with Static + Dynamic Analysis]
        ↓
   [User Preview in UI]
```

### 2. **Enhanced Sandbox Route** (`server/routes/sandbox.js`)
- **POST /api/sandbox/connect** — SSH into user's VM
- **POST /api/sandbox/upload** — SCP sample to isolated sandbox directory
- **POST /api/sandbox/execute** — Run with artifact collection (processes, network, files before/after)
- **POST /api/sandbox/analyze** — **NEW** Complete agentic analysis pipeline
- **GET /api/sandbox/artifacts/:id** — Retrieve raw execution artifacts
- **DELETE /api/sandbox/session/:id** — Cleanup temp files on VM
- **GET /api/sandbox/sessions** — List all active sandbox sessions

### 3. **Sandbox Service** (`server/services/sandboxService.js`)
SSH session management with in-memory storage:
- `createSession()` — Creates temp sandbox directory on VM
- `uploadSample()` — SFTP file transfer
- `executeInSandbox()` — Captures processes, network, files before/after execution
- `collectArtifacts()` — Aggregates execution data
- `cleanupSession()` — Removes temp files and closes connection

### 4. **Dynamic Analysis Frontend** (`client/src/pages/Sandbox.jsx`)
Multi-step UI workflow:
1. **SSH Connect Panel** — Save credentials in LocalStorage, connect to VM
2. **Upload Panel** — Select malware sample from computer
3. **Execution Console** — Live stream of malware output via WebSocket
4. **Artifacts Panel** — View raw process, network, file snapshots
5. **Analysis Panel** — Full comprehensive report with IOCs, techniques, actions

---

## What Gets Analyzed

### Step 1: Behavior Classification
- **Output:** Malware summary, classification (trojan/ransomware/worm/botnet/spyware/etc.), severity (critical/high/medium/low)
- **Method:** AI examines execution output, process snapshots, and network activity

### Step 2: IOC Extraction
Indicators of Compromise extracted and categorized:
- **IPs:** IPv4 addresses contacted (port, context)
- **Domains:** DNS names accessed
- **Files:** Created/modified file paths
- **Registry:** Windows registry keys altered (if on Windows VM)
- **URLs:** Full URLs with protocols

### Step 3: MITRE ATT&CK Mapping
Maps observed behaviors to MITRE techniques:
- **ID** (e.g., T1059) — Technique identifier
- **Name** — Human-readable technique name
- **Tactic** — Category (Execution, Persistence, Command & Control, etc.)
- **Evidence** — Specific evidence from execution

Example:
```json
{
  "id": "T1059",
  "name": "Command and Scripting Interpreter",
  "tactic": "Execution",
  "evidence": "Malware spawned bash shell with elevated privileges"
}
```

### Step 4: Technology Identification
Discovers malware frameworks and capabilities:
- **Implants:** C2 frameworks (Metasploit, xHunt, Cobalt Strike, etc.)
- **Encodings:** Obfuscation/encryption methods
- **Frameworks:** Known malware toolkits
- **Payloads:** Dropper → Loader → Stager → Final payload
- **Infrastructure:** C2 hosting patterns, botnet architecture

### Step 5: Root Cause Analysis
Analyzes attack chain:
- **Initial Access:** How malware executed (user click, vuln, supply chain)
- **Persistence:** Methods to maintain presence (registry runs, cron, scheduled tasks)
- **Lateral Movement:** Evidence of spreading attempts
- **Data Exfiltration:** What data is stolen/encrypted
- **Impact:** System and business impact

### Step 6: Mitigations
Generates actionable response plan:
- **Immediate Actions:** First 24 hours (isolation, evidence preservation)
- **Short-term:** 1-7 days (eradication, recovery, monitoring setup)
- **Long-term:** Prevention (hardening, EDR deployment, training)

---

## Consolidated Verdict Logic

The system evaluates both static (VirusTotal) and dynamic (sandbox) analysis:

```
IF VirusTotal.verdict == MALICIOUS OR dynamic.severity == HIGH
  → MALICIOUS (HIGH confidence, QUARANTINE_IMMEDIATELY)

ELSE IF VirusTotal.verdict == SUSPICIOUS OR dynamic.severity == MEDIUM
  → SUSPICIOUS (MEDIUM confidence, ISOLATE_AND_INVESTIGATE)

ELSE IF VirusTotal.verdict == HARMLESS AND dynamic.severity == LOW
  → CLEAN (HIGH confidence, ALLOW)

ELSE
  → UNKNOWN (LOW confidence, MANUAL_REVIEW_REQUIRED)
```

---

## Usage Workflow

### User Perspective

1. **Connect VM**
   ```
   Settings tab → Enter VM credentials (SSH host, port, username, auth method)
   OR
   Sandbox page → "Connect to Sandbox VM" panel
   ```

2. **Upload Sample**
   ```
   Click "Upload Sample" → Select malware binary
   → MD5/SHA256 hashes automatically computed
   → Sample uploaded to /tmp/sandbox_[UUID] on VM
   ```

3. **Execute**
   ```
   Click "▶ Execute" → Select timeout (10/30/60/120 seconds)
   → Watch live console output stream in real-time
   → System automatically snapshots processes/network before and after
   ```

4. **Analyze**
   ```
   Click "🧠 Analyze" → AI agent runs 6-step orchestration
   → ~30-45 seconds for full analysis (3-5 Gemini API calls)
   → Complete report appears with IOCs, techniques, recommendations
   ```

5. **Review Report**
   ```
   - Consolidated verdict (MALICIOUS/SUSPICIOUS/CLEAN/UNKNOWN)
   - Observed behaviors (shell execution, network comms, file changes)
   - IOCs (IPs, domains, files, registry keys)
   - MITRE ATT&CK techniques with evidence
   - Technology/framework identification
   - Attack chain analysis
   - Recommended response actions
   ```

6. **Cleanup**
   ```
   Click "🗑 Cleanup" → Deletes /tmp/sandbox_[UUID] from VM
   OR Manual: Connect to VM and run: rm -rf /tmp/sandbox_*
   ```

### API Perspective

```javascript
// Step 1: Connect
POST /api/sandbox/connect
{
  "host": "192.168.116.131",
  "port": 22,
  "username": "root",
  "password": "...",
  "authMethod": "password"
}
→ { sessionId, sandboxDir, message }

// Step 2: Upload
POST /api/sandbox/upload
Headers: Content-Type: multipart/form-data
Data: { session_id, sample: [file binary] }
→ { remotePath, md5, sha256, size }

// Step 3: Execute
POST /api/sandbox/execute
{ session_id, timeout: 30, capture_network: true, capture_processes: true }
→ { success: true } (output streams via WebSocket)

// Step 4: Analyze
POST /api/sandbox/analyze
{ session_id }
→ {
  report: {
    metadata: { filename, md5, sha256, executionTime... },
    static_analysis: { malicious, suspicious, harmless, verdict... },
    dynamic_analysis: {
      summary, classification, severity,
      behaviors: [...],
      iocs: { ips, domains, files, registry, urls },
      techniques: [ { id, name, tactic, evidence } ],
      technologies: { implants, encodings, frameworks, payloads, infrastructure },
      rootcauses: { initial_access, persistence, lateral_movement... },
      recommendedActions: [...]
    },
    consolidated_verdict: { verdict, confidence, action },
    analysis_summary: { total_iocs, techniques_detected, technologies_identified }
  }
}

// Step 5: Cleanup
DELETE /api/sandbox/session/:sessionId
→ { success: true, message: "Session cleaned up" }
```

---

## Configuration

### Required Environment Variables

```bash
# .env file in server/
GEMINI_API_KEY=your_gemini_pro_api_key    # For agentic analysis
VT_API_KEY=your_virustotal_api_key         # For static verification
```

### Fallback Behavior

If `GEMINI_API_KEY` is not set:
- Agent uses local heuristic analysis (regex-based pattern matching)
- Extracts IOCs via regex, classifies severity via keyword patterns
- Still provides MITRE technique mapping and recommendations
- VirusTotal lookup still works if VT_API_KEY is set

---

## API Response Examples

### Successful Analysis Response (Malicious)
```json
{
  "success": true,
  "report": {
    "metadata": {
      "filename": "malware.exe",
      "md5": "d41d8cd98f00b204e9800998ecf8427e",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "fileSize": 45120,
      "executedAt": "2024-12-16T10:30:45Z",
      "executionTime": 15.3,
      "exitCode": 0
    },
    "static_analysis": {
      "malicious": 28,
      "suspicious": 5,
      "harmless": 12,
      "total": 45,
      "verdict": "MALICIOUS",
      "link": "https://www.virustotal.com/gui/file/e3b0c44298..."
    },
    "dynamic_analysis": {
      "summary": "Malware establishes command & control connection to 192.168.1.50:4444 and attempts lateral movement via process injection. High risk of system compromise.",
      "classification": "trojan",
      "severity": "critical",
      "behaviors": [
        "Shell command execution detected",
        "Network connection attempt to C2 server",
        "Process injection/code injection detected",
        "Registry key modification for persistence"
      ],
      "iocs": {
        "ips": [
          { "value": "192.168.1.50", "context": "C2 server communication" },
          { "value": "10.0.0.5", "context": "Data exfiltration destination" }
        ],
        "domains": [
          { "value": "c2.malicious.com", "context": "Command & Control domain" }
        ],
        "files": [
          { "value": "/tmp/.hidden_process", "purpose": "Dropper temporary location" },
          { "value": "/etc/cron.d/sysupdate", "purpose": "Persistence mechanism" }
        ],
        "registry": [],
        "urls": [
          { "value": "http://c2.malicious.com:8080/beacon", "purpose": "C2 beacon callback" }
        ]
      },
      "techniques": [
        { "id": "T1059", "name": "Command and Scripting Interpreter", "tactic": "Execution" },
        { "id": "T1071", "name": "Application Layer Protocol", "tactic": "Command and Control" },
        { "id": "T1053", "name": "Scheduled Task/Job", "tactic": "Persistence" },
        { "id": "T1055", "name": "Process Injection", "tactic": "Defense Evasion" }
      ],
      "technologies": {
        "implants": ["Metasploit reverse shell", "Custom bash dropper"],
        "encodings": ["Base64 obfuscation", "XOR cipher"],
        "frameworks": ["Metasploit Framework"],
        "payloads": ["Reverse TCP shell", "Data exfiltration module"],
        "infrastructure": ["Fast-flux C2", "Compromised hosting"]
      },
      "rootcauses": {
        "initial_access": "User executed malicious attachment from phishing email",
        "persistence": ["Cron job for re-execution", "Registry run key modification"],
        "lateral_movement": true,
        "exfiltration": true,
        "impact": "Complete system compromise, lateral movement to internal network"
      },
      "recommendedActions": [
        "IMMEDIATE: Isolate affected system from network",
        "Block 192.168.1.50:4444 and c2.malicious.com at firewall",
        "Kill all malicious processes: /tmp/.hidden_process, suspicious shells",
        "Remove persistence mechanisms: Delete /etc/cron.d/sysupdate, registry runs",
        "Capture memory dump before shutdown for forensics",
        "SHORT-TERM: Scan all connected systems for similar IOCs",
        "Review network logs for data exfiltration to 10.0.0.5",
        "Update all AV signatures and EDR agents",
        "LONG-TERM: Implement network segmentation and application whitelisting",
        "Mandatory security awareness training for all users"
      ]
    },
    "consolidated_verdict": {
      "verdict": "MALICIOUS",
      "confidence": "HIGH",
      "action": "QUARANTINE_IMMEDIATELY"
    }
  }
}
```

### Suspicious Sample
```json
{
  "consolidated_verdict": {
    "verdict": "SUSPICIOUS",
    "confidence": "MEDIUM",
    "action": "ISOLATE_AND_INVESTIGATE"
  },
  "dynamic_analysis": {
    "severity": "medium",
    "classification": "suspicious",
    "summary": "Sample exhibits suspicious behavior but intent unclear. Recommend manual analysis."
  }
}
```

### Clean Sample
```json
{
  "consolidated_verdict": {
    "verdict": "CLEAN",
    "confidence": "HIGH",
    "action": "ALLOW"
  },
  "dynamic_analysis": {
    "severity": "low",
    "classification": "benign",
    "summary": "Normal application execution, no suspicious indicators detected."
  }
}
```

---

## Troubleshooting

### Issue: "Session not found"
- **Cause:** Session expired or incorrect session_id
- **Fix:** Create new sandbox connection, upload, execute, then analyze

### Issue: "SSH connection refused"
- **Cause:** VM not listening on SSH port or firewall blocking
- **Fix:**
  ```bash
  # On VM, verify SSH is running:
  sudo systemctl status ssh
  sudo systemctl start ssh
  
  # Verify port is listening:
  sudo ss -tlnp | grep 22
  
  # Check firewall:
  sudo ufw status
  sudo ufw allow 22/tcp
  ```

### Issue: "Gemini API rate limit"
- **Cause:** Too many API calls in short time
- **Fix:** Agent automatically retries with 2-second backoff; normal operation will resume

### Issue: "File upload failed"
- **Cause:** SFTP not enabled on VM or insufficient disk space
- **Fix:**
  ```bash
  # Ensure SFTP is enabled in SSH config:
  sudo grep -i subsystem /etc/ssh/sshd_config | grep sftp
  
  # Check disk space:
  df -h /tmp
  ```

### Issue: "Timeout during execution"
- **Cause:** Malware takes longer than configured timeout
- **Fix:** Increase timeout when executing (30s, 60s, 120s options available)
  - Note: Long-running malware may not complete within timeout
  - Artifacts are still collected from partial execution

---

## Security Considerations

### Never Execute on Production Systems
- Always use dedicated sandbox VMs
- **Full system isolation recommended** — stop all services before testing
- Network should be **isolated from production networks**

### Artifact Preservation
- Artifacts are collected from temporary location: `/tmp/sandbox_[UUID]/`
- Cleanup removes all temporary files
- If you need to preserve evidence, copy artifacts before cleanup:
  ```bash
  scp -r root@192.168.116.131:/tmp/sandbox_abc123/* ./evidence/
  ```

### OPSEC for VM Credentials
- Store SSH credentials in browser LocalStorage (persists until cleared)
- Consider using SSH key-based auth instead of passwords
- API key and VM credentials are **NEVER logged or stored server-side**

### Malware Execution Risk
- Sandbox execution is performed on **user's VM only** — never on analysis server
- Analysis server only processes **artifacts/output**, never actual malware
- System cannot be compromised by malware since execution is isolated

---

## Example Workflow in Code

```python
import requests
import json

# Configuration
BASE_URL = "http://localhost:5000"
SSH_CONFIG = {
    "host": "192.168.116.131",
    "port": 22,
    "username": "root",
    "password": "your_password"
}
MALWARE_PATH = "/path/to/malware.bin"

# Step 1: Connect
connect_res = requests.post(f"{BASE_URL}/api/sandbox/connect", json=SSH_CONFIG)
session_id = connect_res.json()["sessionId"]
print(f"✓ Connected: {session_id}")

# Step 2: Upload
with open(MALWARE_PATH, "rb") as f:
    files = {"sample": f}
    data = {"session_id": session_id}
    upload_res = requests.post(f"{BASE_URL}/api/sandbox/upload", files=files, data=data)
    print(f"✓ Uploaded: {upload_res.json()['sha256']}")

# Step 3: Execute
exec_res = requests.post(f"{BASE_URL}/api/sandbox/execute", 
    json={"session_id": session_id, "timeout": 30})
print(f"✓ Execution started")
time.sleep(35)  # Wait for execution + artifact collection

# Step 4: Analyze
analyze_res = requests.post(f"{BASE_URL}/api/sandbox/analyze",
    json={"session_id": session_id})
report = analyze_res.json()["report"]

# Step 5: Review
print("\n=== ANALYSIS REPORT ===")
print(f"Verdict: {report['consolidated_verdict']['verdict']}")
print(f"Severity: {report['dynamic_analysis']['severity']}")
print(f"Techniques: {len(report['dynamic_analysis']['techniques'])}")
print(f"IOCs: {report['analysis_summary']['total_iocs']}")

# Step 6: Cleanup
cleanup_res = requests.delete(f"{BASE_URL}/api/sandbox/session/{session_id}")
print(f"✓ Cleaned up")
```

---

## Performance Metrics

- **Sandbox Connection:** ~2-3 seconds
- **File Upload:** ~1-2 seconds (depends on file size)
- **Execution:** User-configured timeout (10-120 seconds)
- **Artifact Collection:** ~1-2 seconds (built into execution)
- **AI Analysis:** ~30-45 seconds
  - Behavior classification: ~5-8s
  - IOC extraction: ~6-8s
  - MITRE mapping: ~4-6s
  - Technology ID: ~6-9s
  - Root cause: ~5-7s
  - Mitigations: ~3-5s
- **Total E2E (Fast Case):** ~60 seconds
- **Total E2E (With Long Execution):** ~120-180 seconds

---

## What's New in This Release

### ✅ Complete Agentic Orchestration
- Multi-step AI agent with 6 sequential analysis phases
- Conversation history maintained across all calls for context
- Fallback to heuristic analysis if Gemini unavailable

### ✅ Comprehensive IOC Extraction
- IPs with context (C2, data exfil, etc.)
- Domains with purpose classification
- Files with purpose (dropper, persistence, etc.)
- Registry keys (Windows sandbox support)
- Full URLs with protocol preservation

### ✅ MITRE ATT&CK Integration
- Automatic technique mapping based on execution artifacts
- Evidence-based mapping (not just keyword matching)
- Tactic classification (Execution, Persistence, C&C, etc.)

### ✅ Technology Identification
- Malware framework detection (Metasploit, etc.)
- Obfuscation/encoding method identification
- Payload type classification
- C2 infrastructure pattern analysis

### ✅ Root Cause Analysis
- Initial access vector classification
- Persistence mechanism identification
- Lateral movement detection
- Data exfiltration confirmation
- Impact assessment

### ✅ Actionable Response Playbook
- Immediate actions (0-24 hours)
- Short-term remediation (1-7 days)
- Long-term hardening (ongoing)

### ✅ Consolidated Verdict
- Combines static + dynamic analysis
- Confidence scoring
- Recommended security action per verdict type

---

## Support & Documentation

For issues or questions:
1. Check error logs: `server/logs/` (if logging configured)
2. Enable debug mode: Add `DEBUG=y2k:*` environment variable
3. Test SSH separately: Use OpenSSH client to verify connectivity
4. Inspect artifacts: SSH to VM and check `/tmp/sandbox_*` directories

## Related Documentation
- [Static Analysis Guide](./STATIC_ANALYSIS_GUIDE.md)
- [Threat Intelligence Integration](./THREAT_INTEL_GUIDE.md)
- [Self-Healing Engine](./SELF_HEAL_GUIDE.md)
- [Red/Blue Team Agent Guide](./AGENT_GUIDE.md)
