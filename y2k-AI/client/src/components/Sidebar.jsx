import { NavLink, useLocation } from 'react-router-dom'
import { useMode } from '../contexts/ModeContext'
import ModeToggle from './ModeToggle'

const NAV_BLUE = [
    { to: '/dashboard', icon: '📊', label: 'Command Center' },
    { to: '/blue/dashboard', icon: '🛡️', label: 'SOC Dashboard' },
    { to: '/blue/logs', icon: '📡', label: 'Log Viewer' },
    { to: '/blue/incidents', icon: '🚨', label: 'Incidents' },
    { to: '/blue/assistant', icon: '🤖', label: 'SOC Assistant' },
    { to: '/agent', icon: '💬', label: 'AI Agent' },
    { to: '/blue/zero-trust', icon: '🌐', label: 'Zero Trust' },
    { to: '/sandbox', icon: '🧪', label: 'Malware Sandbox' },
    { to: '/analyze', icon: '🔬', label: 'File Analyzer' },
]

const NAV_RED = [
    { to: '/dashboard', icon: '📊', label: 'Ops Center' },
    { to: '/red/recon', icon: '🔍', label: 'Recon' },
    { to: '/red/attack-graph', icon: '🗺️', label: 'Attack Graph' },
    { to: '/red/copilot', icon: '🤖', label: 'Red Copilot' },
    { to: '/agent', icon: '💬', label: 'AI Agent' },
    { to: '/sandbox', icon: '🧪', label: 'Exploit Sandbox' },
]

const NAV_INTEL_BLUE = [
    { to: '/threat-intel', icon: '📡', label: 'Threat Intel' },
    { to: '/self-heal', icon: '🩹', label: 'Self Heal' },
    { to: '/memory-forensics', icon: '🧬', label: 'Memory Forensics' },
    { to: '/digital-twin', icon: '🏗️', label: 'Digital Twin' },
    { to: '/blockchain-logs', icon: '⛓️', label: 'Blockchain Logs' },
]

const NAV_INTEL_RED = [
    { to: '/swarm', icon: '🧠', label: 'Agent Swarm' },
    { to: '/attack-prediction', icon: '🔮', label: 'Predictions' },
    { to: '/battlefield', icon: '⚔️', label: 'Battlefield' },
    { to: '/cyber-range', icon: '🎮', label: 'Cyber Range' },
]

const NAV_SHARED = [
    { to: '/batch', icon: '📦', label: 'Batch Scanner' },
    { to: '/reports', icon: '📋', label: 'Reports' },
    { to: '/monitor', icon: '👁️', label: 'Live Monitor' },
    { to: '/architecture', icon: '🏛️', label: 'Architecture' },
    { to: '/settings', icon: '⚙️', label: 'Settings' },
]

function NavItem({ to, icon, label, accent }) {
    return (
        <NavLink to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.55rem 1rem', borderRadius: 8, textDecoration: 'none',
            fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.15s',
            background: isActive ? (accent === 'red' ? 'rgba(255,51,102,0.12)' : 'rgba(0,212,255,0.1)') : 'transparent',
            color: isActive ? (accent === 'red' ? '#ff3366' : 'var(--cyan)') : 'var(--text-secondary)',
            borderLeft: isActive ? `2px solid ${accent === 'red' ? '#ff3366' : 'var(--cyan)'}` : '2px solid transparent',
        })}>
            <span style={{ fontSize: '1rem' }}>{icon}</span>
            <span>{label}</span>
        </NavLink>
    )
}

function SectionHeader({ color, label }) {
    return (
        <div style={{
            padding: '0.4rem 1rem', fontSize: '0.65rem', fontWeight: 700,
            color, textTransform: 'uppercase', letterSpacing: '0.1em',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            marginTop: '0.5rem'
        }}>
            {label}
        </div>
    )
}

export default function Sidebar() {
    const { mode, isBlue, isRed } = useMode()

    return (
        <aside style={{
            position: 'fixed', left: 0, top: 0, bottom: 0,
            width: 'var(--sidebar-width)', background: 'var(--bg-secondary)',
            borderRight: `1px solid ${isRed ? 'rgba(255,51,102,0.2)' : 'var(--border)'}`,
            display: 'flex', flexDirection: 'column', zIndex: 100,
            transition: 'border-color 0.3s ease'
        }}>
            {/* Logo */}
            <div style={{ padding: '1.25rem 1rem', borderBottom: `1px solid ${isRed ? 'rgba(255,51,102,0.15)' : 'var(--border)'}` }}>
                <NavLink to="/dashboard" style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isRed ? 'linear-gradient(135deg, #ff3366, #cc0033)' : 'linear-gradient(135deg, #00d4ff, #0066cc)',
                            fontSize: '1.1rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)',
                            boxShadow: isRed ? '0 0 16px rgba(255,51,102,0.4)' : '0 0 16px rgba(0,212,255,0.4)'
                        }}>
                            {isRed ? '⚔' : '🛡'}
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>Y2K CYBER AI</div>
                            <div style={{ fontSize: '0.65rem', color: isRed ? '#ff3366' : 'var(--cyan)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                                {isRed ? '🔴 RED MODE — OFFENSE' : '🔵 BLUE MODE — DEFENSE'}
                            </div>
                        </div>
                    </div>
                </NavLink>
                {/* Mode Toggle */}
                <ModeToggle />
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.5rem' }}>
                {/* Primary Mode Tools */}
                {isBlue && (
                    <div style={{ marginBottom: '0.25rem' }}>
                        <SectionHeader color="#00d4ff" label="🔵 Defense Tools" />
                        {NAV_BLUE.map(n => <NavItem key={n.to} {...n} accent="blue" />)}
                    </div>
                )}

                {isRed && (
                    <div style={{ marginBottom: '0.25rem' }}>
                        <SectionHeader color="#ff3366" label="🔴 Offense Tools" />
                        {NAV_RED.map(n => <NavItem key={n.to} {...n} accent="red" />)}
                    </div>
                )}

                {/* Intelligence */}
                <div>
                    <SectionHeader color="#b388ff" label="🧠 Intelligence" />
                    {isBlue && NAV_INTEL_BLUE.map(n => <NavItem key={n.to} {...n} accent="blue" />)}
                    {isRed && NAV_INTEL_RED.map(n => <NavItem key={n.to} {...n} accent="red" />)}
                </div>

                {/* Shared */}
                <div>
                    <SectionHeader color="#8892b0" label="🔧 Shared" />
                    {NAV_SHARED.map(n => <NavItem key={n.to} {...n} accent={isRed ? 'red' : 'blue'} />)}
                </div>
            </nav>

            {/* Footer */}
            <div style={{
                padding: '0.75rem 1rem',
                borderTop: `1px solid ${isRed ? 'rgba(255,51,102,0.15)' : 'var(--border)'}`,
                fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center'
            }}>
                Y2K Cyber AI v2.0 © 2025
            </div>
        </aside>
    )
}
