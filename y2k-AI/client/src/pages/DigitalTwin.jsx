import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

// infrastructure data will be fetched from the server
// this page no longer uses hardcoded demo values

export default function DigitalTwin() {
    const [infra, setInfra] = useState([])
    const [selectedNode, setSelectedNode] = useState(null)
    const [simulationRunning, setSimulationRunning] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const loadInfra = async () => {
            try {
                const r = await axios.get('/api/digital-twin');
                setInfra(r.data.infrastructure || []);
            } catch (err) {
                setError('Unable to load infrastructure data');
            }
        };
        loadInfra();

        // Simulate live telemetry refresh every 5s
        const interval = setInterval(loadInfra, 5000);
        return () => clearInterval(interval);
    }, [])

    const runSimulation = async () => {
        setSimulationRunning(true);
        // POST to a simulation endpoint could be added here later
        setTimeout(() => setSimulationRunning(false), 2000);
    }

    const getStatusColor = (status) => {
        if (status === 'critical') return 'var(--danger)'
        if (status === 'warning') return 'var(--warning)'
        return 'var(--success)'
    }

    const getTypeIcon = (type) => {
        const icons = { firewall: '🔥', server: '🖥️', database: '💾', loadbalancer: '⚖️', cache: '⚡', security: '🛡️' }
        return icons[type] || '📦'
    }

    const overallRisk = infra.length ? Math.round(infra.reduce((s, n) => s + n.risk, 0) / infra.length) : 0

    return (
        <div className="page-container">
            <motion.div className="dt-page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="dt-header">
                    <div>
                        <h1>🏗️ AI Digital Twin</h1>
                        <p className="dt-subtitle">Real-time infrastructure mirror with attack simulation</p>
                    </div>
                    <div className="dt-header-actions">
                        <button className="dt-sim-btn" onClick={runSimulation} disabled={simulationRunning || !infra.length}>
                            {simulationRunning ? '⏳ Simulating...' : '⚔️ Run Attack Simulation'}
                        </button>
                    </div>
                    {error && <div style={{ color: 'var(--danger)', marginTop: '0.5rem', fontSize: '0.85rem' }}>{error}</div>}
                </div>

                {/* Overall Health */}
                <div className="dt-health-bar">
                    <div className="dt-health-label">
                        <span>Overall Infrastructure Risk</span>
                        <strong style={{ color: overallRisk > 50 ? 'var(--danger)' : overallRisk > 30 ? 'var(--warning)' : 'var(--success)' }}>
                            {overallRisk}%
                        </strong>
                    </div>
                    <div className="dt-health-track">
                        <motion.div className="dt-health-fill"
                            animate={{ width: `${overallRisk}%` }}
                            style={{ background: overallRisk > 50 ? 'var(--danger)' : overallRisk > 30 ? 'var(--warning)' : 'var(--success)' }}
                        />
                    </div>
                </div>

                {/* Infrastructure Grid */}
                {infra.length ? (
                    <div className="dt-grid">
                        {infra.map((node, i) => (
                            <motion.div key={node.id}
                                className={`dt-node ${node.status} ${selectedNode === node.id ? 'selected' : ''}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                                whileHover={{ scale: 1.02 }}
                            >
                                <div className="dt-node-top">
                                    <span className="dt-node-icon">{getTypeIcon(node.type)}</span>
                                    <span className="dt-status-dot" style={{ background: getStatusColor(node.status) }} />
                                </div>
                                <h4>{node.name}</h4>
                                <span className="dt-node-ip">{node.ip}</span>
                                <div className="dt-node-metrics">
                                    <div className="dt-metric">
                                        <span>CPU</span>
                                        <div className="dt-metric-bar">
                                            <motion.div className="dt-metric-fill" animate={{ width: `${node.cpu}%` }}
                                                style={{ background: node.cpu > 80 ? 'var(--danger)' : node.cpu > 60 ? 'var(--warning)' : 'var(--success)' }} />
                                        </div>
                                        <span>{Math.round(node.cpu)}%</span>
                                    </div>
                                    <div className="dt-metric">
                                        <span>MEM</span>
                                        <div className="dt-metric-bar">
                                            <motion.div className="dt-metric-fill" animate={{ width: `${node.mem}%` }}
                                                style={{ background: node.mem > 80 ? 'var(--danger)' : node.mem > 60 ? 'var(--warning)' : 'var(--success)' }} />
                                        </div>
                                        <span>{Math.round(node.mem)}%</span>
                                    </div>
                                </div>
                                <div className="dt-node-footer">
                                    <span>🔌 {node.connections}</span>
                                    <span style={{ color: node.risk > 50 ? 'var(--danger)' : node.risk > 30 ? 'var(--warning)' : 'var(--success)' }}>
                                        Risk: {node.risk}%
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>) : (
                    <div style={{ color: '#888', padding: '2rem', textAlign: 'center' }}>
                        {error ? error : 'No infrastructure data available. Configure the backend to provide real system status.'}
                    </div>
                )}

            </motion.div>

            <style>{`
                .dt-page { max-width: 1200px; margin: 0 auto; padding: 24px; }
                .dt-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
                .dt-header h1 { font-size: 1.8rem; color: var(--info); margin: 0; }
                .dt-subtitle { color: #888; margin-top: 4px; }
                .dt-header-actions { display: flex; gap: 8px; }
                .dt-sim-btn {
                    padding: 10px 22px; background: var(--bg-secondary), #ff6b81);
                    border: none; border-radius: 10px; color: #fff; font-weight: 700;
                    cursor: pointer; transition: all 0.3s;
                }
                .dt-sim-btn:hover { box-shadow: 0 4px 20px rgba(255,71,87,0.3); }
                .dt-sim-btn:disabled { opacity: 0.5; }
                .dt-toggle-btn {
                    padding: 10px 18px; border: 1px solid rgba(255,255,255,0.15); background: transparent;
                    border-radius: 10px; color: #999; cursor: pointer; transition: all 0.2s;
                }
                .dt-toggle-btn.active { background: rgba(0,255,245,0.1); border-color: rgba(0,255,245,0.3); color: var(--info); }

                .dt-health-bar { margin-bottom: 24px; }
                .dt-health-label { display: flex; justify-content: space-between; margin-bottom: 6px; }
                .dt-health-label span { color: #888; font-size: 0.9rem; }
                .dt-health-track { height: 10px; background: rgba(255,255,255,0.06); border-radius: 5px; overflow: hidden; }
                .dt-health-fill { height: 100%; border-radius: 5px; transition: all 0.5s; }

                .dt-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 14px; margin-bottom: 24px; }
                .dt-node {
                    padding: 18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 14px; cursor: pointer; transition: all 0.3s;
                }
                .dt-node:hover { border-color: rgba(0,255,245,0.2); }
                .dt-node.critical { border-left: 3px solid var(--danger); }
                .dt-node.warning { border-left: 3px solid var(--warning); }
                .dt-node.healthy { border-left: 3px solid var(--success); }
                .dt-node.selected { border-color: var(--info); box-shadow: 0 0 15px rgba(0,255,245,0.15); }

                .dt-node-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                .dt-node-icon { font-size: 1.5rem; }
                .dt-status-dot { width: 10px; height: 10px; border-radius: 50%; }
                .dt-node h4 { margin: 0 0 4px; color: #e0e0e0; font-size: 0.95rem; }
                .dt-node-ip { font-size: 0.78rem; color: #888; font-family: monospace; }

                .dt-node-metrics { margin-top: 10px; }
                .dt-metric { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
                .dt-metric span { font-size: 0.72rem; color: #888; min-width: 28px; }
                .dt-metric span:last-child { text-align: right; }
                .dt-metric-bar { flex: 1; height: 5px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
                .dt-metric-fill { height: 100%; border-radius: 3px; }

                .dt-node-footer { display: flex; justify-content: space-between; margin-top: 10px; font-size: 0.8rem; color: #888; }

                .dt-attack-paths {
                    background: rgba(255,71,87,0.04); border: 1px solid rgba(255,71,87,0.15);
                    border-radius: 16px; padding: 24px;
                }
                .dt-attack-paths h3 { color: #e0e0e0; margin: 0 0 16px; }
                .dt-path { padding: 14px; background: rgba(0,0,0,0.2); border-radius: 10px; margin-bottom: 8px; }
                .dt-path-nodes { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
                .dt-path-from, .dt-path-to { color: #ddd; font-weight: 600; font-size: 0.9rem; }
                .dt-path-arrow { color: var(--danger); font-size: 1.2rem; }
                .dt-path-details { display: flex; justify-content: space-between; }
                .dt-path-method { color: #888; font-size: 0.85rem; }
                .dt-path-prob { font-weight: 700; font-size: 0.85rem; }
            `}</style>
        </div>
    )
}
