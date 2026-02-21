import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const pageVariants = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

function RiskBar({ value, label }) {
    const color = value >= 0.7 ? '#ff3366' : value >= 0.4 ? '#ff8800' : '#ffcc00'
    return (
        <div style={{ marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ color, fontFamily: 'var(--font-mono)' }}>{(value * 100).toFixed(0)}%</span>
            </div>
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${value * 100}%`, background: color }} />
            </div>
        </div>
    )
}

export default function ReconDashboard() {
    const [target, setTarget] = useState('127.0.0.1')
    const [scanning, setScanning] = useState(false)
    const [reconId, setReconId] = useState(null)
    const [recon, setRecon] = useState(null)
    const [correlations, setCorrelations] = useState([])
    const [history, setHistory] = useState([])
    const [domain, setDomain] = useState('')
    const [subdomains, setSubdomains] = useState([])
    const [subLoading, setSubLoading] = useState(false)
    const ws = useRef(null)

    useEffect(() => {
        axios.get('/api/red/recon').then(r => setHistory(r.data.results || [])).catch(() => { })
        ws.current = new WebSocket(`ws://${window.location.hostname}:5000/ws`)
        ws.current.onmessage = (e) => {
            const d = JSON.parse(e.data)
            if (d.type === 'recon_complete' && d.recon_id === reconId) {
                loadRecon(d.recon_id)
                setScanning(false)
            }
        }
        return () => ws.current?.close()
    }, [reconId])

    const loadRecon = async (id) => {
        const r = await axios.get(`/api/red/recon/${id}`)
        setRecon(r.data)
        // Auto-correlate
        const c = await axios.post('/api/red/correlate', { recon_id: id })
        setCorrelations(c.data.correlations || [])
    }

    const startScan = async () => {
        setScanning(true)
        setRecon(null)
        setCorrelations([])
        try {
            const r = await axios.post('/api/red/recon', { target })
            setReconId(r.data.recon_id)
            // Poll for completion
            const poll = setInterval(async () => {
                const res = await axios.get(`/api/red/recon/${r.data.recon_id}`)
                if (res.data.status === 'complete') {
                    clearInterval(poll)
                    setRecon(res.data)
                    const c = await axios.post('/api/red/correlate', { recon_id: r.data.recon_id })
                    setCorrelations(c.data.correlations || [])
                    setScanning(false)
                    axios.get('/api/red/recon').then(h => setHistory(h.data.results || []))
                } else if (res.data.status === 'failed') {
                    clearInterval(poll)
                    setScanning(false)
                }
            }, 2000)
        } catch (e) {
            setScanning(false)
        }
    }

    const enumSubs = async () => {
        if (!domain) return
        setSubLoading(true)
        try {
            const r = await axios.post('/api/red/subdomain', { domain })
            setSubdomains(r.data.subdomains || [])
        } catch { }
        setSubLoading(false)
    }

    const RISK_COLOR = { critical: '#ff3366', high: '#ff8800', medium: '#ffcc00', low: '#00ff88', info: '#00d4ff' }

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div className="page-title" style={{ marginBottom: 0 }}>🔴 Recon Dashboard</div>
                <span style={{ background: 'rgba(255,51,102,0.15)', color: '#ff3366', border: '1px solid rgba(255,51,102,0.3)', padding: '0.2rem 0.6rem', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700 }}>⚠️ AUTHORIZED LAB ONLY</span>
            </div>
            <div className="page-subtitle">Port scanning, service enumeration, and subdomain discovery</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Scan Panel */}
                <div className="card">
                    <div className="section-title">🎯 Port Scan</div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                        <input className="input" value={target} onChange={e => setTarget(e.target.value)} placeholder="Target IP (lab only)" />
                        <button className="btn btn-danger" onClick={startScan} disabled={scanning} style={{ whiteSpace: 'nowrap' }}>
                            {scanning ? '⏳ Scanning...' : '🔍 Scan'}
                        </button>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        ⚠️ Only private IPs allowed: 127.x, 10.x, 192.168.x, 172.16-31.x
                    </div>

                    {scanning && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                            <div style={{ color: '#ff8800', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                🔴 Scanning {target} — checking {22} common ports...
                            </div>
                            <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
                                <div className="progress-fill" style={{ width: '60%', background: '#ff3366', animation: 'none' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Subdomain Enum */}
                <div className="card">
                    <div className="section-title">🌐 Subdomain Enumeration</div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                        <input className="input" value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com" />
                        <button className="btn btn-ghost" onClick={enumSubs} disabled={subLoading} style={{ whiteSpace: 'nowrap' }}>
                            {subLoading ? '...' : '🔍 Enumerate'}
                        </button>
                    </div>
                    {subdomains.length > 0 && (
                        <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                            {subdomains.slice(0, 20).map((s, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                                    <span>{s.host}</span>
                                    <span style={{ color: s.resolved ? '#00ff88' : '#4a5568' }}>{s.ip || 'unresolved'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Scan Results */}
            {recon && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="section-title">📡 Open Ports — {recon.target}</div>
                    {recon.open_ports?.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', padding: '1rem' }}>No open ports found</div>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead><tr><th>Port</th><th>Service</th><th>Risk</th><th>Banner</th><th>CVEs</th></tr></thead>
                                <tbody>
                                    {recon.open_ports?.map(p => {
                                        const corr = correlations.find(c => c.port === p.port)
                                        return (
                                            <tr key={p.port}>
                                                <td style={{ fontFamily: 'var(--font-mono)', color: '#ff8800' }}>{p.port}/{p.protocol}</td>
                                                <td style={{ fontWeight: 600 }}>{p.service}</td>
                                                <td><span className={`badge sev-${p.risk}`} style={{ fontSize: '0.7rem' }}>{p.risk?.toUpperCase()}</span></td>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 200 }}>{p.banner?.slice(0, 60) || '—'}</td>
                                                <td style={{ color: corr?.cves?.length ? '#ff3366' : '#4a5568', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                                    {corr?.cves?.length ? `${corr.cves.length} CVEs` : '—'}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* CVE Correlations */}
            {correlations.length > 0 && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="section-title">🔓 CVE Correlations</div>
                    {correlations.filter(c => c.cves.length > 0).map(c => (
                        <div key={c.port} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 8, borderLeft: `3px solid ${RISK_COLOR[c.severity] || '#4a5568'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 600 }}>{c.service}:{c.port}</span>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span className={`badge sev-${c.severity}`} style={{ fontSize: '0.7rem' }}>{c.severity}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Likelihood: {c.attack_likelihood}</span>
                                </div>
                            </div>
                            {c.cves.map(cve => (
                                <div key={cve.id} style={{ fontSize: '0.8rem', padding: '0.3rem 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                    <div>
                                        <span style={{ color: '#ff3366', fontFamily: 'var(--font-mono)', marginRight: '0.5rem' }}>{cve.id}</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{cve.desc}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                        <span style={{ color: RISK_COLOR[cve.severity], fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>CVSS {cve.cvss}</span>
                                        {cve.exploit && <span style={{ color: '#ff3366', fontSize: '0.7rem' }}>⚡ EXPLOIT</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Scan History */}
            <div className="card">
                <div className="section-title">📜 Scan History</div>
                {history.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', padding: '1rem' }}>No previous scans</div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Target</th><th>Open Ports</th><th>Status</th><th>Time</th></tr></thead>
                            <tbody>
                                {history.map(h => (
                                    <tr key={h._id} style={{ cursor: 'pointer' }} onClick={() => { setRecon(h); axios.post('/api/red/correlate', { recon_id: h._id }).then(r => setCorrelations(r.data.correlations || [])) }}>
                                        <td style={{ fontFamily: 'var(--font-mono)' }}>{h.target}</td>
                                        <td>{h.open_ports?.length || 0}</td>
                                        <td><span className={`badge ${h.status === 'complete' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>{h.status}</span></td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(h.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
