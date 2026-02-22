import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const pageVariants = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

function SevBadge({ sev }) {
    return <span className={`badge sev-${sev}`} style={{ fontSize: '0.7rem' }}>{sev?.toUpperCase()}</span>
}

function SOARPanel({ incident, onAction }) {
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState([])

    const act = async (action, payload) => {
        setLoading(true)
        try {
            const r = await axios.post(`/api/blue/soar/${action}`, { incident_id: incident._id, ...payload })
            setResults(prev => [r.data.entry, ...prev])
            onAction()
        } catch { }
        setLoading(false)
    }

    return (
        <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>⚡ SOAR Actions</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="soar-btn soar-block" onClick={() => act('block-ip', { ip: incident.source_ip, reason: 'Incident response' })} disabled={loading || !incident.source_ip}>
                    🚫 Block IP {incident.source_ip || '(no IP)'}
                </button>
                <button className="soar-btn soar-edr" onClick={() => act('trigger-edr', { host: incident.target, severity: incident.severity })} disabled={loading}>
                    🔔 Trigger EDR
                </button>
                <button className="soar-btn soar-report" onClick={() => act('generate-report', {})} disabled={loading}>
                    📄 Generate Report
                </button>
            </div>
            {results.map((r, i) => (
                <div key={i} style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: 6, fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>
                    ✓ {r?.result}
                </div>
            ))}
        </div>
    )
}

import RefreshButton from '../../components/RefreshButton'

export default function IncidentManager() {
    const [incidents, setIncidents] = useState([])
    const [selected, setSelected] = useState(null)
    const [filter, setFilter] = useState({ status: '', severity: '' })
    const [loading, setLoading] = useState(true)

    const load = async () => {
        try {
            const r = await axios.get('/api/blue/incidents', { params: filter })
            setIncidents(r.data.incidents || [])
        } catch { }
        setLoading(false)
    }

    useEffect(() => { load() }, [filter])

    const updateStatus = async (id, status) => {
        await axios.patch(`/api/blue/incidents/${id}`, { status })
        load()
        if (selected?._id === id) setSelected(prev => ({ ...prev, status }))
    }

    const MITRE_TACTICS = {
        'Credential Access': '🔑', 'Privilege Escalation': '⬆️', 'Execution': '⚙️',
        'Persistence': '🔒', 'Exfiltration': '📤', 'Impact': '💥', 'Discovery': '🔍', 'Command & Control': '📡'
    }

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate">
            <div className="page-title">🚨 Incident Manager</div>
            <div className="page-subtitle">Triage, investigate, and respond to security incidents</div>

            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
                {/* Incident List */}
                <div>
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                        <select className="input" value={filter.status} onChange={e => setFilter(p => ({ ...p, status: e.target.value }))} style={{ width: 140 }}>
                            <option value="">All Status</option>
                            {['open', 'investigating', 'contained', 'resolved'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select className="input" value={filter.severity} onChange={e => setFilter(p => ({ ...p, severity: e.target.value }))} style={{ width: 140 }}>
                            <option value="">All Severity</option>
                            {['critical', 'high', 'medium', 'low'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <RefreshButton loading={loading} onClick={load} />
                    </div>

                    {loading ? <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading...</div> :
                        incidents.length === 0 ? (
                            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                ✅ No incidents match the current filter
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {incidents.map(inc => (
                                    <div key={inc._id} className="card" onClick={() => setSelected(inc)}
                                        style={{
                                            cursor: 'pointer', borderLeft: `3px solid ${inc.severity === 'critical' ? 'var(--danger)' : inc.severity === 'high' ? '#ff8800' : 'var(--warning)'}`,
                                            background: selected?._id === inc._id ? 'var(--bg-hover)' : 'var(--bg-card)'
                                        }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{inc.title}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {MITRE_TACTICS[inc.mitre_tactic] || '🎯'} {inc.mitre_tactic} · {inc.mitre_technique}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                                                <SevBadge sev={inc.severity} />
                                                <span className={`badge ${inc.status === 'open' ? 'badge-danger' : inc.status === 'resolved' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>{inc.status}</span>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
                                            <span>📍 {inc.source_ip || 'Unknown IP'}</span>
                                            <span>🕐 {new Date(inc.timestamp).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    }
                </div>

                {/* Detail Panel */}
                {selected && (
                    <div className="card" style={{ position: 'sticky', top: '1rem', height: 'fit-content' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div className="section-title" style={{ marginBottom: 0 }}>Incident Detail</div>
                            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                        </div>
                        <SevBadge sev={selected.severity} />
                        <h3 style={{ marginTop: '0.75rem', marginBottom: '0.5rem', fontSize: '1rem' }}>{selected.title}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>{selected.description}</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                            {[
                                ['MITRE ID', selected.mitre_technique],
                                ['Tactic', selected.mitre_tactic],
                                ['Source IP', selected.source_ip],
                                ['Target', selected.target],
                                ['CVSS', selected.cvss_score || '—'],
                                ['Time', new Date(selected.timestamp).toLocaleString()]
                            ].map(([k, v]) => (
                                <div key={k} style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: 6 }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{k}</div>
                                    <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>{v || '—'}</div>
                                </div>
                            ))}
                        </div>

                        {/* Status Update */}
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>Update Status</div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {['open', 'investigating', 'contained', 'resolved'].map(s => (
                                    <button key={s} onClick={() => updateStatus(selected._id, s)}
                                        style={{
                                            padding: '0.3rem 0.7rem', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.75rem',
                                            background: selected.status === s ? 'var(--cyan)' : 'transparent',
                                            color: selected.status === s ? 'var(--bg-primary)' : 'var(--text-secondary)'
                                        }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <SOARPanel incident={selected} onAction={load} />
                    </div>
                )}
            </div>
        </motion.div>
    )
}
