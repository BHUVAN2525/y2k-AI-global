import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useMode } from '../contexts/ModeContext'
import axios from 'axios'

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -16, transition: { duration: 0.2 } }
}

// ─── BLUE: Malware Analysis & Defense Tools ─────────────────────────────────
const BLUE_TOOLS = [
    { to: '/blue/dashboard', icon: '🛡️', title: 'SOC Dashboard', desc: 'Real-time threat monitoring and incident tracking' },
    { to: '/blue/logs', icon: '📡', title: 'Log Viewer', desc: 'Ingest and analyze security event logs' },
    { to: '/blue/incidents', icon: '🚨', title: 'Incident Manager', desc: 'Triage and respond to security incidents' },
    { to: '/blue/assistant', icon: '💬', title: 'SOC Assistant', desc: 'AI-powered defense analyst copilot' },
    { to: '/analyze', icon: '🔬', title: 'File Analyzer', desc: 'Upload and analyze suspicious files with ML + AI' },
    { to: '/sandbox', icon: '🧪', title: 'Malware Sandbox', desc: 'Detonate malware in isolated VM for behavior analysis' },
    { to: '/batch', icon: '📦', title: 'Batch Scanner', desc: 'Analyze multiple suspicious files at once' },
    { to: '/monitor', icon: '👁️', title: 'Live Monitor', desc: 'Real-time filesystem and network surveillance' },
    { to: '/self-heal', icon: '🩹', title: 'Self-Healing', desc: 'Auto-generate remediation and hardening scripts' },
    { to: '/threat-intel', icon: '📊', title: 'Threat Intel', desc: 'IOC enrichment and threat intelligence feeds' },
    { to: '/memory-forensics', icon: '🧬', title: 'Memory Forensics', desc: 'Analyze memory dumps for rootkits and injections' },
    { to: '/digital-twin', icon: '🏗️', title: 'Digital Twin', desc: 'Infrastructure modeling and vulnerability mapping' },
    { to: '/blue/zero-trust', icon: '🌐', title: 'Zero Trust', desc: 'Zero trust posture assessment and enforcement' },
    { to: '/blockchain-logs', icon: '⛓️', title: 'Blockchain Logs', desc: 'Immutable audit trail and log integrity' },
]

const BLUE_WORKFLOW = [
    { step: 1, title: 'Ingest', desc: 'Collect logs', icon: '📥' },
    { step: 2, title: 'Detect', desc: 'AI analysis', icon: '🔍' },
    { step: 3, title: 'Triage', desc: 'Prioritize', icon: '⚡' },
    { step: 4, title: 'Investigate', desc: 'Forensics', icon: '🔬' },
    { step: 5, title: 'Respond', desc: 'Playbooks', icon: '🛡️' },
    { step: 6, title: 'Report', desc: 'Compliance', icon: '📋' },
]

// ─── RED: Offensive Simulation & Attack Tools ───────────────────────────────
const RED_TOOLS = [
    { to: '/red/recon', icon: '🔍', title: 'Recon Dashboard', desc: 'Port scanning, service enumeration, subdomain discovery' },
    { to: '/red/attack-graph', icon: '🗺️', title: 'Attack Graph', desc: 'Kill chain visualization and attack path modeling' },
    { to: '/red/copilot', icon: '💬', title: 'Red Copilot', desc: 'AI offensive strategy and technique mapping' },
    { to: '/swarm', icon: '🧠', title: 'Agent Swarm', desc: 'Multi-agent coordination for complex operations' },
    { to: '/attack-prediction', icon: '🔮', title: 'Attack Prediction', desc: 'Predict attack vectors and exploitation outcomes' },
    { to: '/battlefield', icon: '⚔️', title: 'Cyber Battlefield', desc: 'AI vs AI red/blue simulation arena' },
    { to: '/cyber-range', icon: '🎮', title: 'Cyber Range', desc: 'CTF exercises and training scenarios' },
]

const RED_WORKFLOW = [
    { step: 1, title: 'Recon', desc: 'Map surface', icon: '🔍' },
    { step: 2, title: 'Scan', desc: 'Find vulns', icon: '🔓' },
    { step: 3, title: 'Plan', desc: 'Attack path', icon: '🗺️' },
    { step: 4, title: 'Exploit', desc: 'Execute', icon: '⚡' },
    { step: 5, title: 'Escalate', desc: 'Priv esc', icon: '🏴' },
    { step: 6, title: 'Report', desc: 'Findings', icon: '📋' },
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
    const accent = 'var(--info)' // Locked color regardless of mode

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '0.5rem' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.35rem 1.2rem', borderRadius: 100,
                    background: `${accent}10`, border: `1px solid ${accent}30`,
                    marginBottom: '0.75rem'
                }}>
                    <span style={{ fontSize: '1.2rem' }}>{isBlue ? '🛡️' : '⚔️'}</span>
                    <span style={{ color: accent, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {isBlue ? 'MALWARE ANALYSIS MODE' : 'OFFENSIVE SIMULATION MODE'}
                    </span>
                </div>
                <h1 style={{
                    fontSize: '2rem', fontWeight: 800,
                    background: 'var(--bg-secondary), #0088cc, #fff)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginBottom: '0.3rem'
                }}>
                    {isBlue ? 'Defense Command Center' : 'Attack Operations Center'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto' }}>
                    {isBlue
                        ? 'Analyze malware, investigate threats, and defend infrastructure.'
                        : 'Simulate attacks, discover vulnerabilities, and test defenses.'}
                </p>
            </div>

            {/* Workflow */}
            <div style={{ marginBottom: '2rem' }}>
                <div className="section-title" style={{ borderBottom: `1px solid ${accent}30`, paddingBottom: '0.4rem', marginBottom: '1rem', color: accent }}>
                    {isBlue ? '🔄 Defense Workflow' : '🎯 Attack Workflow'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${workflow.length}, 1fr)`, gap: '0.4rem', position: 'relative' }}>
                    {workflow.map((w, i) => (
                        <motion.div key={w.step} whileHover={{ y: -2, borderColor: accent }} style={{
                            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                            borderRadius: 10, padding: '0.6rem 0.4rem', textAlign: 'center',
                            position: 'relative', transition: 'border-color 0.2s'
                        }}>
                            <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{w.icon}</div>
                            <div style={{
                                position: 'absolute', top: 5, right: 5,
                                background: accent, color: '#000', fontWeight: 800,
                                width: 16, height: 16, borderRadius: '50%', fontSize: '0.55rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>{w.step}</div>
                            <div style={{ fontWeight: 700, fontSize: '0.7rem', color: 'var(--text-primary)' }}>{w.title}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{w.desc}</div>
                            {i < workflow.length - 1 && (
                                <div style={{
                                    position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)',
                                    color: accent, fontSize: '0.9rem', fontWeight: 900, zIndex: 1
                                }}>→</div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Stats */}
            {isBlue && (
                <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
                    <StatCard label="Total Logs" value={stats?.totalLogs?.toLocaleString() ?? '—'} color="var(--info)" icon="📋" />
                    <StatCard label="Threats Today" value={stats?.threatsToday ?? '—'} color="#ff8800" icon="⚠️" />
                    <StatCard label="Open Incidents" value={stats?.openIncidents ?? '—'} color="var(--danger)" icon="🚨" />
                    <StatCard label="Critical" value={stats?.criticalIncidents ?? '—'} color="var(--danger)" icon="💀" />
                </div>
            )}
            {isRed && (
                <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
                    <StatCard label="Recon Scans" value={stats?.total_scans ?? '—'} color="var(--danger)" icon="🔍" />
                    <StatCard label="Vulns Found" value={stats?.malware_detected ?? '—'} color="#ff8800" icon="🔓" />
                    <StatCard label="Attack Paths" value={stats?.clean_files ?? '—'} color="var(--warning)" icon="🗺️" />
                    <StatCard label="Exploits" value={stats ? `${stats.detection_rate}%` : '—'} color="var(--success)" icon="⚡" />
                </div>
            )}

            {/* Tools — mode-specific only, no overlap */}
            <div>
                <div className="section-title" style={{ borderBottom: `1px solid ${accent}30`, paddingBottom: '0.4rem', marginBottom: '1rem', color: accent }}>
                    {isBlue ? '🔵 Analysis Tools' : '🔴 Attack Tools'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                    {tools.map(t => (
                        <Link key={t.to} to={t.to} style={{ textDecoration: 'none' }}>
                            <motion.div className="card" whileHover={{ y: -3, borderColor: accent }} style={{ cursor: 'pointer', padding: '0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                    <div style={{ fontSize: '1.3rem', flexShrink: 0 }}>{t.icon}</div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: accent, fontSize: '0.85rem', marginBottom: '0.15rem' }}>{t.title}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{t.desc}</div>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}

                    {/* AI Agent card — adapts to mode */}
                    <Link to="/agent" style={{ textDecoration: 'none' }}>
                        <motion.div className="card" whileHover={{ y: -3, borderColor: 'var(--primary)' }} style={{
                            cursor: 'pointer', padding: '0.85rem',
                            borderColor: 'var(--primary)40',
                            background: 'rgba(179,136,255,0.04)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div style={{ fontSize: '1.3rem', flexShrink: 0 }}>🤖</div>
                                <div>
                                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0.15rem' }}>
                                        {isBlue ? 'Blue Defender Agent' : 'Red Attack Agent'}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                                        {isBlue
                                            ? 'AI SOC analyst — threat analysis, SIEM rules, playbooks'
                                            : 'AI offensive planner — attack paths, exploitation, recon'}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                </div>
            </div>
        </motion.div>
    )
}

function StatCard({ label, value, color, icon }) {
    return (
        <motion.div className="stat-card" whileHover={{ y: -2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="stat-label">{label}</span>
                <span style={{ fontSize: '1.1rem' }}>{icon}</span>
            </div>
            <div className="stat-value" style={{ color }}>{value}</div>
        </motion.div>
    )
}
