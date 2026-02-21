import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const pageVariants = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

// Simple SVG-based attack graph (no external lib needed)
function AttackGraphSVG({ nodes, edges }) {
    if (!nodes?.length) return null

    const W = 700, H = 380
    const nodeRadius = 28

    // Position nodes in a layered layout
    const types = ['entry', 'pivot', 'target', 'exfil']
    const positioned = nodes.map((n, i) => {
        const typeIdx = types.indexOf(n.type)
        const x = typeIdx === -1 ? 100 + i * 120 : 80 + typeIdx * 180
        const sameType = nodes.filter(nn => nn.type === n.type)
        const posInType = sameType.indexOf(n)
        const y = H / 2 + (posInType - (sameType.length - 1) / 2) * 80
        return { ...n, x, y }
    })

    const nodeMap = Object.fromEntries(positioned.map(n => [n.id, n]))

    const TYPE_COLORS = { entry: '#00d4ff', pivot: '#ff8800', target: '#ff3366', exfil: '#9b59b6' }

    return (
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ fontFamily: 'var(--font-mono)' }}>
            <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#ff3366" />
                </marker>
                {Object.entries(TYPE_COLORS).map(([t, c]) => (
                    <radialGradient key={t} id={`grad-${t}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={c} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={c} stopOpacity={0.1} />
                    </radialGradient>
                ))}
            </defs>

            {/* Edges */}
            {edges?.map((e, i) => {
                const from = nodeMap[e.from], to = nodeMap[e.to]
                if (!from || !to) return null
                const prob = e.success_probability || 0
                const color = prob >= 0.7 ? '#ff3366' : prob >= 0.4 ? '#ff8800' : '#ffcc00'
                return (
                    <g key={i}>
                        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                            stroke={color} strokeWidth={1.5} strokeDasharray={prob < 0.5 ? '5,3' : 'none'}
                            markerEnd="url(#arrow)" opacity={0.7} />
                        <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 6}
                            fill={color} fontSize={9} textAnchor="middle" opacity={0.8}>
                            {e.mitre_id} ({(prob * 100).toFixed(0)}%)
                        </text>
                    </g>
                )
            })}

            {/* Nodes */}
            {positioned.map(n => {
                const color = TYPE_COLORS[n.type] || '#4a5568'
                return (
                    <g key={n.id}>
                        <circle cx={n.x} cy={n.y} r={nodeRadius + 6} fill={`url(#grad-${n.type})`} />
                        <circle cx={n.x} cy={n.y} r={nodeRadius} fill="#0d1628" stroke={color} strokeWidth={2} />
                        <text x={n.x} y={n.y - 4} fill={color} fontSize={10} textAnchor="middle" fontWeight="bold">
                            {n.service?.slice(0, 6) || n.type}
                        </text>
                        <text x={n.x} y={n.y + 10} fill="#8892a4" fontSize={8} textAnchor="middle">
                            {n.port ? `:${n.port}` : ''}
                        </text>
                        <text x={n.x} y={n.y + nodeRadius + 14} fill="#8892a4" fontSize={9} textAnchor="middle">
                            {n.label?.slice(0, 14)}
                        </text>
                    </g>
                )
            })}
        </svg>
    )
}

export default function AttackGraph() {
    const [recons, setRecons] = useState([])
    const [selectedRecon, setSelectedRecon] = useState(null)
    const [attackPath, setAttackPath] = useState(null)
    const [generating, setGenerating] = useState(false)
    const [target, setTarget] = useState('127.0.0.1')

    useEffect(() => {
        axios.get('/api/red/recon').then(r => setRecons(r.data.results || [])).catch(() => { })
    }, [])

    const generate = async () => {
        if (!selectedRecon) {
            // nothing to do until user chooses a scan
            return
        }

        setGenerating(true)
        try {
            const payload = { recon_id: selectedRecon._id, target: selectedRecon.target }
            const r = await axios.post('/api/red/attack-path', payload)
            setAttackPath(r.data)
        } catch { }
        setGenerating(false)
    }

    const RISK_COLOR = { critical: '#ff3366', high: '#ff8800', medium: '#ffcc00', low: '#00ff88' }

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div className="page-title" style={{ marginBottom: 0 }}>🗺️ Attack Graph</div>
            </div>
            <div className="page-subtitle">Visual attack path simulation with MITRE ATT&CK mapping</div>

            {/* Controls */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>From Recon Scan (required)</div>
                        <select className="input" value={selectedRecon?._id || ''} onChange={e => setSelectedRecon(recons.find(r => r._id === e.target.value) || null)}>
                            <option value="">-- select scan result --</option>
                            {recons.map(r => <option key={r._id} value={r._id}>{r.target} ({r.open_ports?.length || 0} ports)</option>)}
                        </select>
                    </div>
                    {!selectedRecon && (
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Target IP/Hostname</div>
                            <input className="input" value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. 10.0.0.15" />
                        </div>
                    )}
                    <button className="btn btn-danger" onClick={generate} disabled={generating || !selectedRecon || (selectedRecon && !(selectedRecon.open_ports || []).length)} style={{ marginTop: '1.4rem' }}>
                        {generating ? '⏳ Generating...' : '⚔️ Generate Attack Path'}
                    </button>
                    {selectedRecon && !(selectedRecon.open_ports || []).length && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                            Selected scan has no open ports; run another scan or add ports manually.
                        </div>
                    )}
                </div>
            </div>

            {attackPath && (
                <>
                    {/* Summary */}
                    <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
                        <div className="stat-card" style={{ borderLeft: `3px solid ${RISK_COLOR[attackPath.overall_risk]}` }}>
                            <div className="stat-label">Overall Risk</div>
                            <div className="stat-value" style={{ color: RISK_COLOR[attackPath.overall_risk], fontSize: '1.5rem' }}>{attackPath.overall_risk?.toUpperCase()}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Attack Steps</div>
                            <div className="stat-value" style={{ color: '#ff8800', fontSize: '1.5rem' }}>{attackPath.attack_chain?.length}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Estimated Time</div>
                            <div className="stat-value" style={{ color: '#ffcc00', fontSize: '1.2rem' }}>{attackPath.estimated_time}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Attack Nodes</div>
                            <div className="stat-value" style={{ color: '#9b59b6', fontSize: '1.5rem' }}>{attackPath.nodes?.length}</div>
                        </div>
                    </div>

                    {/* Graph */}
                    <div className="card attack-graph-container" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                        <div className="section-title">🕸️ Attack Graph Visualization</div>
                        <AttackGraphSVG nodes={attackPath.nodes} edges={attackPath.edges} />
                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                            {[['entry', '#00d4ff', 'Entry Point'], ['pivot', '#ff8800', 'Pivot Node'], ['target', '#ff3366', 'Target'], ['exfil', '#9b59b6', 'Exfiltration']].map(([t, c, l]) => (
                                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                                    {l}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Attack Chain */}
                    <div className="card">
                        <div className="section-title">⛓️ Attack Chain Steps</div>
                        {attackPath.attack_chain?.map((step, i) => (
                            <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,51,102,0.15)', border: '1px solid rgba(255,51,102,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#ff3366', flexShrink: 0 }}>{step.step}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{step.action}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        <span style={{ color: '#9b59b6', fontFamily: 'var(--font-mono)' }}>{step.mitre_id}</span> — {step.technique}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: '0.8rem', color: step.success_probability >= 0.7 ? '#ff3366' : '#ff8800', fontFamily: 'var(--font-mono)' }}>
                                        {(step.success_probability * 100).toFixed(0)}% success
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {!attackPath && !generating && (
                <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
                    <div>Select a recon scan above and click "Generate Attack Path" to view a real attack chain</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Attack graph built from selected recon scan</div>
                </div>
            )}
        </motion.div>
    )
}
