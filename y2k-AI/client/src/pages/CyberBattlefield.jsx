import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const NODES = [
    { id: 'internet', label: 'Internet', x: 400, y: 30, type: 'cloud', threat: 0.9 },
    { id: 'firewall', label: 'Firewall', x: 400, y: 120, type: 'firewall', threat: 0.3 },
    { id: 'dmz', label: 'DMZ', x: 250, y: 200, type: 'zone', threat: 0.5 },
    { id: 'internal', label: 'Internal', x: 550, y: 200, type: 'zone', threat: 0.2 },
    { id: 'web1', label: 'Web-01', x: 150, y: 300, type: 'server', threat: 0.7 },
    { id: 'web2', label: 'Web-02', x: 350, y: 300, type: 'server', threat: 0.4 },
    { id: 'api', label: 'API GW', x: 500, y: 300, type: 'server', threat: 0.3 },
    { id: 'auth', label: 'Auth', x: 650, y: 300, type: 'server', threat: 0.6 },
    { id: 'db1', label: 'DB Primary', x: 350, y: 420, type: 'database', threat: 0.8 },
    { id: 'db2', label: 'DB Replica', x: 550, y: 420, type: 'database', threat: 0.1 },
    { id: 'logs', label: 'SIEM', x: 700, y: 420, type: 'security', threat: 0.05 },
]

const CONNECTIONS = [
    { from: 'internet', to: 'firewall' },
    { from: 'firewall', to: 'dmz' },
    { from: 'firewall', to: 'internal' },
    { from: 'dmz', to: 'web1' },
    { from: 'dmz', to: 'web2' },
    { from: 'internal', to: 'api' },
    { from: 'internal', to: 'auth' },
    { from: 'web1', to: 'db1' },
    { from: 'web2', to: 'db1' },
    { from: 'api', to: 'db1' },
    { from: 'api', to: 'db2' },
    { from: 'auth', to: 'db1' },
    { from: 'web1', to: 'logs' },
    { from: 'auth', to: 'logs' },
]

const ATTACK_EVENTS = [
    { time: '14:23:01', source: 'internet', target: 'firewall', type: 'Port Scan', severity: 'medium' },
    { time: '14:23:15', source: 'internet', target: 'web1', type: 'SQL Injection', severity: 'critical' },
    { time: '14:23:22', source: 'web1', target: 'db1', type: 'Data Exfil', severity: 'critical' },
    { time: '14:23:30', source: 'internet', target: 'auth', type: 'Brute Force', severity: 'high' },
    { time: '14:23:45', source: 'auth', target: 'db1', type: 'Priv Escalation', severity: 'critical' },
]

export default function CyberBattlefield() {
    const canvasRef = useRef(null)
    const [activeAttacks, setActiveAttacks] = useState([])
    const [selectedNode, setSelectedNode] = useState(null)
    const [isLive, setIsLive] = useState(false)
    const animRef = useRef(null)
    const particlesRef = useRef([])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const scale = window.devicePixelRatio || 1
        canvas.width = 820 * scale
        canvas.height = 500 * scale
        ctx.scale(scale, scale)
        canvas.style.width = '820px'
        canvas.style.height = '500px'

        const draw = () => {
            ctx.clearRect(0, 0, 820, 500)

            // Draw connections
            CONNECTIONS.forEach(conn => {
                const from = NODES.find(n => n.id === conn.from)
                const to = NODES.find(n => n.id === conn.to)
                if (!from || !to) return
                ctx.beginPath()
                ctx.moveTo(from.x, from.y)
                ctx.lineTo(to.x, to.y)
                ctx.strokeStyle = 'rgba(255,255,255,0.08)'
                ctx.lineWidth = 1.5
                ctx.stroke()
            })

            // Draw attack particles
            particlesRef.current = particlesRef.current.filter(p => p.progress < 1)
            particlesRef.current.forEach(p => {
                p.progress += 0.015
                const from = NODES.find(n => n.id === p.from)
                const to = NODES.find(n => n.id === p.to)
                if (!from || !to) return
                const x = from.x + (to.x - from.x) * p.progress
                const y = from.y + (to.y - from.y) * p.progress

                ctx.beginPath()
                ctx.arc(x, y, 4, 0, Math.PI * 2)
                ctx.fillStyle = p.color
                ctx.fill()
                ctx.beginPath()
                ctx.arc(x, y, 8, 0, Math.PI * 2)
                ctx.fillStyle = p.color + '30'
                ctx.fill()
            })

            // Draw nodes
            NODES.forEach(node => {
                const r = node.type === 'zone' ? 30 : 22
                // Glow
                const gradient = ctx.createRadialGradient(node.x, node.y, r * 0.5, node.x, node.y, r * 1.5)
                const threatColor = node.threat > 0.7 ? 'var(--danger)' : node.threat > 0.4 ? 'var(--warning)' : 'var(--success)'
                gradient.addColorStop(0, threatColor + '30')
                gradient.addColorStop(1, 'transparent')
                ctx.fillStyle = gradient
                ctx.fillRect(node.x - r * 1.5, node.y - r * 1.5, r * 3, r * 3)

                // Node circle
                ctx.beginPath()
                ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
                ctx.fillStyle = selectedNode === node.id ? 'rgba(0,255,245,0.2)' : 'rgba(15,15,26,0.9)'
                ctx.fill()
                ctx.strokeStyle = selectedNode === node.id ? 'var(--info)' : threatColor + '80'
                ctx.lineWidth = 2
                ctx.stroke()

                // Label
                ctx.fillStyle = '#ccc'
                ctx.font = '11px Inter, sans-serif'
                ctx.textAlign = 'center'
                ctx.fillText(node.label, node.x, node.y + r + 16)

                // Icon
                const icons = { cloud: '☁️', firewall: '🔥', zone: '🔲', server: '🖥️', database: '💾', security: '🛡️' }
                ctx.font = `${r * 0.8}px serif`
                ctx.fillText(icons[node.type] || '📦', node.x, node.y + 5)
            })

            animRef.current = requestAnimationFrame(draw)
        }

        draw()
        return () => cancelAnimationFrame(animRef.current)
    }, [selectedNode])

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get('/api/battles');
                if (res.data && res.data.length > 0) {
                    // Map historic rounds to battle events
                    const historicEvents = res.data.flatMap(battle =>
                        battle.rounds.map(r => ({
                            ...r,
                            time: new Date(battle.timestamp).toLocaleTimeString(),
                            id: `${battle._id}-${r.round}`
                        }))
                    ).slice(0, 20);
                    setActiveAttacks(historicEvents);
                }
            } catch (err) {
                console.error('Failed to fetch battle history', err);
            }
        };
        fetchHistory();
    }, []);

    useEffect(() => {
        if (!isLive) return
        const interval = setInterval(() => {
            const event = ATTACK_EVENTS[Math.floor(Math.random() * ATTACK_EVENTS.length)]
            particlesRef.current.push({
                from: event.source,
                to: event.target,
                progress: 0,
                color: event.severity === 'critical' ? 'var(--danger)' : event.severity === 'high' ? 'var(--warning)' : '#3742fa',
            })
            setActiveAttacks(prev => [{ ...event, id: Date.now() }, ...prev].slice(0, 20))
        }, 3000) // Slower randomized feed when live
        return () => clearInterval(interval)
    }, [isLive])

    const handleCanvasClick = (e) => {
        const rect = canvasRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const clicked = NODES.find(n => Math.hypot(n.x - x, n.y - y) < 25)
        setSelectedNode(clicked ? clicked.id : null)
    }

    const getSevColor = (sev) => {
        if (sev === 'critical') return 'var(--danger)'
        if (sev === 'high') return 'var(--warning)'
        return '#3742fa'
    }

    return (
        <div className="page-container">
            <motion.div className="cb-page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="cb-header">
                    <div>
                        <h1>⚔️ 3D Cyber Battlefield</h1>
                        <p className="cb-subtitle">Real-time network topology & attack visualization</p>
                    </div>
                    <button className={`cb-live-btn ${isLive ? 'active' : ''}`} onClick={() => setIsLive(!isLive)}>
                        {isLive ? '🔴 LIVE' : '▶️ Start Live Feed'}
                    </button>
                </div>

                <div className="cb-layout">
                    <div className="cb-canvas-container">
                        <canvas ref={canvasRef} onClick={handleCanvasClick} style={{ cursor: 'pointer' }} />
                    </div>

                    <div className="cb-sidebar">
                        <h3>⚡ Live Events</h3>
                        <div className="cb-events">
                            {activeAttacks.length === 0 ? (
                                <div className="cb-empty">Start live feed to see attacks</div>
                            ) : activeAttacks.map((evt, i) => (
                                <motion.div key={evt.id} className="cb-event"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                >
                                    <div className="cb-evt-header">
                                        <span className="cb-evt-time">{evt.time}</span>
                                        <span className="cb-evt-sev" style={{ color: getSevColor(evt.severity) }}>{evt.severity}</span>
                                    </div>
                                    <div className="cb-evt-type">{evt.type}</div>
                                    <div className="cb-evt-path">{evt.source} → {evt.target}</div>
                                </motion.div>
                            ))}
                        </div>

                        {selectedNode && (
                            <div className="cb-node-info">
                                <h4>Node Details</h4>
                                {(() => {
                                    const node = NODES.find(n => n.id === selectedNode)
                                    if (!node) return null
                                    return (
                                        <>
                                            <div className="cb-info-row"><span>Name</span><strong>{node.label}</strong></div>
                                            <div className="cb-info-row"><span>Type</span><strong>{node.type}</strong></div>
                                            <div className="cb-info-row"><span>Threat</span>
                                                <strong style={{ color: node.threat > 0.7 ? 'var(--danger)' : node.threat > 0.4 ? 'var(--warning)' : 'var(--success)' }}>
                                                    {(node.threat * 100).toFixed(0)}%
                                                </strong>
                                            </div>
                                        </>
                                    )
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            <style>{`
                .cb-page { max-width: 1300px; margin: 0 auto; padding: 24px; }
                .cb-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
                .cb-header h1 { font-size: 1.8rem; color: var(--info); margin: 0; }
                .cb-subtitle { color: #888; margin-top: 4px; }
                .cb-live-btn {
                    padding: 10px 22px; border: 1px solid rgba(255,71,87,0.3); background: rgba(255,71,87,0.08);
                    color: var(--danger); border-radius: 10px; cursor: pointer; font-weight: 700; transition: all 0.3s;
                }
                .cb-live-btn.active {
                    background: rgba(255,71,87,0.2); border-color: var(--danger);
                    animation: cb-pulse 1.5s ease-in-out infinite;
                }
                @keyframes cb-pulse { 0%, 100% { box-shadow: 0 0 0 rgba(255,71,87,0); } 50% { box-shadow: 0 0 20px rgba(255,71,87,0.3); } }

                .cb-layout { display: flex; gap: 20px; }
                .cb-canvas-container {
                    flex: 1; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 16px; padding: 12px; overflow: hidden;
                }

                .cb-sidebar { width: 280px; display: flex; flex-direction: column; gap: 16px; }
                .cb-sidebar h3 { color: #e0e0e0; margin: 0 0 8px; font-size: 1rem; }

                .cb-events {
                    max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;
                    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 12px; padding: 12px;
                }
                .cb-event {
                    padding: 8px; background: rgba(0,0,0,0.2); border-radius: 8px;
                    border-left: 2px solid rgba(255,71,87,0.3);
                }
                .cb-evt-header { display: flex; justify-content: space-between; margin-bottom: 2px; }
                .cb-evt-time { font-size: 0.75rem; color: #888; font-family: monospace; }
                .cb-evt-sev { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
                .cb-evt-type { color: #ddd; font-size: 0.85rem; font-weight: 600; }
                .cb-evt-path { font-size: 0.78rem; color: #888; }

                .cb-node-info {
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(0,255,245,0.15);
                    border-radius: 12px; padding: 16px;
                }
                .cb-node-info h4 { margin: 0 0 10px; color: var(--info); font-size: 0.95rem; }
                .cb-info-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 0.85rem; }
                .cb-info-row span { color: #888; }
                .cb-info-row strong { color: #ddd; }

                .cb-empty { color: #666; font-size: 0.85rem; text-align: center; padding: 20px; }
            `}</style>
        </div>
    )
}
