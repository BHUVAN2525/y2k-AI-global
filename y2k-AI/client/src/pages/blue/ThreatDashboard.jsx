import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const pageVariants = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

const SEV_COLORS = { critical: '#ff3366', high: '#ff8800', medium: '#ffcc00', low: '#00ff88', info: '#00d4ff' }

function SevBadge({ sev }) {
    return <span className={`badge sev-${sev}`} style={{ fontSize: '0.7rem' }}>{sev?.toUpperCase()}</span>
}

function StatCard({ label, value, sub, color = '#00d4ff', icon }) {
    return (
        <div className="stat-card" style={{ borderLeft: `3px solid ${color}` }}>
            <div className="stat-label">{icon} {label}</div>
            <div className="stat-value" style={{ color, fontSize: '1.8rem' }}>{value ?? '—'}</div>
            {sub && <div className="stat-sub">{sub}</div>}
        </div>
    )
}

export default function ThreatDashboard() {
    const [stats, setStats] = useState(null)
    const [threats, setThreats] = useState([])
    const [incidents, setIncidents] = useState([])
    const [loading, setLoading] = useState(true)
    const ws = useRef(null)

    const load = async () => {
        try {
            const [s, t] = await Promise.all([
                axios.get('/api/blue/stats'),
                axios.get('/api/blue/threats')
            ])
            setStats(s.data)
            setThreats(t.data.threats || [])
            setIncidents(t.data.incidents || [])
        } catch { }
        setLoading(false)
    }

    useEffect(() => {
        load()
        const interval = setInterval(load, 15000)
        // WebSocket for live updates
        ws.current = new WebSocket(`ws://${window.location.hostname}:5000/ws`)
        ws.current.onmessage = (e) => {
            const d = JSON.parse(e.data)
            if (d.type === 'blue_log' || d.type === 'soar_action') load()
        }
        return () => { clearInterval(interval); ws.current?.close() }
    }, [])

    const timeline = stats?.timeline?.map(t => ({ hour: `${t._id}:00`, threats: t.threats, total: t.total })) || []
    const mitreData = stats?.byMitre?.map(m => ({ name: m._id || 'Unknown', value: m.count })) || []
    const COLORS = ['#ff3366', '#ff8800', '#ffcc00', '#9b59b6', '#00d4ff', '#00ff88', '#ff6b35', '#c0392b']

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate">
            <div className="page-title">🔵 SOC Threat Dashboard</div>
            <div className="page-subtitle">Y2K Cyber AI — Real-time Blue Mode defense overview</div>

            {/* Stat Cards */}
            <div className="stat-grid">
                <StatCard icon="📋" label="Total Logs" value={stats?.totalLogs?.toLocaleString()} sub="All ingested events" color="#00d4ff" />
                <StatCard icon="⚠️" label="Threats Today" value={stats?.threatsToday} sub="Score ≥ 30" color="#ff8800" />
                <StatCard icon="🚨" label="Open Incidents" value={stats?.openIncidents} sub="Requires attention" color="#ff3366" />
                <StatCard icon="💀" label="Critical Alerts" value={stats?.criticalIncidents} sub="Immediate action needed" color="#ff3366" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Timeline Chart */}
                <div className="card">
                    <div className="section-title">📈 Threat Activity (Last 24h)</div>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={timeline}>
                            <defs>
                                <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ff3366" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ff3366" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="hour" tick={{ fill: '#8892a4', fontSize: 11 }} />
                            <YAxis tick={{ fill: '#8892a4', fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: '#0d1628', border: '1px solid #1a2d4a', borderRadius: 8 }} />
                            <Area type="monotone" dataKey="threats" stroke="#ff3366" fill="url(#tGrad)" name="Threats" />
                            <Area type="monotone" dataKey="total" stroke="#00d4ff" fill="none" strokeDasharray="3 3" name="Total Logs" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* MITRE Pie */}
                <div className="card">
                    <div className="section-title">🎯 MITRE Tactics</div>
                    {mitreData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={mitreData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                                    {mitreData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#0d1628', border: '1px solid #1a2d4a', borderRadius: 8 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#4a5568', padding: '3rem 0' }}>No incidents yet</div>
                    )}
                </div>
            </div>

            {/* Recent Incidents */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="section-title">🚨 Active Incidents</div>
                {incidents.length === 0 ? (
                    <div style={{ color: '#4a5568', textAlign: 'center', padding: '2rem' }}>✅ No active incidents</div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Severity</th><th>Title</th><th>MITRE</th><th>Source IP</th><th>Status</th><th>Time</th></tr></thead>
                            <tbody>
                                {incidents.slice(0, 10).map(inc => (
                                    <tr key={inc._id}>
                                        <td><SevBadge sev={inc.severity} /></td>
                                        <td style={{ maxWidth: 280 }}>{inc.title}</td>
                                        <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#9b59b6' }}>{inc.mitre_technique}</span></td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{inc.source_ip || '—'}</td>
                                        <td><span className={`badge ${inc.status === 'open' ? 'badge-danger' : 'badge-info'}`}>{inc.status}</span></td>
                                        <td style={{ color: '#4a5568', fontSize: '0.8rem' }}>{new Date(inc.timestamp).toLocaleTimeString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Recent Threat Logs */}
            <div className="card">
                <div className="section-title">📋 Recent Threat Logs</div>
                <div className="log-stream">
                    {threats.length === 0 ? (
                        <div style={{ color: '#4a5568', padding: '1rem' }}>No threat logs yet. Ingest logs via the Log Viewer.</div>
                    ) : threats.slice(0, 30).map(log => (
                        <div key={log._id} className="log-line">
                            <span className="log-ts">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span className="log-lvl"><SevBadge sev={log.level === 'critical' ? 'critical' : log.threat_score > 50 ? 'high' : 'medium'} /></span>
                            <span className="log-msg">{log.message}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}
