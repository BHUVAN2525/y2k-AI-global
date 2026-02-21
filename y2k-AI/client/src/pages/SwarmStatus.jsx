import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

export default function SwarmStatus() {
    const [swarm, setSwarm] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadSwarm()
        const interval = setInterval(loadSwarm, 10000)
        return () => clearInterval(interval)
    }, [])

    const loadSwarm = async () => {
        try {
            const res = await axios.get('/api/agent/swarm')
            setSwarm(res.data)
        } catch (err) {
            console.error('Swarm load error:', err)
        }
        setLoading(false)
    }

    const getAgentIcon = (name) => {
        if (name.includes('Blue')) return '🔵'
        if (name.includes('Red')) return '🔴'
        if (name.includes('Malware')) return '🦠'
        if (name.includes('Threat')) return '📡'
        if (name.includes('Compliance')) return '🛡️'
        return '🤖'
    }

    const getSpecialtyLabel = (specialty) => {
        const labels = {
            soc_defense: 'SOC Defense & Detection',
            offensive_simulation: 'Offensive Simulation',
            malware_analysis: 'Deep Malware Analysis',
            threat_intelligence: 'Threat Intel & IOC',
            compliance: 'Compliance & Hardening'
        }
        return labels[specialty] || specialty
    }

    if (loading) return <div className="swarm-loading">Loading swarm status...</div>
    if (!swarm) return <div className="swarm-error">Could not load swarm status</div>

    return (
        <div className="swarm-container">
            <motion.div
                className="swarm-page"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="swarm-header">
                    <h1>🧠 Multi-Agent Swarm Status</h1>
                    <p className="swarm-subtitle">
                        {swarm.supervisor} v{swarm.version} — {swarm.agents?.length || 0} agents active
                    </p>
                </div>

                {/* Supervisor Card */}
                <div className="swarm-supervisor-card">
                    <div className="supervisor-icon">👁️</div>
                    <div>
                        <h3>Supervisor Agent</h3>
                        <p>Routes queries to the best specialist. Mode: <strong style={{ color: swarm.current_mode === 'blue' ? '#00fff5' : '#ff4757' }}>{swarm.current_mode?.toUpperCase()}</strong></p>
                    </div>
                    <div className="supervisor-stats">
                        <div className="stat-item">
                            <span className="stat-value">{swarm.audit_entries || 0}</span>
                            <span className="stat-label">Audit Events</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{swarm.active_sessions || 0}</span>
                            <span className="stat-label">Sessions</span>
                        </div>
                    </div>
                </div>

                {/* Agent Cards */}
                <div className="swarm-agents-grid">
                    {swarm.agents?.map((agent, i) => (
                        <motion.div
                            key={i}
                            className="swarm-agent-card"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.08 }}
                            whileHover={{ scale: 1.02, y: -4 }}
                        >
                            <div className="agent-card-top">
                                <span className="agent-icon">{getAgentIcon(agent.name)}</span>
                                <span className={`agent-status ${agent.status}`}>● {agent.status}</span>
                            </div>
                            <h3 className="agent-name">{agent.name}</h3>
                            <span className="agent-specialty">{getSpecialtyLabel(agent.specialty)}</span>
                            <div className="agent-pulse">
                                <div className="pulse-dot" />
                                <div className="pulse-ring" />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Swarm Architecture */}
                <div className="swarm-architecture">
                    <h2>🔗 Swarm Architecture</h2>
                    <div className="arch-diagram">
                        <div className="arch-node arch-supervisor">
                            <span>👁️ Supervisor</span>
                        </div>
                        <div className="arch-connections">
                            {swarm.agents?.map((agent, i) => (
                                <div key={i} className="arch-line">
                                    <div className="arch-connector" />
                                    <div className="arch-node arch-agent">
                                        <span>{getAgentIcon(agent.name)} {agent.name.split(' ')[0]}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            <style>{`
                .swarm-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
                .swarm-header { margin-bottom: 32px; }
                .swarm-header h1 { font-size: 1.8rem; color: #00fff5; margin: 0; }
                .swarm-subtitle { color: #888; margin-top: 4px; }

                .swarm-supervisor-card {
                    display: flex; align-items: center; gap: 20px;
                    background: linear-gradient(135deg, rgba(0,255,245,0.05), rgba(124,77,255,0.05));
                    border: 1px solid rgba(0,255,245,0.15); border-radius: 16px;
                    padding: 24px; margin-bottom: 32px;
                }
                .supervisor-icon { font-size: 2.5rem; }
                .swarm-supervisor-card h3 { margin: 0; color: #00fff5; font-size: 1.2rem; }
                .swarm-supervisor-card p { margin: 4px 0 0; color: #aaa; font-size: 0.9rem; }
                .supervisor-stats { margin-left: auto; display: flex; gap: 24px; }
                .stat-item { text-align: center; }
                .stat-value { display: block; font-size: 1.5rem; font-weight: 800; color: #00fff5; }
                .stat-label { font-size: 0.75rem; color: #888; letter-spacing: 0.5px; }

                .swarm-agents-grid {
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 16px; margin-bottom: 40px;
                }

                .swarm-agent-card {
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 14px; padding: 20px; position: relative; overflow: hidden;
                    cursor: default; transition: all 0.3s;
                }
                .swarm-agent-card:hover { border-color: rgba(0,255,245,0.25); }

                .agent-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                .agent-icon { font-size: 1.8rem; }
                .agent-status { font-size: 0.75rem; color: #2ed573; }
                .agent-name { margin: 0; color: #e0e0e0; font-size: 1rem; }
                .agent-specialty {
                    font-size: 0.78rem; color: #888; display: block; margin-top: 4px;
                }

                .agent-pulse {
                    position: absolute; bottom: 12px; right: 12px;
                }
                .pulse-dot {
                    width: 8px; height: 8px; background: #2ed573; border-radius: 50%;
                    position: relative; z-index: 1;
                }
                .pulse-ring {
                    width: 24px; height: 24px; border: 2px solid rgba(46,213,115,0.3);
                    border-radius: 50%; position: absolute; top: -8px; left: -8px;
                    animation: pulse-anim 2s ease-out infinite;
                }
                @keyframes pulse-anim {
                    0% { transform: scale(0.8); opacity: 1; }
                    100% { transform: scale(1.5); opacity: 0; }
                }

                .swarm-architecture {
                    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 16px; padding: 24px;
                }
                .swarm-architecture h2 { color: #e0e0e0; margin: 0 0 20px; font-size: 1.2rem; }

                .arch-diagram { display: flex; flex-direction: column; align-items: center; gap: 20px; }
                .arch-node {
                    padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 0.9rem;
                }
                .arch-supervisor {
                    background: linear-gradient(135deg, rgba(0,255,245,0.15), rgba(124,77,255,0.15));
                    border: 1px solid rgba(0,255,245,0.3); color: #00fff5;
                }
                .arch-agent {
                    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
                    color: #ccc;
                }
                .arch-connections {
                    display: flex; flex-wrap: wrap; gap: 12px; justify-content: center;
                }
                .arch-line { display: flex; flex-direction: column; align-items: center; gap: 8px; }
                .arch-connector {
                    width: 2px; height: 20px;
                    background: linear-gradient(180deg, rgba(0,255,245,0.4), rgba(255,255,255,0.1));
                }

                .swarm-loading, .swarm-error { color: #888; text-align: center; padding: 60px; }
            `}</style>
        </div>
    )
}
