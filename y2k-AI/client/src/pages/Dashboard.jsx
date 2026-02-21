import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import axios from 'axios'

const COLORS = ['#ff3366', '#00d4ff', '#ffcc00', '#00ff88', '#9b59b6']

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -16, transition: { duration: 0.2 } }
}

export default function Dashboard() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        axios.get('/api/reports/stats/overview')
            .then(r => setStats(r.data))
            .catch(() => setStats(null))
            .finally(() => setLoading(false))
    }, [])

    const pieData = stats?.by_type?.slice(0, 5).map(t => ({
        name: t._id || 'Unknown', value: t.count
    })) || []

    const areaData = stats?.by_day?.map(d => ({
        date: d._id, total: d.total, malware: d.malware
    })) || []

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <div style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '1rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #00d4ff, #fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>
                    Y2K Cyber AI Command Center
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Central landing hub for threat intelligence, malware analysis, and real-time monitoring.
                </p>
            </div>

            {/* Main Navigation Hub */}
            <div style={{ marginBottom: '3rem' }}>
                <div className="section-title" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                    🚀 Core Systems
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <QuickAction to="/analyze" icon="🔬" title="File Analyzer" desc="Upload and analyze suspicious files using AI" color="var(--cyan)" />
                    <QuickAction to="/batch" icon="📦" title="Batch Scanner" desc="Analyze multiple files simultaneously" color="var(--yellow)" />
                    <QuickAction to="/agent" icon="🤖" title="AI Agent" desc="Chat with conversational threat intelligence" color="var(--purple)" />
                    <QuickAction to="/monitor" icon="👁️" title="Live Monitor" desc="Real-time file system surveillance" color="var(--green)" />
                    <QuickAction to="/reports" icon="📋" title="Scan Reports" desc="View history and analysis records" color="#ff7675" />
                    <QuickAction to="/settings" icon="⚙️" title="Settings" desc="Configure API keys and preferences" color="#b2bec3" />
                </div>
            </div>

            {/* Stat Cards */}
            <div className="section-title" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                📊 System Intelligence
            </div>
            <div className="stat-grid" style={{ marginBottom: '2rem' }}>
                <StatCard label="Total Scans" value={stats?.total_scans ?? '—'} color="var(--cyan)" icon="🔬" />
                <StatCard label="Malware Detected" value={stats?.malware_detected ?? '—'} color="var(--red)" icon="⚠️" />
                <StatCard label="Clean Files" value={stats?.clean_files ?? '—'} color="var(--green)" icon="✅" />
                <StatCard label="Detection Rate" value={stats ? `${stats.detection_rate}%` : '—'} color="var(--yellow)" icon="📊" />
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Area Chart */}
                <div className="card">
                    <div className="section-title">📈 Scan Activity (Last 30 Days)</div>
                    {areaData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={areaData}>
                                <defs>
                                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="malwareGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff3366" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ff3366" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" tick={{ fill: '#4a5568', fontSize: 10 }} />
                                <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} />
                                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 8 }} />
                                <Area type="monotone" dataKey="total" stroke="#00d4ff" fill="url(#totalGrad)" strokeWidth={2} />
                                <Area type="monotone" dataKey="malware" stroke="#ff3366" fill="url(#malwareGrad)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart message="No scan data yet. Upload files to see activity." />
                    )}
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

function EmptyChart({ message }) {
    return (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {message}
        </div>
    )
}

function QuickAction({ to, icon, title, desc, color }) {
    return (
        <Link to={to} style={{ textDecoration: 'none' }}>
            <motion.div className="card" whileHover={{ y: -4, borderColor: color }} style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
                <div style={{ fontWeight: 600, color, marginBottom: '0.25rem' }}>{title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{desc}</div>
            </motion.div>
        </Link>
    )
}
