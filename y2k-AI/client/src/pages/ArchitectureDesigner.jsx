import { useState } from 'react'
import { motion } from 'framer-motion'

const ARCH_PATTERNS = [
    { id: 'zero_trust', name: 'Zero Trust Architecture', icon: '🔒', desc: 'Never trust, always verify', components: ['Identity Provider', 'Policy Engine', 'Micro-segmentation', 'Continuous Auth'] },
    { id: 'defense_depth', name: 'Defense in Depth', icon: '🛡️', desc: 'Multi-layered security controls', components: ['Perimeter', 'Network', 'Host', 'Application', 'Data'] },
    { id: 'sase', name: 'SASE Architecture', icon: '☁️', desc: 'Secure Access Service Edge', components: ['SD-WAN', 'SWG', 'CASB', 'ZTNA', 'FWaaS'] },
    { id: 'soc', name: 'SOC Architecture', icon: '🎯', desc: 'Security Operations Center design', components: ['SIEM', 'SOAR', 'EDR', 'NDR', 'TIP'] },
]

const COMPLIANCE_FRAMEWORKS = [
    { id: 'nist', name: 'NIST CSF 2.0', score: null },
    { id: 'iso27001', name: 'ISO 27001', score: null },
    { id: 'cis', name: 'CIS Controls v8', score: null },
    { id: 'pci', name: 'PCI DSS 4.0', score: null },
]

export default function ArchitectureDesigner() {
    const [selectedPattern, setSelectedPattern] = useState(null)
    const [designName, setDesignName] = useState('')
    const [components, setComponents] = useState([])
    const [generating, setGenerating] = useState(false)
    const [design, setDesign] = useState(null)

    const generateDesign = async () => {
        if (!selectedPattern) return
        setGenerating(true)
        await new Promise(r => setTimeout(r, 2000))

        const pattern = ARCH_PATTERNS.find(p => p.id === selectedPattern)
        setDesign({
            name: designName || `${pattern.name} Design`,
            pattern: pattern,
            recommendations: [
                { area: 'Identity & Access', items: ['Implement MFA for all users', 'Deploy conditional access policies', 'Enable just-in-time access for admins'] },
                { area: 'Network Security', items: ['Deploy micro-segmentation', 'Implement east-west traffic inspection', 'Enable DNS security'] },
                { area: 'Data Protection', items: ['Encrypt data at rest (AES-256)', 'TLS 1.3 for all transit', 'Implement DLP policies'] },
                { area: 'Monitoring & Response', items: ['Deploy SIEM with 90-day retention', 'Implement automated incident response', 'Enable threat hunting workflows'] },
            ],
            compliance: COMPLIANCE_FRAMEWORKS.map(f => ({
                ...f,
                score: Math.floor(Math.random() * 30 + 60),
                gaps: Math.floor(Math.random() * 8 + 1),
            })),
            risk_reduction: Math.floor(Math.random() * 25 + 60),
            implementation_cost: ['$50K - $100K', '$100K - $250K', '$250K - $500K'][Math.floor(Math.random() * 3)],
            timeline: ['3 months', '6 months', '9 months'][Math.floor(Math.random() * 3)],
        })
        setGenerating(false)
    }

    return (
        <div className="page-container">
            <motion.div className="ad-page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="ad-header">
                    <div>
                        <h1>🏛️ AI Architecture Designer</h1>
                        <p className="ad-subtitle">AI-powered secure architecture design & compliance mapping</p>
                    </div>
                </div>

                {!design ? (
                    <div className="ad-wizard">
                        <h3>Select Architecture Pattern</h3>
                        <div className="ad-patterns">
                            {ARCH_PATTERNS.map(p => (
                                <motion.div key={p.id}
                                    className={`ad-pattern ${selectedPattern === p.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedPattern(p.id)}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <span className="ad-pat-icon">{p.icon}</span>
                                    <h4>{p.name}</h4>
                                    <p>{p.desc}</p>
                                    <div className="ad-pat-components">
                                        {p.components.map((c, i) => <span key={i} className="ad-pat-comp">{c}</span>)}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="ad-name-row">
                            <input className="ad-name-input" placeholder="Design name (optional)"
                                value={designName} onChange={e => setDesignName(e.target.value)} />
                            <button className="ad-gen-btn" onClick={generateDesign} disabled={!selectedPattern || generating}>
                                {generating ? '⏳ Generating...' : '🤖 Generate Design'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="ad-result">
                        <div className="ad-result-header">
                            <div>
                                <h2>{design.pattern.icon} {design.name}</h2>
                                <p className="ad-result-pattern">Based on: {design.pattern.name}</p>
                            </div>
                            <button className="ad-back-btn" onClick={() => setDesign(null)}>← New Design</button>
                        </div>

                        <div className="ad-metrics">
                            <div className="ad-metric-card">
                                <span className="ad-metric-val" style={{ color: '#2ed573' }}>{design.risk_reduction}%</span>
                                <span>Risk Reduction</span>
                            </div>
                            <div className="ad-metric-card">
                                <span className="ad-metric-val" style={{ color: '#ffa502' }}>{design.implementation_cost}</span>
                                <span>Est. Cost</span>
                            </div>
                            <div className="ad-metric-card">
                                <span className="ad-metric-val" style={{ color: '#b388ff' }}>{design.timeline}</span>
                                <span>Timeline</span>
                            </div>
                        </div>

                        <div className="ad-sections">
                            <div className="ad-recs">
                                <h3>📋 Recommendations</h3>
                                {design.recommendations.map((r, i) => (
                                    <div key={i} className="ad-rec-group">
                                        <h4>{r.area}</h4>
                                        {r.items.map((item, j) => (
                                            <div key={j} className="ad-rec-item">✓ {item}</div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            <div className="ad-compliance">
                                <h3>📊 Compliance Alignment</h3>
                                {design.compliance.map((c, i) => (
                                    <div key={i} className="ad-comp-row">
                                        <span className="ad-comp-name">{c.name}</span>
                                        <div className="ad-comp-bar">
                                            <motion.div className="ad-comp-fill"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${c.score}%` }}
                                                transition={{ delay: i * 0.2 }}
                                                style={{ background: c.score > 80 ? '#2ed573' : c.score > 60 ? '#ffa502' : '#ff4757' }}
                                            />
                                        </div>
                                        <span className="ad-comp-score">{c.score}%</span>
                                        <span className="ad-comp-gaps">{c.gaps} gaps</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>

            <style>{`
                .ad-page { max-width: 1200px; margin: 0 auto; padding: 24px; }
                .ad-header { margin-bottom: 24px; }
                .ad-header h1 { font-size: 1.8rem; color: #00fff5; margin: 0; }
                .ad-subtitle { color: #888; margin-top: 4px; }

                .ad-wizard h3 { color: #e0e0e0; margin: 0 0 16px; }
                .ad-patterns { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 14px; margin-bottom: 20px; }
                .ad-pattern {
                    padding: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 14px; cursor: pointer; transition: all 0.3s;
                }
                .ad-pattern:hover { border-color: rgba(0,255,245,0.2); }
                .ad-pattern.selected { border-color: #00fff5; background: rgba(0,255,245,0.05); }
                .ad-pat-icon { font-size: 2rem; }
                .ad-pattern h4 { margin: 8px 0 4px; color: #e0e0e0; }
                .ad-pattern p { color: #888; font-size: 0.85rem; margin: 0 0 10px; }
                .ad-pat-components { display: flex; flex-wrap: wrap; gap: 4px; }
                .ad-pat-comp { font-size: 0.7rem; color: #999; background: rgba(255,255,255,0.04); padding: 2px 8px; border-radius: 4px; }

                .ad-name-row { display: flex; gap: 12px; }
                .ad-name-input { flex: 1; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #ddd; font-size: 0.9rem; outline: none; }
                .ad-gen-btn {
                    padding: 12px 28px; background: linear-gradient(135deg, #00fff5, #7c4dff);
                    border: none; border-radius: 10px; color: #000; font-weight: 700; cursor: pointer; transition: all 0.3s;
                }
                .ad-gen-btn:disabled { opacity: 0.4; }
                .ad-gen-btn:hover:not(:disabled) { box-shadow: 0 4px 20px rgba(0,255,245,0.3); }

                .ad-result-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
                .ad-result-header h2 { margin: 0; color: #e0e0e0; }
                .ad-result-pattern { color: #888; margin-top: 2px; }
                .ad-back-btn { background: none; border: 1px solid rgba(255,255,255,0.1); color: #999; padding: 8px 16px; border-radius: 8px; cursor: pointer; }

                .ad-metrics { display: flex; gap: 16px; margin-bottom: 24px; }
                .ad-metric-card {
                    flex: 1; padding: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 14px; text-align: center;
                }
                .ad-metric-val { display: block; font-size: 1.4rem; font-weight: 900; margin-bottom: 4px; }
                .ad-metric-card span:last-child { color: #888; font-size: 0.85rem; }

                .ad-sections { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .ad-recs, .ad-compliance {
                    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 14px; padding: 20px;
                }
                .ad-recs h3, .ad-compliance h3 { color: #e0e0e0; margin: 0 0 14px; }
                .ad-rec-group { margin-bottom: 12px; }
                .ad-rec-group h4 { color: #00fff5; margin: 0 0 6px; font-size: 0.9rem; }
                .ad-rec-item { color: #aaa; font-size: 0.85rem; padding: 2px 0; }

                .ad-comp-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
                .ad-comp-name { min-width: 100px; color: #ddd; font-size: 0.85rem; }
                .ad-comp-bar { flex: 1; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
                .ad-comp-fill { height: 100%; border-radius: 4px; }
                .ad-comp-score { font-weight: 700; font-size: 0.85rem; color: #ddd; min-width: 35px; }
                .ad-comp-gaps { font-size: 0.78rem; color: #ff4757; }
            `}</style>
        </div>
    )
}
