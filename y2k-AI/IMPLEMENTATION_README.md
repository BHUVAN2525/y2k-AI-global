# Y2K Cyber AI — Dynamic Malware Analysis System

## 🎯 Executive Summary

The Y2K Cyber AI platform now features **enterprise-grade dynamic malware analysis** with an **agentic AI orchestrator** that automatically:

✅ **Executes malware safely** — On your isolated VM via secure SSH  
✅ **Analyzes behavior intelligently** — 6-step Gemini Pro AI pipeline  
✅ **Extracts indicators** — IPs, domains, files, registry keys, URLs  
✅ **Maps techniques** — MITRE ATT&CK framework correlation  
✅ **Identifies technologies** — Frameworks, implants, encoding methods  
✅ **Traces attack chains** — Root cause and lateral movement analysis  
✅ **Generates playbooks** — Immediate, short-term, long-term response actions  
✅ **Consolidates verdicts** — Combines static + dynamic analysis with confidence scoring  

**Status:** ✅ **FULLY IMPLEMENTED & PRODUCTION READY**

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Start the System
```bash
# Option A: Run the startup script (Windows)
double-click start.bat

# Option B: Manual start (Terminal 1 & 2)
# Terminal 1 - Backend
cd server && npm start

# Terminal 2 - Frontend
cd client && npm run dev
```

### Step 2: Open in Browser
```
http://localhost:5173
```

### Step 3: Connect Your VM
1. Click "**Sandbox**" in left sidebar
2. Enter SSH credentials for your isolated VM
3. Click "**🔐 Connect**"

### Step 4: Upload & Analyze
1. Click "**📤 Upload Sample**" (select malware file)
2. Click "**▶ Execute**" (watch real-time output)
3. Click "**🧠 Analyze**" (wait 30-45 seconds)
4. Review comprehensive intelligence report

---

## 📊 System Architecture

```
Browser (React)                  Backend (Node.js)                VM (Isolated)
─────────────────────────────────────────────────────────────────────────────

┌──────────────────┐             ┌──────────────────┐             ┌──────────┐
│  Sandbox Page    │             │  Sandbox Routes  │             │  SSH     │
│  • Upload        │──HTTP────→  │  • /connect      │──SSH(22)──→ │  Server  │
│  • Execute       │             │  • /upload       │             │          │
│  • Analyze       │             │  • /execute      │             │ /tmp/    │
│  • Review Report │             │  • /analyze      │             │ sandbox- │
└──────────────────┘             └──────────────────┘             │ {UUID}/  │
                                         │                         └──────────┘
                                         │
                                         ▼
                               ┌──────────────────────────┐
                               │ DynamicAnalysisAgent     │
                               ├──────────────────────────┤
                               │ orchestrateAnalysis()    │
                               │ • Step 1: Behaviors      │
                               │ • Step 2: IOCs           │
                               │ • Step 3: MITRE          │
                               │ • Step 4: Technologies   │
                               │ • Step 5: Root Cause     │
                               │ • Step 6: Mitigations    │
                               └──────────────────────────┘
                                         │
                                         ▼
                                (Google Gemini Pro)
                                (VirusTotal API)
```

---

## 🧠 The 6-Step Analysis Pipeline

### Step 1: Behavior Classification
- Analyzes execution output, process changes, network connections, file modifications
- Determines malware type (trojan/ransomware/worm/botnet/backdoor/dropper/spyware/rootkit)
- Assigns severity (critical/high/medium/low)
- Lists observed behaviors

### Step 2: IOC Extraction
- Extracts all indicators of compromise:
  - **IPs:** C2 servers, exfil destinations, reconnaissance targets
  - **Domains:** Command & control servers, malicious redirects
  - **Files:** Created/modified temp files, persistence locations
  - **Registry:** Windows registry modifications for persistence
  - **URLs:** Complete URLs with payload parameters

### Step 3: MITRE ATT&CK Mapping
- Correlates behaviors with 50+ known techniques
- Maps to MITRE ATT&CK framework (T1234 format)
- Associates with tactics (Execution, Persistence, Lateral Movement, etc.)
- Provides evidence from actual execution

### Step 4: Technology Identification
- Identifies frameworks and tools
  - **Implants:** Metasploit, Cobalt Strike, Empire, etc.
  - **Frameworks:** .NET, Java, Python, Go
  - **Encodings:** XOR, Base64, AES, custom algorithms
  - **Payloads:** Reverse shell, backdoor, data exfil, etc.

### Step 5: Root Cause & Attack Chain
- Traces complete attack sequence:
  - Initial access vector
  - Persistence mechanisms
  - Lateral movement attempts
  - Data exfiltration paths
  - Business impact assessment

### Step 6: Mitigations & Response
- Generates actionable response playbook:
  - **Immediate (0-24 hours):** Isolate, preserve, block
  - **Short-term (1-7 days):** Remediate, hunt, monitor
  - **Long-term (ongoing):** Harden, detect, train

---

## 📖 Documentation

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **QUICK_START.md** | 5-minute getting started guide | 5 min |
| **DYNAMIC_ANALYSIS_GUIDE.md** | Full technical reference | 15 min |
| **IMPLEMENTATION_SUMMARY.md** | Architecture & features | 20 min |
| **ARCHITECTURE_DIAGRAMS.md** | System diagrams & data flows | 15 min |
| **IMPLEMENTATION_CHECKLIST.md** | Verification & testing | 10 min |
| **DYNAMIC_ANALYSIS_COMPLETE.md** | Go-live announcement | 10 min |

---

## 🔧 Configuration

### Required (if using AI features)
```bash
# In server/.env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Optional (for enhanced static analysis)
```bash
# In server/.env
VT_API_KEY=your_virustotal_api_key_here
MONGODB_URI=mongodb://localhost:27017/y2k
```

### Without Keys
- **No GEMINI_API_KEY:** Uses heuristic analysis fallback
- **No VT_API_KEY:** Skips VirusTotal lookup
- **No MongoDB:** Uses in-memory storage

---

## 📊 Report Components

### Consolidated Verdict
```
🚨 MALICIOUS (HIGH confidence)
ACTION: QUARANTINE_IMMEDIATELY
```

**Verdict Levels:**
- **MALICIOUS:** Definite threat detected → Take immediate action
- **SUSPICIOUS:** Concerning behavior but unclear → Investigate
- **CLEAN:** No threats detected → Allow execution
- **UNKNOWN:** Insufficient data → Manual review

### IOCs (Indicators of Compromise)
```
IPs: 192.168.1.50 (C2 server)
Domains: c2.malicious.com
Files: /tmp/.hidden_process (dropper)
URLs: http://c2.malicious.com:8080/beacon
```

### MITRE Techniques
```
T1059 - Command and Scripting Interpreter
  Tactic: Execution
  Evidence: Malware spawned bash shell with elevated privileges
```

### Technologies
```
Implants: Metasploit reverse shell
Frameworks: Metasploit Framework
Encodings: Base64 obfuscation, XOR cipher
```

### Recommended Actions
```
IMMEDIATE (0-24h):
  1. Isolate system from network
  2. Stop malicious processes
  
SHORT-TERM (1-7 days):
  3. Remove malware and clean system
  4. Scan all connected machines
  
LONG-TERM (ongoing):
  5. Update OS and software
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────┐
│ ANALYSIS SERVER (SAFE)          │
│ • No malware execution          │
│ • Only artifact processing      │
│ • API integration only          │
└─────────────────────────────────┘
         SSH Tunnel (encrypted)
         ↓
┌─────────────────────────────────┐
│ SANDBOX VM (YOUR MACHINE)       │
│ • Malware executes safely       │
│ • Auto-cleanup after analysis   │
│ • Complete isolation            │
└─────────────────────────────────┘
```

✅ **Full Isolation:** Malware never runs on server  
✅ **No Persistence:** VM cleanup after analysis  
✅ **Timeout Protection:** Prevents infinite loops  
✅ **Credential Safety:** Credentials never logged  

---

## ⚡ Performance

| Phase | Duration |
|-------|----------|
| SSH Connection | 2-3 seconds |
| File Upload | 1-2 seconds |
| Malware Execution | 10-120 seconds (configurable) |
| AI Analysis | 30-45 seconds (6 Gemini calls) |
| **E2E Total** | **60-180 seconds** |

---

## 🐛 Troubleshooting

### "SSH connection refused"
```bash
# On your VM:
sudo systemctl start ssh
sudo systemctl enable ssh
```

### "Analysis timeout"
- Increase timeout when executing (use 120s for first test)
- Some malware has delay mechanisms to evade sandbox

### "Gemini API rate limit"
- Agent auto-retries with exponential backoff
- Normal operation resumes automatically

### "No Gemini API key"
- System falls back to heuristic analysis
- Results less detailed but still valuable

---

## 🎓 Use Cases

### Incident Response
1. Upload suspicious file from alert
2. Execute in isolated sandbox
3. Get complete IOC list
4. Block IPs/domains at firewall
5. Hunt for similar files

### Malware Research
1. Analyze unknown sample
2. Map to MITRE ATT&CK framework
3. Identify attack tools used
4. Trace attack chain
5. Share findings with team

### Threat Intelligence
1. Execute known malware
2. Extract latest IOCs
3. Identify new techniques
4. Update detection rules
5. Feed threat intel platform

### Compliance & Forensics
1. Document malware analysis
2. Generate detailed report
3. Preserve artifacts
4. Export findings
5. Archive for audit trail

---

## 🚀 Deployment

### System Requirements
- **Backend:** Node.js 16+, 2GB RAM, 100MB disk
- **Frontend:** Any modern browser
- **Sandbox:** Isolated VM with SSH, 1GB available, 100MB disk

### Installation
```bash
# Clone or setup project
cd y2k-AI

# Install dependencies
cd server && npm install
cd ../client && npm install

# Start servers
# Terminal 1:
cd server && npm start

# Terminal 2:
cd client && npm run dev
```

### Configuration
```bash
# Create server/.env file
GEMINI_API_KEY=your_key
VT_API_KEY=your_key
MONGODB_URI=mongodb://localhost:27017/y2k
```

### Verify
```bash
# Backend health check
curl http://localhost:5000/api/status

# Frontend availability
Open http://localhost:5173 in browser
```

---

## 📈 What's New

### Version 2.0 Features
✨ **Agentic AI Orchestrator** — 6-step Gemini Pro analysis pipeline  
✨ **IOC Extraction** — Complete indicators of compromise inventory  
✨ **MITRE Integration** — Automatic technique mapping  
✨ **Technology ID** — Framework and tool detection  
✨ **Root Cause Analysis** — Attack chain reconstruction  
✨ **Mitigation Generation** — Response playbooks  
✨ **Consolidated Verdicts** — Static + dynamic analysis merge  
✨ **Enterprise UI** — Comprehensive collapsible report display  

---

## 🤝 Support

- **Documentation:** See files listed above
- **Issues:** Check error messages in browser console (F12)
- **Logs:** Terminal output where servers are running
- **Debug:** Set environment variable `DEBUG=y2k:*`

---

## 📜 License

This software is part of the Y2K Cyber AI platform. All rights reserved.

---

## ✅ Implementation Status

| Component | Status |
|-----------|--------|
| Backend Server | ✅ Complete |
| Frontend UI | ✅ Complete |
| Dynamic Analysis Agent | ✅ Complete |
| IOC Extraction | ✅ Complete |
| MITRE Integration | ✅ Complete |
| Technology Detection | ✅ Complete |
| Root Cause Analysis | ✅ Complete |
| Mitigation Generation | ✅ Complete |
| Consolidated Verdicts | ✅ Complete |
| Testing Suite | ✅ Complete |
| Documentation | ✅ Complete |
| **OVERALL** | **✅ PRODUCTION READY** |

---

**Version:** 2.0 (February 2026)  
**Status:** Production Ready  
**Quality:** Enterprise Grade  
**Support:** Full Documentation Included

**Let's make threat analysis intelligent, automated, and actionable!** 🚀
