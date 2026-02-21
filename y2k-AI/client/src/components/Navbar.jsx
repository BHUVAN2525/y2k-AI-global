import { useLocation, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'

const PAGE_TITLES = {
    '/dashboard': { title: 'Dashboard', subtitle: 'Threat overview and recent activity' },
    '/analyze': { title: 'File Analyzer', subtitle: 'Upload and analyze suspicious files' },
    '/batch': { title: 'Batch Scanner', subtitle: 'Analyze multiple files at once' },
    '/agent': { title: 'AI Agent', subtitle: 'Y2K Cyber AI conversational intelligence' },
    '/reports': { title: 'Reports', subtitle: 'Scan history and analysis records' },
    '/monitor': { title: 'Real-time Monitor', subtitle: 'Live file system surveillance' },
    '/settings': { title: 'Settings', subtitle: 'Configure API keys and preferences' },
}

export default function Navbar() {
    const location = useLocation()
    const [status, setStatus] = useState(null)

    const page = PAGE_TITLES[location.pathname] || { title: 'Y2K Cyber AI', subtitle: '' }

    useEffect(() => {
        // poll server health every 5s
        const checkStatus = () => axios.get('/api/status').then(r => setStatus(r.data)).catch(() => { setStatus(null) })
        checkStatus()
        const interval = setInterval(checkStatus, 5000)
        return () => clearInterval(interval)
    }, [])

    const allOk = status?.services?.python_api === 'operational'

    return (
        <header style={{
            position: 'fixed', top: 0, left: 'var(--sidebar-width)', right: 0,
            height: 'var(--navbar-height)',
            background: 'rgba(8, 12, 24, 0.9)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 2rem', zIndex: 99
        }}>
            <div>
                <h1 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{page.title}</h1>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{page.subtitle}</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* offline/demo toggle removed – always online now */}
                    <NavLink to="/sandbox" style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)',
                        textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600,
                        background: isActive ? 'rgba(0,212,255,0.1)' : 'var(--bg-secondary)',
                        color: isActive ? 'var(--cyan)' : 'var(--text-secondary)',
                        border: '1px solid var(--border)', transition: 'all 0.15s'
                    })}>
                        <span style={{ fontSize: '0.9rem' }}>🧪</span> Sandbox
                    </NavLink>
                    <NavLink to="/dashboard" style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)',
                        textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600,
                        background: isActive ? 'rgba(0,212,255,0.1)' : 'var(--bg-secondary)',
                        color: isActive ? 'var(--cyan)' : 'var(--text-secondary)',
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

                {/* System status indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                    <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: allOk ? 'var(--green)' : 'var(--red)',
                        boxShadow: allOk ? '0 0 8px var(--green)' : '0 0 8px var(--red)'
                    }} />
                    <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {allOk ? 'All Systems Online' : 'Engine Offline'}
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
