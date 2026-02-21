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

// ─── BLUE MODE TOOLS (DEFENSE ONLY) ─────────────────────────────────────────
const BLUE_TOOLS = [
    { to: '/blue/dashboard', icon: '🛡️', title: 'SOC Dashboard', desc: 'Real-time threat overview and incident tracking', tag: 'Defense' },
    { to: '/blue/logs', icon: '📡', title: 'Log Viewer', desc: 'Ingest, search, and analyze security logs', tag: 'Monitoring' },
    { to: '/blue/incidents', icon: '🚨', title: 'Incident Manager', desc: 'Triage, investigate, and respond to incidents', tag: 'Response' },
    { to: '/blue/assistant', icon: '🤖', title: 'SOC Assistant', desc: 'AI-powered SOC analyst copilot', tag: 'AI' },
    { to: '/blue/zero-trust', icon: '🌐', title: 'Zero Trust', desc: 'Zero trust posture assessment', tag: 'Policy' },
    { to: '/sandbox', icon: '🧪', title: 'Malware Sandbox', desc: 'Detonate and analyze malware in isolated VM', tag: 'Analysis' },
    { to: '/analyze', icon: '🔬', title: 'File Analyzer', desc: 'Upload and analyze suspicious files using ML + AI', tag: 'Analysis' },
    { to: '/batch', icon: '📦', title: 'Batch Scanner', desc: 'Analyze multiple files simultaneously', tag: 'Analysis' },
    { to: '/monitor', icon: '👁️', title: 'Live Monitor', desc: 'Real-time file system surveillance', tag: 'Monitoring' },
    { to: '/self-heal', icon: '🩹', title: 'Self-Healing', desc: 'Auto-generate remediation scripts', tag: 'Response' },
    { to: '/threat-intel', icon: '📊', title: 'Threat Intel', desc: 'Threat intelligence feeds and IOC enrichment', tag: 'Intelligence' },
    { to: '/memory-forensics', icon: '🧬', title: 'Memory Forensics', desc: 'Analyze memory dumps for hidden malware', tag: 'Forensics' },
    { to: '/digital-twin', icon: '🏗️', title: 'Digital Twin', desc: 'Infrastructure modeling and visibility', tag: 'Visibility' },
    { to: '/blockchain-logs', icon: '⛓️', title: 'Blockchain Logs', desc: 'Immutable audit trail and log integrity', tag: 'Audit' },
]

const BLUE_WORKFLOW = [
    { step: 1, title: 'Ingest', desc: 'Collect security logs', icon: '📥' },
    { step: 2, title: 'Detect', desc: 'AI threat analysis', icon: '🔍' },
    { step: 3, title: 'Triage', desc: 'Prioritize incidents', icon: '⚡' },
    { step: 4, title: 'Investigate', desc: 'Deep-dive forensics', icon: '🔬' },
    { step: 5, title: 'Respond', desc: 'Execute playbooks', icon: '🛡️' },
    { step: 6, title: 'Report', desc: 'Compliance reports', icon: '📋' },
]

// ─── RED MODE TOOLS (OFFENSE ONLY) ──────────────────────────────────────────
const RED_TOOLS = [
    { to: '/red/recon', icon: '🔍', title: 'Recon Dashboard', desc: 'Port scanning, service enumeration, subdomains', tag: 'Recon' },
    { to: '/red/attack-graph', icon: '🗺️', title: 'Attack Graph', desc: 'Visualize attack paths and kill chains', tag: 'Planning' },
    { to: '/red/copilot', icon: '🤖', title: 'Red Copilot', desc: 'AI-assisted offensive strategy', tag: 'AI' },
    { to: '/sandbox', icon: '🧪', title: 'Exploit Sandbox', desc: 'Test payloads in isolated VM environment', tag: 'Testing' },
    { to: '/swarm', icon: '🧠', title: 'Agent Swarm', desc: 'Multi-agent coordination for operations', tag: 'Automation' },
    { to: '/attack-prediction', icon: '🔮', title: 'Attack Prediction', desc: 'Predict likely attack vectors', tag: 'Intelligence' },
    { to: '/battlefield', icon: '⚔️', title: 'Cyber Battlefield', desc: 'AI vs AI red/blue simulation arena', tag: 'Simulation' },
    { to: '/cyber-range', icon: '🎮', title: 'Cyber Range', desc: 'Training scenarios and CTF exercises', tag: 'Training' },
]

const RED_WORKFLOW = [
    { step: 1, title: 'Recon', desc: 'Map attack surface', icon: '🔍' },
    { step: 2, title: 'Scan', desc: 'Find vulnerabilities', icon: '🔓' },
    { step: 3, title: 'Plan', desc: 'Model attack paths', icon: '🗺️' },
    { step: 4, title: 'Exploit', desc: 'Execute in lab VM', icon: '⚡' },
    { step: 5, title: 'Escalate', desc: 'Post-exploitation', icon: '🏴' },
    { step: 6, title: 'Report', desc: 'Document findings', icon: '📋' },
]

export default function Dashboard() {
    const { mode, isBlue, isRed } = useMode()
    const [stats, setStats] = useState(null)

    useEffect(() => {
        const endpoint = isBlue ? '/api/blue/stats' : '/api/reports/stats/overview'
        axios.get(endpoint).then(r => setStats(r.data)).catch(() => setStats(null))
    }, [mode])

    const tools = isBlue ? BLUE_TOOLS : RED_TOOLS
    const workflow = isBlue ? BLUE_WORKFLOW : RED_WORKFLOW
    const accent = isBlue ? '#00d4ff' : '#ff3366'

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            {/* Mode Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '0.5rem' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.4rem 1.25rem', borderRadius: 100,
                    background: `${accent}10`, border: `1px solid ${accent}30`,
                    marginBottom: '0.75rem'
                }}>
                    <span style={{ fontSize: '1.3rem' }}>{isBlue ? '🛡️' : '⚔️'}</span>
                    <span style={{ color: accent, fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {isBlue ? 'BLUE MODE — DEFENSIVE OPS' : 'RED MODE — OFFENSIVE SIM'}
                    </span>
                </div>
                <h1 style={{
                    fontSize: '2rem', fontWeight: 800,
                    background: isBlue
                        ? 'linear-gradient(135deg, #00d4ff, #0088cc, #fff)'
                        : 'linear-gradient(135deg, #ff3366, #ff6644, #ffcc00)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginBottom: '0.4rem'
                }}>
                    {isBlue ? 'Defense Command Center' : 'Attack Operations Center'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '550px', margin: '0 auto' }}>
                    {isBlue
                        ? 'Monitor threats, investigate incidents, and protect infrastructure.'
                        : 'Simulate attacks and test defenses in authorized lab environments.'}
                </p>
            </div>

            {/* Workflow Pipeline */}
            <div style={{ marginBottom: '2rem' }}>
                <div className="section-title" style={{ borderBottom: `1px solid ${accent}30`, paddingBottom: '0.5rem', marginBottom: '1rem', color: accent }}>
                    {isBlue ? '🔄 Defense Workflow' : '🎯 Attack Workflow'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${workflow.length}, 1fr)`, gap: '0.5rem', position: 'relative' }}>
                    {workflow.map((w, i) => (
                        <motion.div key={w.step} whileHover={{ y: -3, borderColor: accent }} style={{
                            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                            borderRadius: 12, padding: '0.75rem 0.5rem', textAlign: 'center',
                            position: 'relative', transition: 'border-color 0.2s'
                        }}>
                            <div style={{ fontSize: '1.3rem', marginBottom: '0.3rem' }}>{w.icon}</div>
                            <div style={{
                                position: 'absolute', top: 6, right: 6,
                                background: accent, color: '#000', fontWeight: 800,
                                width: 18, height: 18, borderRadius: '50%', fontSize: '0.6rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>{w.step}</div>
                            <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-primary)', marginBottom: '0.15rem' }}>{w.title}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{w.desc}</div>
                            {i < workflow.length - 1 && (
                                <div style={{
                                    position: 'absolute', right: -12, top: '50%', transform: 'translateY(-50%)',
                                    color: accent, fontSize: '1rem', fontWeight: 900, zIndex: 1
                                }}>→</div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Stats */}
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

            {/* Mode-Specific Tool Grid — only tools for current mode */}
            <div style={{ marginBottom: '2rem' }}>
                <div className="section-title" style={{ borderBottom: `1px solid ${accent}30`, paddingBottom: '0.5rem', marginBottom: '1rem', color: accent }}>
                    {isBlue ? '🔵 Defense Tools' : '🔴 Offense Tools'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    {tools.map(t => (
                        <Link key={t.to} to={t.to} style={{ textDecoration: 'none' }}>
                            <motion.div className="card" whileHover={{ y: -4, borderColor: accent }} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                    <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>{t.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                                            <div style={{ fontWeight: 700, color: accent, fontSize: '0.85rem' }}>{t.title}</div>
                                            <span style={{
                                                fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase',
                                                color: accent, background: `${accent}15`, padding: '0.1rem 0.4rem',
                                                borderRadius: 100, letterSpacing: '0.05em'
                                            }}>{t.tag}</span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.desc}</div>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

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
