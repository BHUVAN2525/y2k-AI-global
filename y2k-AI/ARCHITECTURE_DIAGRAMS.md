# System Architecture & Data Flow Diagrams

## 1. High-Level Component Architecture

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                         Y2K Cyber AI Platform                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌─────────────────────────┐         ┌──────────────────────────────┐   ║
║  │   Web UI (React)        │         │  Backend (Node.js/Express)   │   ║
║  │                         │         │                              │   ║
║  │ • Sandbox page          │◄────────┤ • Sandbox routes             │   ║
║  │ • Connect form          │ HTTP    │ • SSH service pool           │   ║
║  │ • Upload panel          │ WebSock │ • SFTP/SCP handler           │   ║
║  │ • Console output        │  et     │ • Artifact collector         │   ║
║  │ • Full report display   │         │ • ✨ DynamicAnalysisAgent    │   ║
║  │                         │         │                              │   ║
║  └─────────────────────────┘         └──────────────────────────────┘   ║
║  Port: 5173                           Port: 5000                        ║
║                                                                           ║
║  External Services                                                        ║
║  ┌─────────────────────────┐  ┌──────────────────┐  ┌──────────────┐   ║
║  │ Google Gemini API       │  │ VirusTotal API   │  │ MongoDB      │   ║
║  │ (Agentic analysis)      │  │ (Static baseline)│  │ (Optional)   │   ║
║  │ gemini-pro model        │  │ File reputation  │  └──────────────┘   ║
║  └─────────────────────────┘  └──────────────────┘                      ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
                                       │
                    SSH Connection (port 22)
                                       ▼
╔═══════════════════════════════════════════════════════════════════════════╗
║              User-Provided Sandbox VM (Isolated Network)                  ║
║                   192.168.x.x or user-configured IP                      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌─────────────────────────────────────────────────────────────────┐    ║
║  │ /tmp/sandbox_[SessionUUID]/                                     │    ║
║  │                                                                 │    ║
║  │  before_procs.txt     ◄────┐  Snapshot 1 (Before Execution)   │    ║
║  │  before_net.txt       ◄────┤                                   │    ║
║  │  before_files.txt     ◄────┘                                   │    ║
║  │                                                                 │    ║
║  │  [malware.bin execution happens here]  ───┐                    │    ║
║  │  (stdout captured, timeout: 10-120s)      │  Live output       │    ║
║  │                                           │  streamed to UI    │    ║
║  │  after_procs.txt      ◄────┐  Snapshot 2 (After Execution) │    │    ║
║  │  after_net.txt        ◄────┤                                   │    ║
║  │  after_files.txt      ◄────┘                                   │    ║
║  │                                                                 │    ║
║  └─────────────────────────────────────────────────────────────────┘    ║
║                                                                           ║
║  Commands executed on VM:                                                ║
║  • ps aux                    (process listing)                           ║
║  • ss -tunap or netstat      (network connections)                       ║
║  • ls -la                    (file state)                                ║
║  • timeout [N] ./malware.bin (controlled execution)                      ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 2. Dynamic Analysis Workflow

```
User Action                    Backend Processing                  AI Agent Steps
─────────────────────────────────────────────────────────────────────────────────

1. Upload Sample
   [File Selection]
        │
        ▼
   [SFTP Upload]                Compute MD5/SHA256
        │                       Store in session
        ▼
   [Upload Complete] ────────────────────┐
                                         │
2. Execute                              │
   [Click Execute]                      │
        │                              │
        ▼                              │
   [SSH Command Execution]           │
   • Snapshot processes before      │
   • Snapshot network before        │
   • Snapshot files before          │
   • Run: timeout 30 ./malware.bin ◄┘
   • Stream output via WebSocket
   • Snapshot processes after
   • Snapshot network after
   • Snapshot files after
        │
        ▼
   [Artifacts Collected] ─────────┬────────────────────────────────────┐
                                  │                                    │
3. Analyze                       │                                    │
   [Click Analyze]               │                                    │
        │                        │                                    │
        ▼                        ▼                                    ▼
   DynamicAnalysisAgent      Artifacts:                         AgenticPipeline:
   .orchestrateAnalysis()    • output                           (6 sequential steps)
                             • processes (before/after)
                             • network (before/after)
                             • files (before/after)
                                  │
                                  │ Input #1
                                  ▼
                            ┌─────────────────────────────┐
                            │ Step 1: analyzeBehaviors()  │
                            │ "Classify malware type"     │
                            │ Gemini API Call #1          │
                            ├─────────────────────────────┤
                            │ Output:                     │
                            │ • summary                   │
                            │ • classification            │
                            │ • severity                  │
                            │ • behaviors[]               │
                            └──────────┬──────────────────┘
                                      │ Input #2
                                      ▼
                            ┌─────────────────────────────┐
                            │ Step 2: extractIOCs()       │
                            │ "Find IPs, domains, files"  │
                            │ Gemini API Call #2          │
                            ├─────────────────────────────┤
                            │ Output:                     │
                            │ • iocs.ips[]                │
                            │ • iocs.domains[]            │
                            │ • iocs.files[]              │
                            │ • iocs.registry[]           │
                            │ • iocs.urls[]               │
                            └──────────┬──────────────────┘
                                      │ Input #3
                                      ▼
                            ┌─────────────────────────────┐
                            │ Step 3: mapMITRETechniques()│
                            │ "Map to MITRE framework"    │
                            │ Gemini API Call #3          │
                            ├─────────────────────────────┤
                            │ Output:                     │
                            │ • techniques[].id (T1059)   │
                            │ • techniques[].name         │
                            │ • techniques[].tactic       │
                            │ • techniques[].evidence     │
                            └──────────┬──────────────────┘
                                      │ Input #4
                                      ▼
                            ┌─────────────────────────────┐
                            │Step 4: identifyTechnologies()
                            │ "Find frameworks/implants"  │
                            │ Gemini API Call #4          │
                            ├─────────────────────────────┤
                            │ Output:                     │
                            │ • technologies.implants[]   │
                            │ • technologies.encodings[]  │
                            │ • technologies.frameworks[] │
                            │ • technologies.payloads[]   │
                            │ • technologies.infrastructure
                            └──────────┬──────────────────┘
                                      │ Input #5
                                      ▼
                            ┌─────────────────────────────┐
                            │ Step 5: analyzeRootCauses() │
                            │ "Trace attack chain"        │
                            │ Gemini API Call #5          │
                            ├─────────────────────────────┤
                            │ Output:                     │
                            │ • initial_access           │
                            │ • persistence[]            │
                            │ • lateral_movement         │
                            │ • exfiltration             │
                            │ • impact                   │
                            └──────────┬──────────────────┘
                                      │ Input #6
                                      ▼
                            ┌─────────────────────────────┐
                            │ Step 6: generateMitigations
                            │ "Create response playbook"  │
                            │ Gemini API Call #6          │
                            ├─────────────────────────────┤
                            │ Output:                     │
                            │ • mitigations.immediate[]   │
                            │ • mitigations.shortterm[]   │
                            │ • mitigations.longterm[]    │
                            └─────────────────────────────┘
                                      │
        Parallel: VirusTotal Lookup   │
        • GET /api/v3/files/{sha256}  │
        • Extract: malicious, total   │
        • Result: verdict             │
                                      │
                   Consolidate Results:
                                      ▼
                            ┌─────────────────────────────┐
                            │ Merged Report:              │
                            ├─────────────────────────────┤
                            │ • metadata                  │
                            │ • static_analysis (VT)      │
                            │ • dynamic_analysis (Agent)  │
                            │ • consolidated_verdict      │
                            │ • analysis_summary          │
                            └──────────┬──────────────────┘
                                      │
4. Display Report                     │
   [UI Renders]                       │
        ▼                             │
   ┌────────────────────────────────┐ │
   │ Verdict Section (Color-coded)  │ │
   │ • Icon + verdict text          │ │
   │ • Confidence + action          │◄┘
   │ • Summary paragraph            │
   ├────────────────────────────────┤
   │ Behaviors List (Collapsible)   │
   │ • Shell execution              │
   │ • Network connection           │
   │ • Process injection            │
   ├────────────────────────────────┤
   │ IOCs Section (Collapsible)     │
   │ • IPs table                    │
   │ • Domains table                │
   │ • Files table                  │
   ├────────────────────────────────┤
   │ MITRE Techniques (Expandable)  │
   │ • T1059 + tactic + evidence    │
   │ • T1071 + tactic + evidence    │
   ├────────────────────────────────┤
   │ Technologies (Expandable)      │
   │ • Implants: Metasploit         │
   │ • Frameworks: Metasploit FW    │
   ├────────────────────────────────┤
   │ Recommended Actions (List)     │
   │ • 1. Isolate system            │
   │ • 2. Block IPs at firewall     │
   │ • 3. Remove persistence        │
   │ • ... (5-15 total actions)     │
   └────────────────────────────────┘
        │
5. User Actions
   • Download report
   • Share with team
   • Block IOCs
   • Cleanup VM
   • Continue analysis
```

---

## 3. Report Structure (JSON Hierarchy)

```
{
  "success": true,
  
  "report": {
    
    "metadata": {
      "filename": "malware.exe",
      "md5": "...",
      "sha256": "...",
      "fileSize": 45120,
      "executedAt": "2024-12-16T10:30:45Z",
      "executionTime": 15.3,
      "exitCode": 0
    },
    
    "static_analysis": {
      "verdict": "MALICIOUS",
      "malicious": 28,
      "suspicious": 5,
      "harmless": 12,
      "total": 45,
      "link": "https://virustotal.com/..."
    },
    
    "dynamic_analysis": {
      
      "summary": "Malware establishes C2 connection...",
      "classification": "trojan",
      "severity": "critical",
      
      "behaviors": [
        "Shell command execution detected",
        "Network connection to C2 server",
        "Process injection detected",
        "Registry modification for persistence",
        "File encryption detected"
      ],
      
      "iocs": {
        
        "ips": [
          {
            "value": "192.168.1.50",
            "context": "C2 server communication"
          },
          {
            "value": "10.0.0.5",
            "context": "Data exfiltration destination"
          }
        ],
        
        "domains": [
          {
            "value": "c2.malicious.com",
            "context": "Command & Control domain"
          }
        ],
        
        "files": [
          {
            "value": "/tmp/.hidden_process",
            "purpose": "Dropper temporary location"
          },
          {
            "value": "/etc/cron.d/sysupdate",
            "purpose": "Persistence mechanism"
          }
        ],
        
        "registry": [
          {
            "value": "HKLM\\Software\\Run\\sysupdate",
            "purpose": "Startup persistence"
          }
        ],
        
        "urls": [
          {
            "value": "http://c2.malicious.com:8080/beacon",
            "purpose": "C2 beacon callback"
          }
        ]
      },
      
      "techniques": [
        {
          "id": "T1059",
          "name": "Command and Scripting Interpreter",
          "tactic": "Execution",
          "evidence": "Malware spawned bash shell with elevated privileges"
        },
        {
          "id": "T1071",
          "name": "Application Layer Protocol",
          "tactic": "Command and Control",
          "evidence": "HTTP POST to 192.168.1.50:4444 with beacon data"
        }
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
        "persistence": ["Cron job for re-execution", "Registry run key"],
        "lateral_movement": true,
        "exfiltration": true,
        "impact": "Complete system compromise, lateral movement enabled"
      },
      
      "recommendedActions": [
        "IMMEDIATE: Isolate affected system from network",
        "Block 192.168.1.50:4444 and c2.malicious.com at firewall",
        "Kill all malicious processes",
        "Remove persistence mechanisms",
        "Capture memory dump before shutdown",
        "SHORT-TERM: Scan all connected systems",
        "Review network logs for exfiltration",
        "Update AV signatures",
        "LONG-TERM: Implement network segmentation",
        "Mandatory security awareness training"
      ]
    },
    
    "consolidated_verdict": {
      "verdict": "MALICIOUS",
      "confidence": "HIGH",
      "action": "QUARANTINE_IMMEDIATELY"
    },
    
    "analysis_summary": {
      "total_iocs": 42,
      "techniques_detected": 8,
      "technologies_identified": {
        "implants": 2,
        "frameworks": 1,
        "encodings": 2
      }
    },
    
    "timestamp": "2024-12-16T10:46:12.345Z"
  }
}
```

---

## 4. Session Lifecycle

```
Timeline (User Perspective)
─────────────────────────────────────────────────────────────────────────

T+0:00
  User opens Sandbox page
  └─ SSHPanel rendered with input fields

T+0:30
  User enters credentials and clicks "Connect"
  └─ POST /api/sandbox/connect
     ├─ SSH2 client establishes connection
     ├─ Creates /tmp/sandbox_[UUID] on VM
     ├─ Session stored in memory (sandboxService)
     └─ UUID returned to frontend
  └─ UI shows "✓ Sandbox Connected"

T+1:00
  User uploads malware file
  └─ POST /api/sandbox/upload
     ├─ SFTP write to /tmp/sandbox_[UUID]/malware.bin
     ├─ Compute MD5 & SHA256
     ├─ Store in session.artifacts
     └─ UI shows "📄 malware.bin (45 KB)"

T+1:30
  User clicks "Execute"
  └─ POST /api/sandbox/execute
     ├─ Response sent immediately (async)
     ├─ SSH command built:
     │  ├─ chmod +x malware.bin
     │  ├─ ps aux > before_procs.txt
     │  ├─ ss -tunap > before_net.txt
     │  ├─ ls -la > before_files.txt
     │  ├─ timeout 30 ./malware.bin  ◄─ EXECUTION HAPPENS
     │  ├─ ps aux > after_procs.txt
     │  ├─ ss -tunap > after_net.txt
     │  └─ ls -la > after_files.txt
     │
     ├─ stdout/stderr streamed to WebSocket
     │  └─ UI console gets live output
     │
     └─ On completion:
        ├─ Auto-collect artifacts
        ├─ Broadcast 'sandbox_exec_done' event
        ├─ UI shows "✓ Execution complete"
        └─ Store artifacts in session

T+2:30
  User clicks "Analyze"
  └─ POST /api/sandbox/analyze
     ├─ Retrieve artifacts from session
     ├─ Create DynamicAnalysisAgent instance
     ├─ Call agent.orchestrateAnalysis(artifacts)
     │
     ├─ Agent Steps (with Gemini API calls):
     │  ├─ Step 1: analyzeBehaviors()
     │  │  └─ Gemini API call #1 (~8s)
     │  ├─ Step 2: extractIOCs()
     │  │  └─ Gemini API call #2 (~8s)
     │  ├─ Step 3: mapMITRETechniques()
     │  │  └─ Gemini API call #3 (~6s)
     │  ├─ Step 4: identifyTechnologies()
     │  │  └─ Gemini API call #4 (~8s)
     │  ├─ Step 5: analyzeRootCauses()
     │  │  └─ Gemini API call #5 (~7s)
     │  └─ Step 6: generateMitigations()
     │     └─ Gemini API call #6 (~5s)
     │
     ├─ Parallel: VirusTotal lookup
     │  └─ GET /api/v3/files/{sha256}
     │
     ├─ Consolidate results
     └─ Return complete report (40-45s total)
  └─ UI renders full report with all sections

T+3:30
  User reviews report (5-10 minutes)
  └─ Collapsible sections show:
     ├─ Verdict & confidence
     ├─ Behaviors
     ├─ IOCs (IPs, domains, files, registry)
     ├─ MITRE techniques
     ├─ Technologies
     └─ Recommended actions

T+13:30
  User clicks "Cleanup"
  └─ DELETE /api/sandbox/session/{sessionId}
     ├─ SSH: rm -rf /tmp/sandbox_[UUID]/
     ├─ Close SSH connection
     ├─ Remove from session store
     └─ UI shows "Cleaned up"

T+14:00
  User can:
  ├─ Disconnect and reconnect to different VM
  ├─ Upload new sample
  ├─ Download/export report (future feature)
  └─ Share findings with team
```

---

## 5. Agentic Analysis Decision Tree

```
                    Artifacts Input
                         ▼
                 orchestrateAnalysis()
                         │
                ┌────────┼────────┐
                │        │        │
        Behavior    IOC     MITRE
        Analysis  Extraction Mapping
             │        │        │
             ▼        ▼        ▼
        
        Classification  IPs, Domains  T1059, T1071,
        + Severity      Files, Regs   T1053, T1055
             │              │             │
             └──────────┬───┴─────────┬──┘
                        │             │
                   ┌────┴────┐  ┌─────┴───┐
                   │          │  │         │
                Tech ID    Root    Mitigations
                Implants  Cause    • Immediate
                Encodings Analysis • Short-term
                Payloads  • Initial • Long-term
                          • Persist │
                          • Lateral │
                          • Exfil   │
                          • Impact  │
                               │
                               ▼
                        Consolidated Report
                               │
                    ┌──────────┬──────────┐
                    │          │          │
               Static    Dynamic    Integrated
               (VT)    (Sandbox)    Verdict
```

---

## 6. Security Boundaries

```
┌──────────────────────────────────┐
│  ANALYSIS SERVER                 │  ✅ SAFE
│  (localhost:5000)                │  • Never executes malware
│  • HTTP/Express API              │  • Only processes artifacts
│  • Gemini API calls              │  • SSH client only, not sshd
│  • VirusTotal lookups            │  • Artifacts in memory only
│  • Report generation             │
└──────────────────────────────────┘
           SSH Tunnel (port 22)
           (Encrypted)
                 │
                 │ Input: Report data
                 │ Output: Command output
                 │
                 ▼
┌──────────────────────────────────┐
│  SANDBOX VM                      │  ⚠️  DANGEROUS
│  (User-provided, isolated)       │  • Executes malware
│  • SSH sshd listening            │  • Artifacts on disk
│  • Isolated /tmp dir             │  • Monitored execution
│  • No network (if segmented)     │  • Auto-cleanup
│  • Deduplicated execution        │
└──────────────────────────────────┘

Security Properties:
✅ Code execution isolation        (malware runs on VM, not server)
✅ Data isolation                  (artifacts never written to server disk)
✅ Network isolation               (VM should be segmented)
✅ Credential isolation            (passwords not logged/stored)
✅ Session isolation               (each execution in separate /tmp dir)
✅ Automatic cleanup               (delete /tmp/sandbox_* after analysis)
✅ Timeout protection              (prevent infinite loops)
✅ Artifact preservation option    (user can copy before cleanup)
```

---

## 7. Integration Points

```
Y2K Cyber AI Platform
├─ Static Analysis Module
│  ├─ VirusTotal API
│  ├─ CVE Correlation
│  └─ MITRE ATT&CK Database
│
├─ ✨ Dynamic Analysis Module (NEW)
│  ├─ Sandbox Service (SSH/SFTP)
│  ├─ DynamicAnalysisAgent (Agentic)
│  └─ Artifact Collection
│
├─ Blue Team Agent
│  ├─ Threat Analysis
│  ├─ IR Playbooks
│  └─ Detection Rules
│
├─ Red Team Agent
│  ├─ Attack Simulation
│  ├─ Recon Scanning
│  └─ Exploitation Planning
│
├─ Self-Healing Engine
│  ├─ Automated Response
│  ├─ System Remediation
│  └─ Policy Enforcement
│
└─ Reporting Module
   ├─ PDF/HTML export
   ├─ Email delivery
   └─ API exports
```

---

## Usage Diagram

```
User Workflow Diagram
────────────────────────────────────────────────────────────────

                    ┌─────────────────┐
                    │  USER BROWSER   │
                    │ localhost:5173  │
                    └────────┬────────┘
                             │
                    Click "Sandbox"
                             │
                             ▼
                    ┌─────────────────────┐
                    │ SSH Connection Form │
                    │ └─ Enter VM details │
                    └────────┬────────────┘
                             │ Click "Connect"
                             ▼
                    ┌─────────────────────┐
                    │  Connected ✓        │
                    │  Sandbox ready      │
                    └────────┬────────────┘
                             │
                    File Selection Dialog
                             │
                             ▼
                    ┌─────────────────────┐
                    │  Upload Sample      │
                    │  MD5/SHA256 display │
                    └────────┬────────────┘
                             │ Click "Execute"
                             ▼
                    ┌─────────────────────┐
                    │  Console Output     │
                    │  (Live streaming)   │
                    └────────┬────────────┘
                             │ Execution Complete
                             ▼
                    ┌─────────────────────┐
                    │  Click "Analyze"    │
                    │  [⏳ 40-45 seconds]  │
                    └────────┬────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │ COMPREHENSIVE REPORT DISPLAYS│
              ├──────────────────────────────┤
              │                              │
              │ 🚨 MALICIOUS (HIGH conf)     │
              │ ACTION: QUARANTINE NOW       │
              │                              │
              ├──────────────────────────────┤
              │ OBSERVED BEHAVIORS           │
              │ • Shell execution            │
              │ • Network connection         │
              │ • Process injection          │
              ├──────────────────────────────┤
              │ IOCs (42 total)              │
              │ IPs: 192.168.1.50, ...       │
              │ Domains: c2.bad.com, ...     │
              │ Files: /tmp/.hidden, ...     │
              ├──────────────────────────────┤
              │ MITRE TECHNIQUES             │
              │ • T1059 (Command Interpreter)│
              │ • T1071 (Application Layer)  │
              ├──────────────────────────────┤
              │ RECOMMENDED ACTIONS          │
              │ 1. Isolate system            │
              │ 2. Block IPs at firewall     │
              │ 3. Remove persistence        │
              │ ... (5-15 actions total)     │
              └──────────────────────────────┘
                             │
                    ┌────────┼─────────┐
                    │        │         │
               Download  Share    Take
               Report   Findings  Action
```

---

## Summary

The dynamic malware analysis system provides:
- **Isolated Execution:** Malware runs only on user's VM
- **Comprehensive Artifacts:** Process, network, file snapshots
- **Agentic Intelligence:** 6-step AI reasoning via Gemini
- **Structured Intelligence:** IOCs, MITRE techniques, technologies
- **Actionable Output:** Response playbooks and recommendations
- **Enterprise Integration:** Combined static + dynamic verdicts
- **Safety:** Automatic cleanup, timeout protection, full isolation

All components work together to provide **enterprise-grade malware analysis** with minimal infrastructure requirements. 🔍
