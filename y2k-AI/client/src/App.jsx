import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ModeProvider } from './contexts/ModeContext'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'

// Core pages
import Dashboard from './pages/Dashboard'
import Analyzer from './pages/Analyzer'
import AgentChat from './pages/AgentChat'
import Reports from './pages/Reports'
import ReportDetail from './pages/ReportDetail'
import BatchScanner from './pages/BatchScanner'
import Monitor from './pages/Monitor'
import Settings from './pages/Settings'
import GRC from './pages/GRC'
import ITInfrastructure from './pages/ITInfrastructure'
import BankingSecurity from './pages/BankingSecurity'

// 🔵 Blue Mode pages
import ThreatDashboard from './pages/blue/ThreatDashboard'
import LogViewer from './pages/blue/LogViewer'
import IncidentManager from './pages/blue/IncidentManager'
import SOCAssistant from './pages/blue/SOCAssistant'
import Sandbox from './pages/Sandbox'
import VMTerminal from './pages/VMTerminal'

// 🔴 Red Mode pages
import ReconDashboard from './pages/red/ReconDashboard'
import AttackGraph from './pages/red/AttackGraph'
import RedCopilot from './pages/red/RedCopilot'

// 🧠 Swarm & Intelligence pages
import SwarmStatus from './pages/SwarmStatus'
import ThreatIntel from './pages/ThreatIntel'

// 🩹 Self-Healing & Defense pages
import SelfHeal from './pages/SelfHeal'
import ZeroTrust from './pages/blue/ZeroTrust'

// 🧬 Forensics pages
import MemoryForensics from './pages/MemoryForensics'

// 🏗️ Digital Twin + Prediction pages
import DigitalTwin from './pages/DigitalTwin'
import AttackPrediction from './pages/AttackPrediction'
import CyberBattlefield from './pages/CyberBattlefield'
import ForensicLab from './pages/ForensicLab'

// 🎮 Training + Advanced pages
import CyberRange from './pages/CyberRange'
import ArchitectureDesigner from './pages/ArchitectureDesigner'
import BlockchainLogs from './pages/BlockchainLogs'

export default function App() {
    return (
        <ModeProvider>
            <BrowserRouter>
                <div className="app-layout">
                    <Sidebar />
                    <div className="main-content">
                        <Navbar />
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />

                            {/* Core */}
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/analyze" element={<Analyzer />} />
                            <Route path="/batch" element={<BatchScanner />} />
                            <Route path="/agent" element={<AgentChat />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/reports/:id" element={<ReportDetail />} />
                            <Route path="/monitor" element={<Monitor />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/grc" element={<GRC />} />
                            <Route path="/banking" element={<BankingSecurity />} />
                            <Route path="/infrastructure" element={<ITInfrastructure />} />

                            {/* 🔵 Blue Mode */}
                            <Route path="/blue/dashboard" element={<ThreatDashboard />} />
                            <Route path="/blue/logs" element={<LogViewer />} />
                            <Route path="/blue/incidents" element={<IncidentManager />} />
                            <Route path="/blue/assistant" element={<SOCAssistant />} />
                            <Route path="/sandbox" element={<Sandbox />} />
                            <Route path="/vm-terminal" element={<VMTerminal />} />

                            {/* 🔴 Red Mode */}
                            <Route path="/red/recon" element={<ReconDashboard />} />
                            <Route path="/red/attack-graph" element={<AttackGraph />} />
                            <Route path="/red/copilot" element={<RedCopilot />} />

                            {/* 🧠 Swarm & Intelligence */}
                            <Route path="/swarm" element={<SwarmStatus />} />
                            <Route path="/threat-intel" element={<ThreatIntel />} />

                            {/* 🩹 Self-Healing & Defense */}
                            <Route path="/self-heal" element={<SelfHeal />} />
                            <Route path="/blue/zero-trust" element={<ZeroTrust />} />

                            {/* 🧬 Forensics */}
                            <Route path="/memory-forensics" element={<MemoryForensics />} />

                            {/* 🏗️ Digital Twin + Prediction */}
                            <Route path="/digital-twin" element={<DigitalTwin />} />
                            <Route path="/attack-prediction" element={<AttackPrediction />} />
                            <Route path="/battlefield" element={<CyberBattlefield />} />
                            <Route path="/forensics" element={<ForensicLab />} />

                            {/* 🎮 Training + Advanced */}
                            <Route path="/cyber-range" element={<CyberRange />} />
                            <Route path="/architecture" element={<ArchitectureDesigner />} />
                            <Route path="/blockchain-logs" element={<BlockchainLogs />} />
                        </Routes>
                    </div>
                </div>
            </BrowserRouter>
        </ModeProvider>
    )
}
