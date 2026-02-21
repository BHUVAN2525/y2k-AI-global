import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useMode } from '../contexts/ModeContext'
import axios from 'axios'

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -16, transition: { duration: 0.2 } }
}

// ─── BLUE MODE TOOLS ────────────────────────────────────────────────────────
const BLUE_TOOLS = [
    { to: '/blue/dashboard', icon: '🛡️', title: 'SOC Dashboard', desc: 'Real-time threat overview, incidents, and MITRE activity', tag: 'Defense' },
    { to: '/blue/logs', icon: '📡', title: 'Log Viewer', desc: 'Ingest, search, and analyze security logs', tag: 'Monitoring' },
    { to: '/blue/incidents', icon: '🚨', title: 'Incident Manager', desc: 'Track, triage, and respond to security incidents', tag: 'Response' },
    { to: '/blue/assistant', icon: '🤖', title: 'SOC Assistant', desc: 'AI-powered SOC analyst copilot', tag: 'AI' },
    { to: '/blue/zero-trust', icon: '🌐', title: 'Zero Trust', desc: 'Zero trust posture assessment and enforcement', tag: 'Policy' },
    { to: '/sandbox', icon: '🧪', title: 'Malware Sandbox', desc: 'Detonate and analyze malware in isolated VM', tag: 'Analysis' },
    { to: '/analyze', icon: '🔬', title: 'File Analyzer', desc: 'Upload and analyze suspicious files using ML + AI', tag: 'Analysis' },
    { to: '/self-heal', icon: '🩹', title: 'Self-Healing', desc: 'Auto-generate remediation scripts with confirmation', tag: 'Response' },
    { to: '/threat-intel', icon: '📊', title: 'Threat Intel', desc: 'Threat intelligence feeds and IOC enrichment', tag: 'Intelligence' },
    { to: '/memory-forensics', icon: '🧬', title: 'Memory Forensics', desc: 'Analyze memory dumps for hidden malware', tag: 'Forensics' },
    { to: '/digital-twin', icon: '🏗️', title: 'Digital Twin', desc: 'Infrastructure modeling and vulnerability tagging', tag: 'Visibility' },
    { to: '/blockchain-logs', icon: '⛓️', title: 'Blockchain Logs', desc: 'Immutable audit trail and log integrity', tag: 'Audit' },
]

const BLUE_WORKFLOW = [
    { step: 1, title: 'Ingest Logs', desc: 'Collect logs from endpoints, network, and cloud', icon: '📥' },
    { step: 2, title: 'Detect Anomalies', desc: 'AI-driven behavioral analysis and threat scoring', icon: '🔍' },
    { step: 3, title: 'Triage Incidents', desc: 'Prioritize and classify security incidents', icon: '⚡' },
    { step: 4, title: 'Investigate', desc: 'Deep-dive with sandbox, forensics, and threat intel', icon: '🔬' },
    { step: 5, title: 'Respond', desc: 'Execute playbooks and remediation scripts', icon: '🛡️' },
    { step: 6, title: 'Report', desc: 'Generate compliance reports and audit trails', icon: '📋' },
]

// ─── RED MODE TOOLS ──────────────────────────────────────────────────────────
const RED_TOOLS = [
    { to: '/red/recon', icon: '🔍', title: 'Recon Dashboard', desc: 'Port scanning, service enumeration, subdomain discovery', tag: 'Recon' },
    { to: '/red/attack-graph', icon: '🗺️', title: 'Attack Graph', desc: 'Visualize attack paths and kill chains', tag: 'Planning' },
    { to: '/red/copilot', icon: '🤖', title: 'Red Copilot', desc: 'AI-assisted offensive strategy and technique mapping', tag: 'AI' },
    { to: '/agent', icon: '⚔️', title: 'AI Agent (Red)', desc: 'Conversational red team assistant with SSH execution', tag: 'AI' },
    { to: '/swarm', icon: '🧠', title: 'Agent Swarm', desc: 'Multi-agent coordination for complex operations', tag: 'Automation' },
    { to: '/attack-prediction', icon: '🔮', title: 'Attack Prediction', desc: 'Predict likely attack vectors and outcomes', tag: 'Intelligence' },
    { to: '/battlefield', icon: '⚔️', title: 'Cyber Battlefield', desc: 'AI vs AI red/blue simulation arena', tag: 'Simulation' },
    { to: '/cyber-range', icon: '🎮', title: 'Cyber Range', desc: 'Training scenarios and capture-the-flag exercises', tag: 'Training' },
    { to: '/sandbox', icon: '🧪', title: 'Exploit Sandbox', desc: 'Test payloads in isolated VM environment', tag: 'Testing' },
]

const RED_WORKFLOW = [
    { step: 1, title: 'Reconnaissance', desc: 'Map attack surface: ports, services, subdomains', icon: '🔍' },
    { step: 2, title: 'Vulnerability Scan', desc: 'Identify weaknesses and map to CVEs', icon: '🔓' },
    { step: 3, title: 'Attack Planning', desc: 'Model attack paths using MITRE ATT&CK framework', icon: '🗺️' },
    { step: 4, title: 'Exploitation (Lab)', desc: 'Execute attacks on authorized lab VMs only', icon: '⚡' },
    { step: 5, title: 'Post-Exploitation', desc: 'Privilege escalation, lateral movement analysis', icon: '🏴' },
    { step: 6, title: 'Report', desc: 'Document findings and remediation recommendations', icon: '📋' },
]

// ─── SHARED TOOLS (accessible in both modes) ────────────────────────────────
const SHARED_TOOLS = [
    { to: '/batch', icon: '📦', title: 'Batch Scanner', desc: 'Analyze multiple files simultaneously' },
    { to: '/reports', icon: '📋', title: 'Reports', desc: 'View scan history and analysis records' },
    { to: '/monitor', icon: '👁️', title: 'Live Monitor', desc: 'Real-time file system surveillance' },
    { to: '/settings', icon: '⚙️', title: 'Settings', desc: 'Configure API keys and system preferences' },
    { to: '/architecture', icon: '🏛️', title: 'Architecture', desc: 'Design and model infrastructure securely' },
]

export default function Dashboard() {
    const { mode, isBlue, isRed } = useMode()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const endpoint = isBlue ? '/api/blue/stats' : '/api/reports/stats/overview'
        axios.get(endpoint)
            .then(r => setStats(r.data))
            .catch(() => setStats(null))
            .finally(() => setLoading(false))
    }, [mode])

    const tools = isBlue ? BLUE_TOOLS : RED_TOOLS
    const workflow = isBlue ? BLUE_WORKFLOW : RED_WORKFLOW
    const accent = isBlue ? '#00d4ff' : '#ff3366'
    const accentGlow = isBlue ? 'rgba(0,212,255,0.15)' : 'rgba(255,51,102,0.15)'
    const accentBg = isBlue ? 'rgba(0,212,255,0.06)' : 'rgba(255,51,102,0.06)'

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            {/* ─── Mode Header ─────────────────────────────────── */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem', marginTop: '0.5rem' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.5rem 1.5rem', borderRadius: 100,
                    background: accentBg, border: `1px solid ${accent}30`,
                    marginBottom: '1rem'
                }}>
                    <span style={{ fontSize: '1.5rem' }}>{isBlue ? '🛡️' : '⚔️'}</span>
                    <span style={{ color: accent, fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {isBlue ? 'BLUE MODE — DEFENSIVE OPERATIONS' : 'RED MODE — OFFENSIVE SIMULATION'}
                    </span>
                </div>
                <h1 style={{
                    fontSize: '2.2rem', fontWeight: 800,
                    background: isBlue
                        ? 'linear-gradient(135deg, #00d4ff, #0088cc, #fff)'
                        : 'linear-gradient(135deg, #ff3366, #ff6644, #ffcc00)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem'
                }}>
                    {isBlue ? 'Defense Command Center' : 'Attack Operations Center'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
                    {isBlue
                        ? 'Monitor threats, investigate incidents, and protect infrastructure with AI-powered defense tools.'
                        : 'Simulate attacks, discover vulnerabilities, and test defenses in authorized lab environments.'}
                </p>
            </div>

            {/* ─── Workflow Pipeline ─────────────────────────────── */}
            <div style={{ marginBottom: '2.5rem' }}>
                <div className="section-title" style={{ borderBottom: `1px solid ${accent}30`, paddingBottom: '0.5rem', marginBottom: '1.25rem', color: accent }}>
                    {isBlue ? '🔄 Defense Workflow' : '🎯 Attack Workflow'}
                </div>
                <div style={{
                    display: 'grid', gridTemplateColumns: `repeat(${workflow.length}, 1fr)`, gap: '0.5rem',
                    position: 'relative'
                }}>
                    {workflow.map((w, i) => (
                        <motion.div
                            key={w.step}
                            whileHover={{ y: -3, borderColor: accent }}
                            style={{
                                background: 'var(--bg-secondary)',
                                border: `1px solid var(--border)`,
                                borderRadius: 12, padding: '1rem 0.75rem',
                                textAlign: 'center', position: 'relative',
                                transition: 'border-color 0.2s'
                            }}
                        >
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{w.icon}</div>
                            <div style={{
                                position: 'absolute', top: 8, right: 8,
                                background: accent, color: '#000', fontWeight: 800,
                                width: 20, height: 20, borderRadius: '50%', fontSize: '0.65rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>{w.step}</div>
                            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{w.title}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{w.desc}</div>
                            {i < workflow.length - 1 && (
                                <div style={{
                                    position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)',
                                    color: accent, fontSize: '1.2rem', fontWeight: 900, zIndex: 1
                                }}>→</div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ─── Stats (Blue-specific) ─────────────────────────── */}
            {isBlue && (
                <div className="stat-grid" style={{ marginBottom: '2rem' }}>
                    <StatCard label="Total Logs" value={stats?.totalLogs?.toLocaleString() ?? '—'} color="#00d4ff" icon="📋" />
                    <StatCard label="Threats Today" value={stats?.threatsToday ?? '—'} color="#ff8800" icon="⚠️" />
                    <StatCard label="Open Incidents" value={stats?.openIncidents ?? '—'} color="#ff3366" icon="🚨" />
                    <StatCard label="Critical Alerts" value={stats?.criticalIncidents ?? '—'} color="#ff3366" icon="💀" />
                </div>
            )}

            {isRed && (
                <div className="stat-grid" style={{ marginBottom: '2rem' }}>
                    <StatCard label="Total Scans" value={stats?.total_scans ?? '—'} color="#ff3366" icon="🔍" />
                    <StatCard label="Vulnerabilities" value={stats?.malware_detected ?? '—'} color="#ff8800" icon="🔓" />
                    <StatCard label="Attack Paths" value={stats?.clean_files ?? '—'} color="#ffcc00" icon="🗺️" />
                    <StatCard label="Detection Rate" value={stats ? `${stats.detection_rate}%` : '—'} color="#00ff88" icon="📊" />
                </div>
            )}

            {/* ─── Mode Toolbox ──────────────────────────────────── */}
            <div style={{ marginBottom: '2.5rem' }}>
                <div className="section-title" style={{ borderBottom: `1px solid ${accent}30`, paddingBottom: '0.5rem', marginBottom: '1.25rem', color: accent }}>
                    {isBlue ? '🔵 Blue Mode — Defense Tools' : '🔴 Red Mode — Offensive Tools'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {tools.map(t => (
                        <ToolCard key={t.to} {...t} accent={accent} />
                    ))}
                </div>
            </div>

            {/* ─── Shared Tools ───────────────────────────────────── */}
            <div style={{ marginBottom: '2.5rem' }}>
                <div className="section-title" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
                    🔧 Shared Tools
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {SHARED_TOOLS.map(t => (
                        <ToolCard key={t.to} {...t} accent="var(--text-secondary)" />
                    ))}
                </div>
            </div>

            {/* ─── Chart ──────────────────────────────────────────── */}
            <div className="card">
                <div className="section-title">{isBlue ? '📈 Threat Activity (Last 24h)' : '📈 Scan Activity (Last 30 Days)'}</div>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={[
                        { t: '00:00', v: 2 }, { t: '04:00', v: 5 }, { t: '08:00', v: 12 },
                        { t: '12:00', v: 8 }, { t: '16:00', v: 15 }, { t: '20:00', v: 6 }, { t: '23:59', v: 3 }
                    ]}>
                        <defs>
                            <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={accent} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={accent} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="t" tick={{ fill: '#4a5568', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 8 }} />
                        <Area type="monotone" dataKey="v" stroke={accent} fill="url(#dashGrad)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon }) {
    return (
        <motion.div className="stat-card" whileHover={{ y: -3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="stat-label">{label}</span>
                <span style={{ fontSize: '1.25rem' }}>{icon}</span>
            </div>
            <div className="stat-value" style={{ color }}>{value}</div>
        </motion.div>
    )
}

function ToolCard({ to, icon, title, desc, tag, accent }) {
    return (
        <Link to={to} style={{ textDecoration: 'none' }}>
            <motion.div
                className="card"
                whileHover={{ y: -4, borderColor: accent }}
                style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ fontSize: '1.5rem', flexShrink: 0, marginTop: '0.1rem' }}>{icon}</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                            <div style={{ fontWeight: 700, color: accent, fontSize: '0.9rem' }}>{title}</div>
                            {tag && (
                                <span style={{
                                    fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                                    color: accent, background: `${accent}15`, padding: '0.15rem 0.5rem',
                                    borderRadius: 100, letterSpacing: '0.05em'
                                }}>{tag}</span>
                            )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
                    </div>
                </div>
            </motion.div>
        </Link>
    )
}
