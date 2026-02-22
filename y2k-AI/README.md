# CCB Karnataka Core Engine — Public Security Platform (GUI Edition)

> **Official Cyber Crime Branch (Karnataka) Core Engine • Fully Automated Defense • AI GRC Policy Orchestrator • Cyber Security Command Center**

---

## 🚀 What Is It?

The **CCB Karnataka Core Engine** is a state-of-the-art, GUI-based cybersecurity platform designed for the public security infrastructure of the Karnataka Cyber Crime Branch. It serves as the automated heart of defensive operations, unifying forensic analysis, threat intelligence, and legal-compliant policy enforcement.

Built as a **fully automated system**, it delivers **15+ features** spanning a React-powered command interface, a robust Node.js core, and multi-agent AI orchestration powered by Google Gemini to ensure public safety in the digital realm.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│              React Frontend (Vite)              │
│       Dashboard • 11 Feature Pages • XAI        │
├─────────────────────────────────────────────────┤
│            Node.js API Gateway                  │
│   Express • WebSocket • Agent Router • SOAR     │
├───────────────┬─────────────┬───────────────────┤
│  AI Agents    │  Services   │  Core Engines     │
│  Supervisor   │  Threat     │  Self-Heal (JS)   │
│  ThreatIntel  │  Intel      │  Forensics (JS)   │
│  Malware      │  Self-Heal  │  ML Classifier    │
│  Compliance   │  Policy Gen │  (via Gemini/JS)  │
├───────────────┴─────────────┴───────────────────┤
│  External APIs: Gemini • VirusTotal • AbuseIPDB │
└─────────────────────────────────────────────────┘
```

---

## 🔥 Features by Phase

### Phase 1–2: Core Platform
### Automated Defense & Policy
| Feature | Description |
|---------|-------------|
| **🧠 Multi-Agent Swarm** | Supervisor-orchestrated swarm of specialized AI agents monitoring Karnataka's public digital assets |
| **📡 Threat Intelligence** | Live IOC enrichment and correlation to detect patterns targeting regional infrastructure |
| **🩹 Self-Healing Engine** | Automated threat remediation with AI-generated action plans and immutable policy generation |
| **⚖️ AI GRC Orchestrator** | **Fully automated** Governance, Risk, and Compliance engine that updates local security policies in real-time based on public laws and regulations |
| **🧪 Malware Analysis** | Automated static + dynamic analysis with ML classification within secure CCB-authorized sandboxes |
| **🤖 Autonomous Blue Agent** | Self-directing 7-phase SOC defense workflow requiring zero manual intervention |
| **⚡ CCB Command Service** | Orchestrates defensive operations, correlates results, and ensures legal-compliant reporting |

### Phase 3: Visualization & Simulation
| Feature | Description |
|---------|-------------|
| **🏗️ Digital Twin** | Live infrastructure visualization with node status, risk scoring, and attack path prediction |
| **🔮 Attack Prediction** | AI-driven threat forecasting with timeline visualization and confidence scoring |
| **⚔️ Cyber Battlefield** | Real-time attack/defense visualization with animated threat mapping |
| **🔍 XAI Panel** | Explainable AI overlay that provides reasoning transparency for all AI decisions |

### Phase 4: Intelligence & Compliance
| Feature | Description |
|---------|-------------|
| **🤖 Threat Intel Agent** | Autonomous agent with VirusTotal/AbuseIPDB tool integration and Gemini-powered analysis |
| **🦠 Malware Analysis Agent** | Deep analysis agent with static, dynamic, ML classification, and memory forensics |
| **📋 Compliance Agent** | Automated compliance checking against NIST, ISO 27001, PCI-DSS, and HIPAA frameworks |
| **🛡️ Zero Trust** | Zero-trust architecture monitoring and policy enforcement |

### Phase 5: Training & Advanced
| Feature | Description |
|---------|-------------|
| **🎮 Cyber Range** | Interactive training with terminal simulation, CTF challenges, scoring, and leaderboard |
| **🏛️ Architecture Designer** | AI-powered secure architecture design with pattern selection and compliance mapping |
| **⛓️ Blockchain Logs** | Immutable log     integrity verification with chain visualization and tamper detection |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite + Framer Motion + Recharts |
| **Backend** | Node.js + Express + WebSocket |
| **AI Engine** | Google Gemini 2.0 Flash + Heuristic Fallback |
| **Database** | MongoDB (Primary) / Local JSON Fallback |
| **Sandbox** | SSH2 (Secure Shell) with Dynamic Port Forwarding |
| **External APIs** | VirusTotal, AbuseIPDB |

---

## 📁 Project Structure

```
y2k-the-ai-agent/
├── client/                    # React Frontend
│   └── src/
│       ├── components/        # Sidebar, Navbar, XAIPanel
│       └── pages/             # 11 feature pages
│           ├── SwarmStatus.jsx
│           ├── ThreatIntel.jsx
│           ├── SelfHeal.jsx
│           ├── MemoryForensics.jsx
│           ├── DigitalTwin.jsx
│           ├── AttackPrediction.jsx
│           ├── CyberBattlefield.jsx
│           ├── CyberRange.jsx
│           ├── ArchitectureDesigner.jsx
│           ├── BlockchainLogs.jsx
│           └── blue/ZeroTrust.jsx
├── server/                    # Node.js API Gateway (Unified MERN)
│   ├── agents/                # AI Agents
│   │   ├── supervisorAgent.js
│   │   ├── threatIntelAgent.js
│   │   ├── malwareAnalysisAgent.js
│   │   └── complianceAgent.js
│   ├── services/              # Business Logic & Forensics
│   │   ├── threatIntelService.js
│   │   ├── selfHealService.js
│   │   ├── policyGenerator.js
│   │   └── sandboxService.js (Robust SSH Integration)
│   └── routes/                # API Routes
│       ├── agent.js
│       ├── threatintel.js
│       ├── selfheal.js
│       ├── blue/logs.js, soar.js
│       └── red/recon.js, cve.js
├── start.bat                  # One-click launcher (Windows)
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** v16+
- **Python** 3.9+
- **MongoDB** (optional — server runs without it)

### Installation

```bash
# Clone the repository
git clone https://github.com/BHUVAN2525/y2k-AI-global.git
cd y2k-AI-global

# Install frontend dependencies
cd client && npm install

# Install backend dependencies
cd ../server && npm install
```

### Launch

**Option 1: One-Click (Windows)**
```
Double-click start.bat
```

**Option 2: Manual (2 terminals)**
```bash
# Terminal 1: Node.js Server (port 5000)
cd server
npm run dev

# Terminal 2: React Frontend (port 5173)
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

> **Troubleshooting:** if any page shows a 500 error (Settings, Sandbox, Dashboard, etc.), check the terminal where the Node server is running. Look for lines prefixed with `[SETTINGS]`, `[SSH TEST]`, `[AGENT CHAT]`, or similar; they will describe the underlying problem (invalid SSH credentials, file write permission, missing Gemini key, etc.).

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API Gateway | http://localhost:5000 |
| Python Engine | http://localhost:8001/docs |

---

## ⚙️ Configuration

### API Keys

Configure API keys via the **/settings** page in the app, or create a `.env` file in the `server/` directory:

```env
GEMINI_API_KEY=your_gemini_key       # AI-powered analysis
VT_API_KEY=your_virustotal_key       # Hash lookups & file scanning
ABUSEIPDB_KEY=your_abuseipdb_key     # IP reputation checks
MONGO_URI=mongodb://localhost:27017/cerebus  # Optional
```

Keys are stored in `server/config/settings.json`.

### SSH Sandbox (VM)

The dynamic analysis sandbox runs commands over SSH on a VM you provide. To configure it:

1. **Set SSH fields** on the `/settings` page:
   - Host/IP, port (usually 22), username and either password or private key.
   - Click **Test Connection** to validate reachability.
2. **Common connection issues:**
   - Ensure the VM is running an SSH server and the network is reachable from the host where the Node server runs.
   - Use bridged or host‑only networking in VirtualBox/VMware so the host can see the guest.
   - Disable firewalls or open port 22 on the guest OS.
   - From the host machine run `ssh user@host` to verify credentials and network.
   - If you see `ECONNREFUSED` or `Timeout`, check the port and that the SSH service is listening.
   - Authentication errors (`All configured authentication methods failed`, `Permission denied`) mean the username/password/key are incorrect.
3. **Debugging:**
   - The server logs `[SSH TEST] connection error:` with the full error object when the test fails.
   - The client shows error details (code/level) in the notification.

> ⚠️ The SSH settings are only stored locally in your browser (passwords/keys are not sent to disk), so if you clear storage you'll need to re-enter them.

### Environment Variables & Restart

Some configuration (e.g. `PYTHON_API_URL`) is read once at server startup. After changing environment variables or editing `server/config/settings.json`, restart the Node process to apply the changes.

---

## 🧪 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/status` | Service status |
| POST | `/api/analyze` | File analysis |
| POST | `/api/agent` | AI agent query |
| GET | `/api/blue/logs` | Blue team logs |
| POST | `/api/blue/soar` | SOAR automation |
| GET | `/api/red/recon` | Recon tools |
| GET | `/api/threatintel/feeds` | Threat feeds |
| POST | `/api/selfheal/analyze` | Self-heal analysis |
| GET | `/api/selfheal/policies` | Security policies |
| WS | `/ws` | Real-time updates |
| **POST** | **`/api/autonomous/blue/run`** | **Run autonomous Blue Team defense** |
| **POST** | **`/api/autonomous/red/run`** | **Run autonomous Red Team simulation** |
| **POST** | **`/api/autonomous/full/run`** | **Run Blue + Red simultaneously** |
| **GET** | **`/api/autonomous/orchestrator/status`** | **Get orchestrator metrics** |
| **GET** | **`/api/autonomous/orchestrator/history`** | **Get operation history** |
| **POST** | **`/api/autonomous/schedule`** | **Schedule recurring operations** |

---

## ⚠️ Safety & Ethics

**Y2K Cyber AI is a defensive and educational tool.**

- **Red Mode** is strictly for **educational simulation** in authorized lab environments.
- The **Sandbox** executes code only on **user-authorized** VMs via SSH.
- The platform does not generate working exploit code or payloads for real-world attacks.
- Users are responsible for ensuring they have permission to scan or test any systems.
- **Cyber Range** scenarios use simulated environments only.

---

## 📜 Legal & Compliance

The CCB Karnataka Core Engine operates within the legal framework of the Information Technology Act and relevant regional public laws. Its automated GRC module ensures that all security policies are updated to maintain the highest standards of legal compliance and public safety.

---

*Mission-critical security infrastructure for CCB Karnataka.*
