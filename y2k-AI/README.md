# Y2K Cyber AI — Autonomous Defense Platform

> **AI-Powered SOC Analyst • Multi-Agent Swarm • Red Team Simulator • Self-Healing Security • Cyber Range**

---

## 🚀 What Is It?

**Y2K Cyber AI** is a next-generation cybersecurity platform that unifies defensive analysis, offensive simulation, threat intelligence, and autonomous security operations into a single AI-driven interface.

Built across **5 implementation phases**, the platform delivers **15+ features** spanning a React frontend (11 pages), a Node.js API gateway, Python analysis engines, and multi-agent AI orchestration powered by Google Gemini.

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
│  AI Agents    │  Services   │  Python Engines   │
│  Supervisor   │  Threat     │  Self-Heal        │
│  ThreatIntel  │  Intel      │  Memory           │
│  Malware      │  Self-Heal  │  Forensics        │
│  Compliance   │  Policy Gen │  ML Classifier    │
├───────────────┴─────────────┴───────────────────┤
│  External APIs: Gemini • VirusTotal • AbuseIPDB │
└─────────────────────────────────────────────────┘
```

---

## 🔥 Features by Phase

### Phase 1–2: Core Platform
| Feature | Description |
|---------|-------------|
| **🧠 Multi-Agent Swarm** | Supervisor-orchestrated swarm of specialized AI agents with real-time status monitoring |
| **📡 Threat Intelligence** | Live feed aggregation from VirusTotal & AbuseIPDB with IOC enrichment and correlation |
| **🩹 Self-Healing Engine** | Automated threat remediation with AI-generated action plans, CVE patch DB, and policy generation |
| **🧬 Memory Forensics** | Deep memory analysis for process injection, rootkits, and hidden modules |
| **🧪 Malware Analysis** | Static + dynamic analysis with ML classification (Random Forest) and sandbox execution |
| **🤖 Autonomous Blue Agent** | Self-directing 7-phase SOC defense workflow with zero user intervention |
| **🎯 Autonomous Red Agent** | Self-directing 10-phase attack simulation (lab-only enforced) with defense recommendations |
| **⚡ Orchestrator Service** | Runs Blue + Red simultaneously, correlates results, identifies detection gaps |

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
| **AI Engine** | Google Gemini 1.5 Flash + Heuristic Fallback |
| **ML Engine** | Python FastAPI + scikit-learn (Random Forest) |
| **Database** | MongoDB (optional, graceful fallback) |
| **Sandbox** | SSH2 (Secure Shell) integration |
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
├── server/                    # Node.js API Gateway
│   ├── agents/                # AI Agents
│   │   ├── supervisorAgent.js
│   │   ├── threatIntelAgent.js
│   │   ├── malwareAnalysisAgent.js
│   │   └── complianceAgent.js
│   ├── services/              # Business Logic
│   │   ├── threatIntelService.js
│   │   ├── selfHealService.js
│   │   └── policyGenerator.js
│   └── routes/                # API Routes
│       ├── agent.js
│       ├── threatintel.js
│       ├── selfheal.js
│       ├── blue/logs.js, soar.js
│       └── red/recon.js, cve.js
├── python_api/                # Python Analysis Engines
│   ├── main.py
│   ├── selfHealEngine.py
│   └── memoryForensics.py
├── ML_model/                  # Trained ML Models
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
git clone https://github.com/BHUVAN2525/y2k-AI.git
cd y2k-AI

# Install frontend dependencies
cd client && npm install

# Install backend dependencies
cd ../server && npm install

# Install Python dependencies
cd ../python_api && pip install -r ../requirements.txt
```

### Launch

**Option 1: One-Click (Windows)**
```
Double-click start.bat
```

**Option 2: Manual (3 terminals)**
```bash
# Terminal 1: Python Engine (port 8001)
cd python_api
python -m uvicorn main:app --port 8001 --reload

# Terminal 2: Node.js Server (port 5000)
cd server
npm run dev

# Terminal 3: React Frontend (port 5173)
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

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

## 📜 License

MIT License.

---

*Built with ❤️ by the Y2K Cyber AI Project Team.*
