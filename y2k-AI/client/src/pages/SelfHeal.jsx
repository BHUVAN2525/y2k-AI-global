import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const THREAT_TYPES = [
    { id: 'brute_force', label: '🔓 Brute Force', icon: '🔓' },
    { id: 'open_ports', label: '🌐 Open Ports', icon: '🌐' },
    { id: 'ssh_hardening', label: '🔑 SSH Hardening', icon: '🔑' },
    { id: 'malware_detected', label: '🦠 Malware Detected', icon: '🦠' },
    { id: 'credential_exposure', label: '🔐 Credential Exposure', icon: '🔐' },
    { id: 'privilege_escalation', label: '⬆️ Privilege Escalation', icon: '⬆️' },
]

const SEVERITY_LEVELS = ['critical', 'high', 'medium', 'low']
const ASSET_TYPES = ['web_server', 'database', 'auth_server', 'api_gateway', 'file_server', 'workstation']

export default function SelfHeal() {
    const [threatType, setThreatType] = useState('brute_force')
    const [severity, setSeverity] = useState('medium')
    const [assetType, setAssetType] = useState('web_server')
    const [sourceIp, setSourceIp] = useState('')
    const [plan, setPlan] = useState(null)
    const [loading, setLoading] = useState(false)
    const [history, setHistory] = useState([])
    const [patches, setPatches] = useState(null)
    const [policies, setPolicies] = useState(null)
    const [activeTab, setActiveTab] = useState('remediate')

    useEffect(() => {
        loadHistory()
    }, [])

    const loadHistory = async () => {
        try {
            const res = await axios.get('/api/selfheal/history')
            setHistory(res.data.history || [])
        } catch { }
    }

    const analyzeThreat = async () => {
        setLoading(true)
        try {
            const res = await axios.post('/api/selfheal/analyze', {
                threat_type: threatType, severity, asset_type: assetType,
                source_ip: sourceIp || undefined
            })
            setPlan(res.data)
            loadHistory()
        } catch (err) {
            setPlan({ error: true, message: err.response?.data?.error || err.message })
        }
        setLoading(false)
    }

    const executeStep = async (remId, stepIdx) => {
        try {
            await axios.post('/api/selfheal/execute', { remediation_id: remId, step_index: stepIdx })
            loadHistory()
        } catch { }
    }

    const loadPatches = async () => {
        try {
            const res = await axios.get('/api/selfheal/patches')
            setPatches(res.data)
        } catch { }
    }

    const loadPolicies = async () => {
        try {
            const res = await axios.get('/api/selfheal/policies')
            setPolicies(res.data)
        } catch { }
    }

    const generatePolicy = async (policyType) => {
        try {
            const res = await axios.post('/api/selfheal/policies/generate', { policy_type: policyType })
            setPolicies(prev => ({ ...prev, generated: res.data }))
        } catch { }
    }

    const getRiskColor = (level) => {
        const c = { critical: '#ff4757', high: '#ffa502', medium: '#3742fa', low: '#2ed573' }
        return c[level] || '#888'
    }

    return (
        <div className="page-container">
            <motion.div className="sh-page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="sh-header">
                    <h1>🩹 Self-Healing Security Engine</h1>
                    <p className="sh-subtitle">Automated threat remediation, patch management & policy generation</p>
                </div>

                {/* Tabs */}
                <div className="sh-tabs">
                    {[
                        { id: 'remediate', label: '🩹 Remediate', onClick: () => setActiveTab('remediate') },
                        { id: 'patches', label: '📦 Patches', onClick: () => { setActiveTab('patches'); loadPatches() } },
                        { id: 'policies', label: '📜 Policies', onClick: () => { setActiveTab('policies'); loadPolicies() } },
                        { id: 'history', label: '📋 History', onClick: () => { setActiveTab('history'); loadHistory() } },
                    ].map(tab => (
                        <button key={tab.id} className={`sh-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={tab.onClick}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Remediate Tab */}
                {activeTab === 'remediate' && (
                    <div className="sh-section">
                        <div className="sh-form">
                            <h3>⚡ Quick Remediation</h3>
                            <div className="sh-form-grid">
                                <div className="sh-field">
                                    <label>Threat Type</label>
                                    <select value={threatType} onChange={e => setThreatType(e.target.value)}>
                                        {THREAT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div className="sh-field">
                                    <label>Severity</label>
                                    <select value={severity} onChange={e => setSeverity(e.target.value)}>
                                        {SEVERITY_LEVELS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div className="sh-field">
                                    <label>Asset Type</label>
                                    <select value={assetType} onChange={e => setAssetType(e.target.value)}>
                                        {ASSET_TYPES.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
                                    </select>
                                </div>
                                <div className="sh-field">
                                    <label>Source IP (optional)</label>
                                    <input type="text" value={sourceIp} onChange={e => setSourceIp(e.target.value)}
                                        placeholder="e.g., 192.168.1.100" />
                                </div>
                            </div>
                            <button className="sh-analyze-btn" onClick={analyzeThreat} disabled={loading}>
                                {loading ? '⏳ Analyzing...' : '🔍 Analyze & Generate Plan'}
                            </button>
                        </div>

                        {plan && !plan.error && (
                            <motion.div className="sh-plan" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="sh-plan-header">
                                    <div>
                                        <h3>{plan.remediation_name}</h3>
                                        <span className="sh-mitre">MITRE {plan.mitre_technique}</span>
                                    </div>
                                    <div className="sh-risk-score" style={{ borderColor: getRiskColor(plan.risk_level) }}>
                                        <span className="sh-risk-value" style={{ color: getRiskColor(plan.risk_level) }}>{plan.risk_score}</span>
                                        <span className="sh-risk-label">Risk Score</span>
                                    </div>
                                </div>
                                <div className="sh-plan-stats">
                                    <div><strong>{plan.total_steps}</strong> Steps</div>
                                    <div><strong style={{ color: '#2ed573' }}>{plan.auto_approve_steps}</strong> Auto</div>
                                    <div><strong style={{ color: '#ffa502' }}>{plan.manual_approve_steps}</strong> Manual</div>
                                    <div><strong>{plan.risk_reduction}</strong> Risk ↓</div>
                                </div>
                                <div className="sh-steps">
                                    {plan.steps?.map((step, i) => (
                                        <div key={i} className={`sh-step ${step.status || ''}`}>
                                            <div className="sh-step-header">
                                                <span className="sh-step-num">#{i + 1}</span>
                                                <span className="sh-step-action">{step.action.replace(/_/g, ' ')}</span>
                                                <span className={`sh-step-risk ${step.risk}`}>{step.risk}</span>
                                            </div>
                                            <code className="sh-step-cmd">{step.command}</code>
                                            <div className="sh-step-footer">
                                                {step.auto_approve
                                                    ? <span className="sh-auto">✅ Auto-approved</span>
                                                    : <span className="sh-manual">⚠️ Requires approval</span>
                                                }
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Patches Tab */}
                {activeTab === 'patches' && (
                    <div className="sh-section">
                        <h3>📦 CVE Patch Database</h3>
                        {patches?.patches ? (
                            <div className="sh-patch-grid">
                                {Object.entries(patches.patches).map(([cve, data]) => (
                                    <div key={cve} className="sh-patch-card">
                                        <div className="sh-patch-header">
                                            <strong>{cve}</strong>
                                            <span className="sh-severity" style={{ color: getRiskColor(data.severity) }}>{data.severity}</span>
                                        </div>
                                        <h4>{data.name}</h4>
                                        <p className="sh-affected">Affected: {data.affected}</p>
                                        <p className="sh-fix">Fix: {data.fix}</p>
                                        <div className="sh-patch-cmds">
                                            {data.commands?.map((cmd, i) => (
                                                <code key={i}>{cmd}</code>
                                            ))}
                                        </div>
                                        <span className="sh-downtime">⏱ {data.downtime}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="sh-loading">Loading patch database...</div>
                        )}
                    </div>
                )}

                {/* Policies Tab */}
                {activeTab === 'policies' && (
                    <div className="sh-section">
                        <h3>📜 Security Policy Generator</h3>
                        {policies?.policies ? (
                            <div className="sh-policy-grid">
                                {policies.policies.map((p, i) => (
                                    <div key={i} className="sh-policy-card">
                                        <h4>{p.name}</h4>
                                        <p>{p.description}</p>
                                        <button className="sh-gen-btn" onClick={() => generatePolicy(p.id)}>Generate</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="sh-loading">Loading policies...</div>
                        )}
                        {policies?.generated && (
                            <motion.div className="sh-generated" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <h4>📄 {policies.generated.name}</h4>
                                <pre className="sh-code">{policies.generated.script}</pre>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="sh-section">
                        <h3>📋 Remediation History</h3>
                        {history.length > 0 ? (
                            <div className="sh-history">
                                {history.map((h, i) => (
                                    <div key={i} className="sh-history-item">
                                        <div className="sh-hist-header">
                                            <strong>{h.remediation_name || h.threat_type}</strong>
                                            <span className={`sh-hist-status ${h.status}`}>{h.status}</span>
                                        </div>
                                        <div className="sh-hist-meta">
                                            Risk: <strong style={{ color: getRiskColor(h.risk_level) }}>{h.risk_score}</strong>
                                            {' • '} Steps: {h.total_steps}
                                            {' • '} {new Date(h.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="sh-empty">No remediation history yet.</div>
                        )}
                    </div>
                )}
            </motion.div>

            <style>{`
                .sh-page { max-width: 1100px; margin: 0 auto; padding: 24px; }
                .sh-header h1 { font-size: 1.8rem; color: #00fff5; margin: 0; }
                .sh-subtitle { color: #888; margin-top: 4px; }

                .sh-tabs { display: flex; gap: 8px; margin: 24px 0; }
                .sh-tab {
                    padding: 10px 20px; border: 1px solid rgba(255,255,255,0.1);
                    background: transparent; color: #999; border-radius: 8px;
                    cursor: pointer; transition: all 0.2s; font-size: 0.9rem;
                }
                .sh-tab.active {
                    background: rgba(0,255,245,0.1); border-color: rgba(0,255,245,0.3);
                    color: #00fff5;
                }

                .sh-form {
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 16px; padding: 24px; margin-bottom: 24px;
                }
                .sh-form h3 { color: #e0e0e0; margin: 0 0 16px; }
                .sh-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
                .sh-field label { display: block; font-size: 0.8rem; color: #888; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
                .sh-field select, .sh-field input {
                    width: 100%; padding: 10px 14px; background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
                    color: #e0e0e0; font-size: 0.9rem;
                }
                .sh-field select:focus, .sh-field input:focus { outline: none; border-color: #00fff5; }

                .sh-analyze-btn {
                    width: 100%; padding: 14px; background: linear-gradient(135deg, #00fff5, #7c4dff);
                    border: none; border-radius: 10px; color: #000; font-weight: 700;
                    font-size: 1rem; cursor: pointer; transition: all 0.3s;
                }
                .sh-analyze-btn:hover { box-shadow: 0 4px 20px rgba(0,255,245,0.3); transform: translateY(-1px); }
                .sh-analyze-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .sh-plan {
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 16px; padding: 24px;
                }
                .sh-plan-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .sh-plan-header h3 { margin: 0; color: #e0e0e0; }
                .sh-mitre { font-size: 0.8rem; color: #b388ff; background: rgba(124,77,255,0.12); padding: 3px 10px; border-radius: 5px; }

                .sh-risk-score {
                    width: 70px; height: 70px; border-radius: 50%; border: 3px solid;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                }
                .sh-risk-value { font-size: 1.5rem; font-weight: 900; }
                .sh-risk-label { font-size: 0.6rem; color: #888; }

                .sh-plan-stats {
                    display: flex; gap: 24px; padding: 12px 0; margin-bottom: 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }
                .sh-plan-stats div { font-size: 0.85rem; color: #aaa; }
                .sh-plan-stats strong { color: #e0e0e0; }

                .sh-step {
                    padding: 14px; margin-bottom: 8px; background: rgba(0,0,0,0.2);
                    border-radius: 10px; border-left: 3px solid rgba(255,255,255,0.1);
                }
                .sh-step.completed { border-left-color: #2ed573; }
                .sh-step-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
                .sh-step-num { color: #888; font-weight: 700; font-size: 0.85rem; }
                .sh-step-action { color: #ddd; font-weight: 600; text-transform: capitalize; }
                .sh-step-risk { font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; margin-left: auto; }
                .sh-step-risk.low { color: #2ed573; background: rgba(46,213,115,0.1); }
                .sh-step-risk.medium { color: #ffa502; background: rgba(255,165,2,0.1); }
                .sh-step-risk.high { color: #ff4757; background: rgba(255,71,87,0.1); }
                .sh-step-cmd { display: block; padding: 8px 12px; background: rgba(0,0,0,0.3); border-radius: 6px; font-size: 0.82rem; color: #aaa; word-break: break-all; }
                .sh-step-footer { margin-top: 8px; }
                .sh-auto { color: #2ed573; font-size: 0.8rem; }
                .sh-manual { color: #ffa502; font-size: 0.8rem; }

                .sh-patch-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px; }
                .sh-patch-card {
                    padding: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 14px;
                }
                .sh-patch-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
                .sh-patch-header strong { color: #00fff5; }
                .sh-severity { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; }
                .sh-patch-card h4 { margin: 0 0 8px; color: #ddd; }
                .sh-affected, .sh-fix { margin: 4px 0; font-size: 0.85rem; color: #999; }
                .sh-patch-cmds { margin: 8px 0; display: flex; flex-direction: column; gap: 4px; }
                .sh-patch-cmds code { padding: 6px 10px; background: rgba(0,0,0,0.3); border-radius: 6px; font-size: 0.8rem; color: #aaa; }
                .sh-downtime { font-size: 0.8rem; color: #888; }

                .sh-policy-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 20px; }
                .sh-policy-card {
                    padding: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 14px;
                }
                .sh-policy-card h4 { margin: 0 0 6px; color: #ddd; }
                .sh-policy-card p { margin: 0 0 12px; font-size: 0.85rem; color: #888; }
                .sh-gen-btn {
                    padding: 8px 16px; background: rgba(0,255,245,0.1); border: 1px solid rgba(0,255,245,0.3);
                    color: #00fff5; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;
                }
                .sh-gen-btn:hover { background: rgba(0,255,245,0.2); }

                .sh-generated {
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(0,255,245,0.15);
                    border-radius: 14px; padding: 20px;
                }
                .sh-generated h4 { margin: 0 0 12px; color: #00fff5; }
                .sh-code {
                    padding: 16px; background: rgba(0,0,0,0.4); border-radius: 10px;
                    font-size: 0.82rem; color: #ccc; overflow-x: auto; line-height: 1.5;
                    white-space: pre-wrap;
                }

                .sh-history-item {
                    padding: 14px; background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; margin-bottom: 8px;
                }
                .sh-hist-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
                .sh-hist-header strong { color: #ddd; }
                .sh-hist-status { font-size: 0.78rem; padding: 3px 10px; border-radius: 5px; }
                .sh-hist-status.pending_approval { color: #ffa502; background: rgba(255,165,2,0.1); }
                .sh-hist-status.completed { color: #2ed573; background: rgba(46,213,115,0.1); }
                .sh-hist-meta { font-size: 0.83rem; color: #888; }

                .sh-loading, .sh-empty { color: #888; text-align: center; padding: 40px; }
            `}</style>
        </div>
    )
}
