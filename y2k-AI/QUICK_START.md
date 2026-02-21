# Dynamic Malware Analysis — Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Verify Server is Running
```bash
# Terminal/PowerShell on your machine
curl http://localhost:5000/api/status
# Expected: {"timestamp":"...", "services":{"node_server":"operational", ...}}
```

✅ **Server Status:** Backend is running on `localhost:5000`

---

### Step 2: Open Sandbox Page in UI

1. Open browser → `http://localhost:5173`
2. Navigate to **Sandbox** (left sidebar)
3. You should see:
   - SSH Connection Panel (left)
   - How It Works Guide (right)

---

### Step 3: Connect Your VM via SSH

In the **Connect to Sandbox VM** panel, enter:
- **VM Host/IP:** `192.168.x.x` (your VM's IP address)
- **Port:** `22` (default SSH)
- **Username:** `root` or your SSH user
- **Auth Method:** Select `Password` or `Key`
- **Password/Key:** Enter your credentials

Click **"🔐 Connect"** button

✅ **Expected:** Green status bar appears: "● CONNECTED — Session: xyz... — Sandbox: /tmp/sandbox_..."

---

### Step 4: Upload Malware Sample

1. Click **"Upload Sample"** card
2. Select malware binary from your computer
3. Watch hashes compute (MD5/SHA256)

✅ **Expected:** Status updates: "📄 malware.bin (45 KB)"

---

### Step 5: Execute Malware

1. Select **Timeout** (30s recommended for first run)
2. Click **"▶ Execute"** button
3. **Watch real-time console output** stream in terminal
4. Malware runs for configured duration
5. Artifacts auto-collect (processes, network, files)

✅ **Expected:** Execution complete message appears

---

### Step 6: Analyze with AI Agent

1. Scroll down to **"AI Analysis Report"** section
2. Click **"🧠 Analyze"** button
3. Wait 30-45 seconds for AI agent to run 6-step analysis:
   - Behavior Classification
   - IOC Extraction
   - MITRE ATT&CK Mapping
   - Technology Identification
   - Root Cause Analysis
   - Mitigation Recommendations

✅ **Expected:** Full report appears with verdict, IOCs, techniques, and recommended actions

---

### Step 7: Review Report

The comprehensive report includes:

#### Consolidated Verdict
```
🚨 MALICIOUS (HIGH confidence)
ACTION: QUARANTINE_IMMEDIATELY
```

#### Observed Behaviors
- Shell command execution detected
- Network connection attempt to C2 server
- Process injection detected

#### IOCs (Indicators of Compromise)
- **IPs:** 192.168.1.50 (C2 server)
- **Domains:** c2.malicious.com
- **Files:** /tmp/.hidden_process (dropper location)

#### MITRE ATT&CK Techniques
- **T1059** — Command and Scripting Interpreter
- **T1071** — Application Layer Protocol
- **T1053** — Scheduled Task/Job

#### Technologies
- **Implants:** Metasploit reverse shell
- **Frameworks:** Metasploit Framework
- **Encodings:** Base64 obfuscation

#### Recommended Actions
1. Isolate affected system from network
2. Block detected IPs/domains at firewall
3. Remove persistence mechanisms
4. Scan all systems for similar indicators
5. Update detection rules

---

### Step 8: (Optional) Cleanup

Click **"🗑 Cleanup"** button to delete temporary files from VM
- Removes `/tmp/sandbox_[UUID]/` directory
- Clears all execution artifacts from VM

---

## 📊 What Each Button Does

| Button | What It Does | When to Click |
|--------|-------------|--------------|
| **🔐 Connect** | Connects to your VM via SSH | Before uploading |
| **📤 Upload Sample** | Uploads malware to isolated sandbox | After connecting |
| **▶ Execute** | Runs malware with artifact collection | After uploading |
| **🧠 Analyze** | Runs full AI analysis on artifacts | After execution completes |
| **↻ Refresh** | Reloads artifacts from latest execution | Any time |
| **🗑 Cleanup** | Deletes temp files from VM | When done analyzing |
| **Disconnect** | Closes SSH session | To switch VMs |

---

## 🎯 Understanding the Report

### Consolidated Verdict

| Verdict | Meaning | Action |
|---------|---------|--------|
| **MALICIOUS** | High confidence threat detected | Quarantine immediately |
| **SUSPICIOUS** | Suspicious behavior but unclear | Isolate and investigate |
| **CLEAN** | No threats detected | Allow execution |
| **UNKNOWN** | Insufficient data | Manual review required |

Verdict combines:
- **Static Analysis:** VirusTotal scan (0-60 antivirus engines)
- **Dynamic Analysis:** Behavioral analysis from sandbox execution
- **Confidence Score:** HIGH/MEDIUM/LOW based on agreement

---

### Behaviors Section

Lists specific malicious activities detected:
- **"Shell command execution detected"** → Used T1059 technique
- **"Network connection attempt"** → Used T1071 technique
- **"Process injection detected"** → Used T1055 technique
- **"Registry key modification"** → Used T1112 technique

Each behavior maps to MITRE ATT&CK frameworks.

---

### IOCs (Indicators of Compromise)

These are the "fingerprints" of the malware:

```
IPs:
  192.168.1.50 — C2 server communication
  10.0.0.5 — Data exfiltration destination

Domains:
  c2.malicious.com — Command & Control domain

Files:
  /tmp/.hidden_process — Dropper temporary location
  /etc/cron.d/sysupdate — Persistence mechanism

Registry (Windows only):
  HKLM\Software\Run\sysupdate → Startup persistence
```

**Use these to:**
- Block at firewall (IPs/domains)
- Hunt in your network (files, registry)
- Create detection rules (IOC patterns)
- Feed threat intelligence (share with team)

---

### MITRE ATT&CK Techniques

These classify WHAT the malware does, according to industry standard:

```
T1059 — Command and Scripting Interpreter
  Tactic: Execution
  Evidence: Malware spawned bash shell with elevated privileges

T1071 — Application Layer Protocol  
  Tactic: Command and Control
  Evidence: HTTP POST to 192.168.1.50:4444 with beacon data
```

**Use these to:**
- Understand attack tactics
- Map to defensive controls
- Create detection rules (process execution, network rules)
- Benchmark against industry frameworks

---

### Recommended Actions

**Immediate (0-24 hours):**
1. Isolate affected system from network
2. Stop malware processes
3. Preserve evidence (memory dump, logs)

**Short-term (1-7 days):**
1. Remove malware and clean system
2. Scan all connected machines
3. Monitor for re-infection

**Long-term (ongoing):**
1. Update OS and software
2. Deploy endpoint detection/response
3. Implement network segmentation
4. Security awareness training

---

## 🔧 Common Scenarios

### Scenario 1: Testing Benign Application
**Expected Result:** CLEAN verdict with low severity

```
✅ CLEAN (HIGH confidence)
ACTION: ALLOW
Behaviors: Normal application execution, no suspicious indicators
```

### Scenario 2: Ransomware
**Expected Result:** MALICIOUS verdict with critical severity

```
🚨 MALICIOUS (HIGH confidence)
ACTION: QUARANTINE_IMMEDIATELY
Behaviors:
  - File encryption detected
  - Registry modification for persistence
  - Network communication to payment server
```

### Scenario 3: Advanced Malware / Obfuscated
**Expected Result:** SUSPICIOUS verdict with medium severity

```
⚠️ SUSPICIOUS (MEDIUM confidence)
ACTION: ISOLATE_AND_INVESTIGATE

Note: Malware may be:
  - Heavily obfuscated (hard to analyze)
  - Time-delayed (doesn't activate in sandbox)
  - Environment-aware (detects sandbox)
  
Recommendation: Manual analysis by expert analyst
```

---

## ⚠️ Safety Tips

### Before Testing Malware:
- ✅ Use **dedicated sandbox VM** (not your main computer)
- ✅ **Disconnect from production network** (or very strict firewall rules)
- ✅ **Stop all services** except SSH (close browsers, email, chat, etc.)
- ✅ **Enable full logging** (capture everything for forensics)
- ✅ **Take VM snapshot** before testing (easy rollback)

### During Testing:
- ✅ **Monitor network activity** if possible
- ✅ **Watch system resource usage** (memory, CPU, disk)
- ✅ **Leave sandbox running** for full artifact collection
- ✅ **Don't interact** with any suspicious processes

### After Testing:
- ✅ **Preserve artifacts** before cleanup (if needed for investigation)
- ✅ **Clean up properly** — delete all temp files
- ✅ **Revert VM snapshot** if confident enough
- ✅ **Document findings** in incident report

---

## 🐛 Troubleshooting

### Problem: "SSL: CERTIFICATE_VERIFY_FAILED"
**Cause:** SSL certificate issue on VirusTotal or Gemini API  
**Fix:** Check internet connection, try again in 30 seconds

### Problem: "Session not found" when clicking Analyze
**Cause:** Session expired (>10 minutes idle) or wrong session ID  
**Fix:** Create new SSH connection and execute again

### Problem: "SSH connection refused"
**Cause:** VM not running or SSH disabled  
**Fix:**
```bash
# On VM, check SSH:
sudo systemctl status ssh
sudo systemctl start ssh

# Check if port is listening:
ssh -v root@<VM_IP>
```

### Problem: "File upload failed"
**Cause:** Insufficient permissions or disk space  
**Fix:**
```bash
# On VM, check permissions:
ls -la /tmp/
# Should show 'drwxrwxrwt'

# Check disk space:
df -h /tmp
# Should have >100MB free
```

### Problem: "Analysis takes too long" (>2 minutes)
**Cause:** Gemini API rate limiting or network latency  
**Fix:**
- Wait for retry (agent auto-retries with backoff)
- Check internet speed
- If consistently slow, verify Gemini API key is valid

### Problem: "Timeout during execution"
**Cause:** Malware takes longer than timeout  
**Fix:**
- Increase timeout when executing (use 120s for first run)
- Some malware has delay mechanisms to evade sandbox analysis

---

## 📈 Interpreting the IOC Count

The report shows: `Total IOCs: 42`

This includes:
- 5 unique IPs
- 8 unique domains
- 12 unique file paths
- 7 registry keys
- 10 URLs with parameters

**Higher IOC count typically = more suspicious**
- Clean apps: 0-5 IOCs
- Suspicious: 5-20 IOCs
- Malicious: 20+ IOCs

---

## 🔄 Typical Workflow

```
1. Connect VM (1 minute)
   ↓
2. Upload malware (1 minute)
   ↓
3. Execute (30 seconds + malware runtime)
   ↓
4. Wait for artifact collection (automatically after execution)
   ↓
5. Click Analyze (40 seconds)
   ↓
6. Review full report (5-10 minutes)
   ↓
7. Share findings / Take action / Cleanup (5 minutes)
   
TOTAL TIME: 60-120 minutes (depending on malware behavior)
```

---

## 📞 Support

- **Report Issues:** Check error messages in browser console (`F12` → Console tab)
- **Enable Debug Mode:** Set `DEBUG=y2k:*` environment variable on server
- **Check Logs:** 
  - Frontend console: Press `F12` → Console tab
  - Backend console: Check terminal where server is running
- **Contact:** [Your support info]

---

## 🎓 Learn More

- [Full Documentation](./DYNAMIC_ANALYSIS_GUIDE.md)
- [API Reference](./API_REFERENCE.md)
- [MITRE ATT&CK Framework](https://attack.mitre.org/)
- [Malware Analysis Best Practices](https://www.malware-traffic-analysis.net/)

---

## ✨ What Makes This Different

✅ **Agentic AI Analysis** — Not just pattern matching, but intelligent multi-step reasoning  
✅ **Real-World Malware** — Analyze on YOUR VM, not shared cloud sandbox  
✅ **Full Context** — See process execution, network connections, file changes  
✅ **Actionable Results** — Get specific IOCs, techniques, and response playbook  
✅ **Enterprise Ready** — Combines static (VirusTotal) + dynamic (sandbox) + AI analysis  

---

## Next Steps

1. ✅ Verify server is running: `curl http://localhost:5000/api/status`
2. ✅ Open UI: `http://localhost:5173`
3. ✅ Go to Sandbox page
4. ✅ Connect your test VM
5. ✅ Upload a sample (start with known-safe or VirusTotal sample)
6. ✅ Execute and analyze
7. ✅ Review comprehensive report

**Happy malware hunting!** 🔍
