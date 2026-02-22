import { useLocation, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useMode } from '../contexts/ModeContext'
import axios from 'axios'

const PAGE_TITLES = {
    '/dashboard': { blue: { title: 'Defense Command Center', subtitle: 'Blue Mode — threat overview and defense tools' }, red: { title: 'Attack Operations Center', subtitle: 'Red Mode — offensive simulation and recon tools' } },
    '/analyze': { title: 'File Analyzer', subtitle: 'Upload and analyze suspicious files' },
    '/batch': { title: 'Batch Scanner', subtitle: 'Analyze multiple files at once' },
    '/agent': { blue: { title: 'AI Agent (Blue)', subtitle: 'Defensive intelligence and threat analysis' }, red: { title: 'AI Agent (Red)', subtitle: 'Offensive strategy and exploitation assistance' } },
    '/reports': { title: 'Reports', subtitle: 'Scan history and analysis records' },
    '/monitor': { title: 'Real-time Monitor', subtitle: 'Live file system surveillance' },
    '/settings': { title: 'Settings', subtitle: 'Configure API keys and preferences' },
    '/blue/dashboard': { title: '🛡️ SOC Dashboard', subtitle: 'Real-time threat monitoring and incident tracking' },
    '/blue/logs': { title: '📡 Log Viewer', subtitle: 'Security log ingestion and analysis' },
    '/blue/incidents': { title: '🚨 Incident Manager', subtitle: 'Triage, investigate, and respond to incidents' },
    '/blue/assistant': { title: '🤖 SOC Assistant', subtitle: 'AI-powered SOC analyst copilot' },
    '/blue/zero-trust': { title: '🌐 Zero Trust', subtitle: 'Zero trust posture assessment' },
    '/sandbox': { blue: { title: '🧪 Malware Sandbox', subtitle: 'Detonate and analyze malware in isolated VM' }, red: { title: '🧪 Exploit Sandbox', subtitle: 'Test payloads in isolated VM environment' } },
    '/red/recon': { title: '🔍 Recon Dashboard', subtitle: 'Port scanning and service enumeration' },
    '/red/attack-graph': { title: '🗺️ Attack Graph', subtitle: 'Attack path modeling and kill chain visualization' },
    '/red/copilot': { title: '🤖 Red Copilot', subtitle: 'AI-assisted offensive strategy' },
    '/swarm': { title: '🧠 Agent Swarm', subtitle: 'Multi-agent coordination status' },
    '/threat-intel': { title: '📡 Threat Intel', subtitle: 'Threat intelligence feeds and IOC enrichment' },
    '/self-heal': { title: '🩹 Self-Healing', subtitle: 'Auto-remediation with confirmation gate' },
    '/memory-forensics': { title: '🧬 Memory Forensics', subtitle: 'Memory dump analysis' },
    '/digital-twin': { title: '🏗️ Digital Twin', subtitle: 'Infrastructure modeling and visibility' },
    '/attack-prediction': { title: '🔮 Attack Prediction', subtitle: 'Predictive threat modeling' },
    '/battlefield': { title: '⚔️ Cyber Battlefield', subtitle: 'AI vs AI red/blue simulation arena' },
    '/cyber-range': { title: '🎮 Cyber Range', subtitle: 'Training scenarios and exercises' },
    '/architecture': { title: '🏛️ Architecture Designer', subtitle: 'Secure infrastructure design' },
    '/blockchain-logs': { title: '⛓️ Blockchain Logs', subtitle: 'Immutable audit trail' },
}

export default function Navbar() {
    const location = useLocation()
    const { mode, isBlue, isRed } = useMode()
    const [status, setStatus] = useState(null)

    const raw = PAGE_TITLES[location.pathname]
    const page = raw
        ? (raw.blue && raw.red) ? (isBlue ? raw.blue : raw.red) : raw
        : { title: 'Y2K Cyber AI', subtitle: '' }

    useEffect(() => {
        const checkStatus = () => axios.get('/api/status').then(r => setStatus(r.data)).catch(() => { setStatus(null) })
        checkStatus()
        const interval = setInterval(checkStatus, 5000)
        return () => clearInterval(interval)
    }, [])

    const allOk = status?.services?.backend === 'operational'
    const accent = 'var(--info)' // Locked color regardless of mode

    return (
        <header style={{
            position: 'fixed', top: 0, left: 'var(--sidebar-width)', right: 0,
            height: 'var(--navbar-height)',
            background: 'rgba(8, 12, 24, 0.9)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 2rem', zIndex: 99,
            transition: 'border-color 0.3s'
        }}>
            <div>
                <h1 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{page.title}</h1>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{page.subtitle}</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Mode Indicator */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.3rem 0.75rem', borderRadius: 100,
                    background: `${accent}15`, border: `1px solid ${accent}30`,
                    fontSize: '0.7rem', fontWeight: 700, color: accent,
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                    {isBlue ? '🔵 BLUE' : '🔴 RED'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <NavLink to="/sandbox" style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)',
                        textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600,
                        background: isActive ? `${accent}15` : 'var(--bg-secondary)',
                        color: isActive ? accent : 'var(--text-secondary)',
                        border: '1px solid var(--border)', transition: 'all 0.15s'
                    })}>
                        <span style={{ fontSize: '0.9rem' }}>🧪</span> Sandbox
                    </NavLink>
                    <NavLink to="/dashboard" style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)',
                        textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600,
                        background: isActive ? `${accent}15` : 'var(--bg-secondary)',
                        color: isActive ? accent : 'var(--text-secondary)',
                        border: '1px solid var(--border)', transition: 'all 0.15s'
                    })}>
                        <span style={{ fontSize: '0.9rem' }}>📊</span> Dashboard
                    </NavLink>
                    <NavLink to="/settings" style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)',
                        textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600,
                        background: isActive ? 'rgba(255,255,255,0.1)' : 'var(--bg-secondary)',
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                        border: '1px solid var(--border)', transition: 'all 0.15s'
                    })}>
                        <span style={{ fontSize: '0.9rem' }}>⚙️</span> Settings
                    </NavLink>
                </div>

                {/* System status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                    {allOk ? (
                        <div className="loader" style={{
                            '--cloud-color': 'var(--green)',
                            '--arrows-color': '#aaffaa',
                            '--time-animation': '2s',
                            transform: 'scale(0.18)',
                            margin: '-20px'
                        }}>
                            <svg viewBox="0 0 100 100" id="cloud">
                                <g id="shapes">
                                    <g>
                                        <circle r="15" cy="60" cx="20"></circle>
                                        <circle r="20" cy="45" cx="50"></circle>
                                        <circle r="15" cy="60" cx="80"></circle>
                                    </g>
                                </g>
                                <g>
                                    <rect height="30" width="60" y="45" x="20"></rect>
                                </g>
                                <g>
                                    <path d="M 50 10 A 40 40 0 1 1 10 50 L 20 50 A 30 30 0 1 0 50 20 Z" />
                                    <polygon points="50,0 65,15 35,15" />
                                </g>
                            </svg>
                        </div>
                    ) : (
                        <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: 'var(--red)',
                            boxShadow: '0 0 8px var(--red)'
                        }} />
                    )}
                    <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {allOk ? 'Online' : 'Offline'}
                    </span>
                </div>

                {/* Time */}
                <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                    color: 'var(--text-muted)', padding: '0.3rem 0.75rem',
                    background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)'
                }}>
                    {new Date().toLocaleTimeString()}
                </div>
            </div>
        </header>
    )
}
