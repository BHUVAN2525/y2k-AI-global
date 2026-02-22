import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import RefreshButton from '../components/RefreshButton'

const PREDICTION_CATEGORIES = [
    { id: 'ddos', label: 'DDoS Attack', icon: '🌊', color: 'var(--danger)' },
    { id: 'brute_force', label: 'Brute Force', icon: '🔓', color: 'var(--warning)' },
    { id: 'ransomware', label: 'Ransomware', icon: '💀', color: 'var(--danger)' },
    { id: 'phishing', label: 'Phishing Campaign', icon: '🎣', color: 'var(--warning)' },
    { id: 'data_exfil', label: 'Data Exfiltration', icon: '📤', color: '#e84393' },
    { id: 'supply_chain', label: 'Supply Chain', icon: '🔗', color: 'var(--primary)' },
]

function generatePredictions() {
    return PREDICTION_CATEGORIES.map(cat => ({
        ...cat,
        probability: parseFloat((Math.random() * 0.7 + 0.1).toFixed(2)),
        confidence: parseFloat((Math.random() * 0.3 + 0.6).toFixed(2)),
        attack_window: `${Math.floor(Math.random() * 48 + 1)} hours`,
        indicators: Math.floor(Math.random() * 12 + 1),
        trend: Math.random() > 0.5 ? 'increasing' : 'stable',
        contributing_factors: [
            'Dark web chatter detected',
            'Similar infrastructure targeted recently',
            'Vulnerability window matches known exploit',
            'Geopolitical tension in sector',
            'Seasonal attack pattern match',
        ].slice(0, Math.floor(Math.random() * 3 + 1)),
    })).sort((a, b) => b.probability - a.probability)
}

function generateTimelinePredictions() {
    const hours = []
    for (let i = 0; i < 24; i++) {
        hours.push({
            hour: i,
            threat_level: Math.random() * 100,
            predicted_attacks: Math.floor(Math.random() * 8),
        })
    }
    return hours
}

export default function AttackPrediction() {
    const [predictions, setPredictions] = useState(generatePredictions())
    const [timeline, setTimeline] = useState(generateTimelinePredictions())
    const [loading, setLoading] = useState(false)
    const [selectedPrediction, setSelectedPrediction] = useState(null)
    const canvasRef = useRef(null)

    useEffect(() => {
        drawTimeline()
    }, [timeline])

    const refreshPredictions = async () => {
        setLoading(true)
        await new Promise(r => setTimeout(r, 1500))
        setPredictions(generatePredictions())
        setTimeline(generateTimelinePredictions())
        setLoading(false)
    }

    const drawTimeline = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const w = canvas.width = canvas.parentElement.offsetWidth
        const h = canvas.height = 120
        ctx.clearRect(0, 0, w, h)

        const barW = w / 24 - 2
        timeline.forEach((t, i) => {
            const x = i * (barW + 2) + 1
            const barH = (t.threat_level / 100) * (h - 20)
            const color = t.threat_level > 70 ? 'var(--danger)' : t.threat_level > 40 ? 'var(--warning)' : 'var(--success)'

            ctx.fillStyle = color + '40'
            ctx.fillRect(x, h - 10 - barH, barW, barH)
            ctx.fillStyle = color
            ctx.fillRect(x, h - 10 - barH, barW, 3)

            if (i % 4 === 0) {
                ctx.fillStyle = '#666'
                ctx.font = '10px monospace'
                ctx.fillText(`${i}:00`, x, h - 1)
            }
        })
    }

    const overallThreat = Math.round(predictions.reduce((s, p) => s + p.probability * 100, 0) / predictions.length)

    return (
        <div className="page-container">
            <motion.div className="ap-page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="ap-header">
                    <div>
                        <h1>🔮 Attack Prediction Engine</h1>
                        <p className="ap-subtitle">AI-powered threat forecasting for the next 48 hours</p>
                    </div>
                    <RefreshButton loading={loading} onClick={refreshPredictions} title="Refresh Predictions" />
                </div>

                {/* Threat Level */}
                <div className="ap-threat-overview">
                    <div className="ap-threat-gauge">
                        <svg viewBox="0 0 120 60" width="160" height="80">
                            <path d="M10,55 A50,50 0 0,1 110,55" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
                            <path d="M10,55 A50,50 0 0,1 110,55" fill="none"
                                stroke={overallThreat > 60 ? 'var(--danger)' : overallThreat > 35 ? 'var(--warning)' : 'var(--success)'}
                                strokeWidth="10" strokeLinecap="round"
                                strokeDasharray={`${overallThreat * 1.57} 157`}
                            />
                            <text x="60" y="50" textAnchor="middle" fill="#e0e0e0" fontSize="22" fontWeight="800">{overallThreat}%</text>
                            <text x="60" y="60" textAnchor="middle" fill="#888" fontSize="8">THREAT LEVEL</text>
                        </svg>
                    </div>
                    <div className="ap-threat-summary">
                        <h3>Next 48h Forecast</h3>
                        <p>Top threat: <strong style={{ color: predictions[0]?.color }}>{predictions[0]?.label}</strong> at {(predictions[0]?.probability * 100).toFixed(0)}% probability</p>
                        <p>Active indicators: <strong>{predictions.reduce((s, p) => s + p.indicators, 0)}</strong></p>
                    </div>
                </div>

                {/* Timeline */}
                <div className="ap-timeline-section">
                    <h3>📈 24h Threat Timeline</h3>
                    <div className="ap-timeline-canvas">
                        <canvas ref={canvasRef} />
                    </div>
                </div>

                {/* Prediction Cards */}
                <div className="ap-predictions-grid">
                    {predictions.map((p, i) => (
                        <motion.div key={p.id}
                            className={`ap-pred-card ${selectedPrediction === p.id ? 'expanded' : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            onClick={() => setSelectedPrediction(selectedPrediction === p.id ? null : p.id)}
                        >
                            <div className="ap-pred-top">
                                <span className="ap-pred-icon">{p.icon}</span>
                                <span className="ap-trend" style={{ color: p.trend === 'increasing' ? 'var(--danger)' : 'var(--success)' }}>
                                    {p.trend === 'increasing' ? '📈' : '➡️'} {p.trend}
                                </span>
                            </div>
                            <h4>{p.label}</h4>
                            <div className="ap-pred-prob">
                                <div className="ap-prob-bar">
                                    <motion.div className="ap-prob-fill"
                                        animate={{ width: `${p.probability * 100}%` }}
                                        style={{ background: p.color }}
                                    />
                                </div>
                                <span style={{ color: p.color }}>{(p.probability * 100).toFixed(0)}%</span>
                            </div>
                            <div className="ap-pred-meta">
                                <span>⏱ {p.attack_window}</span>
                                <span>🎯 {p.indicators} indicators</span>
                                <span>🤖 {(p.confidence * 100).toFixed(0)}% confidence</span>
                            </div>

                            {selectedPrediction === p.id && (
                                <motion.div className="ap-pred-detail" initial={{ height: 0 }} animate={{ height: 'auto' }}>
                                    <h5>Contributing Factors:</h5>
                                    {p.contributing_factors.map((f, j) => (
                                        <div key={j} className="ap-factor">• {f}</div>
                                    ))}
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            <style>{`
                .ap-page { max-width: 1200px; margin: 0 auto; padding: 24px; }
                .ap-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
                .ap-header h1 { font-size: 1.8rem; color: var(--info); margin: 0; }
                .ap-subtitle { color: #888; margin-top: 4px; }

                .ap-threat-overview {
                    display: flex; align-items: center; gap: 24px; padding: 24px;
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 16px; margin-bottom: 24px;
                }
                .ap-threat-summary h3 { margin: 0; color: #e0e0e0; }
                .ap-threat-summary p { margin: 4px 0; color: #888; font-size: 0.9rem; }

                .ap-timeline-section { margin-bottom: 24px; }
                .ap-timeline-section h3 { color: #e0e0e0; margin: 0 0 12px; }
                .ap-timeline-canvas {
                    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 12px; padding: 12px;
                }

                .ap-predictions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
                .ap-pred-card {
                    padding: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 14px; cursor: pointer; transition: all 0.3s;
                }
                .ap-pred-card:hover { border-color: rgba(0,255,245,0.2); transform: translateY(-2px); }
                .ap-pred-card.expanded { border-color: rgba(0,255,245,0.3); }

                .ap-pred-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                .ap-pred-icon { font-size: 1.5rem; }
                .ap-trend { font-size: 0.8rem; }
                .ap-pred-card h4 { margin: 0 0 10px; color: #e0e0e0; }

                .ap-pred-prob { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
                .ap-prob-bar { flex: 1; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
                .ap-prob-fill { height: 100%; border-radius: 4px; }
                .ap-pred-prob span { font-weight: 800; font-size: 1.1rem; }

                .ap-pred-meta { display: flex; flex-wrap: wrap; gap: 8px; }
                .ap-pred-meta span { font-size: 0.78rem; color: #888; background: rgba(255,255,255,0.04); padding: 3px 8px; border-radius: 4px; }

                .ap-pred-detail { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); overflow: hidden; }
                .ap-pred-detail h5 { color: #aaa; margin: 0 0 6px; font-size: 0.85rem; }
                .ap-factor { color: #999; font-size: 0.85rem; padding: 2px 0; }
            `}</style>
        </div>
    )
}
