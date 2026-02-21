import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

export default function MemoryForensics() {
    const [analysis, setAnalysis] = useState(null)
    const [loading, setLoading] = useState(false)
    const [activeView, setActiveView] = useState('overview')
    const [selectedProcess, setSelectedProcess] = useState(null)

    const runAnalysis = async () => {
        setLoading(true)
        try {
            const res = await axios.post('/api/python/memory/analyze', { scan_type: 'full' })
            setAnalysis(res.data)
        } catch (err) {
            // Fallback: try direct Python API
            try {
                const res = await axios.post('http://localhost:8001/memory/analyze', { scan_type: 'full' })
                setAnalysis(res.data)
            } catch {
                setAnalysis({ error: 'Memory forensics engine unavailable' })
            }
        }
        setLoading(false)
    }

    const getThreatColor = (level) => {
        const c = { critical: '#ff4757', high: '#ffa502', medium: '#3742fa', low: '#2ed573' }
        return c[level] || '#888'
    }

    return (
        <div className="page-container">
            <motion.div className="mf-page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="mf-header">
                    <div>
                        <h1>🧬 Memory Forensics Lab</h1>
                        <p className="mf-subtitle">Live memory analysis, process injection detection & hook scanning</p>
                    </div>
                    <button className="mf-scan-btn" onClick={runAnalysis} disabled={loading}>
                        {loading ? '⏳ Analyzing memory...' : '🔬 Analyze Memory'}
                    </button>
                </div>

                {analysis && !analysis.error && (
                    <>
                        {/* Threat Summary */}
                        <motion.div className="mf-summary" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            <div className="mf-score" style={{ borderColor: getThreatColor(analysis.threat_level) }}>
                                <span className="mf-score-val" style={{ color: getThreatColor(analysis.threat_level) }}>{analysis.threat_score}</span>
                                <span className="mf-score-lbl">Threat Score</span>
                            </div>
                            <div className="mf-stats">
                                <div className="mf-stat"><strong>{analysis.summary.total_processes}</strong><span>Processes</span></div>
                                <div className="mf-stat"><strong style={{ color: '#ff4757' }}>{analysis.summary.suspicious_processes}</strong><span>Suspicious</span></div>
                                <div className="mf-stat"><strong style={{ color: '#ffa502' }}>{analysis.summary.api_hooks_detected}</strong><span>Hooks</span></div>
                                <div className="mf-stat"><strong style={{ color: '#b388ff' }}>{analysis.summary.dll_injections}</strong><span>Injections</span></div>
                            </div>
                            <span className="mf-time">⏱ {analysis.analysis_time}</span>
                        </motion.div>

                        {/* View Tabs */}
                        <div className="mf-tabs">
                            {['overview', 'processes', 'hooks', 'strings', 'mitre'].map(v => (
                                <button key={v} className={`mf-tab ${activeView === v ? 'active' : ''}`} onClick={() => setActiveView(v)}>
                                    {v === 'overview' ? '📊' : v === 'processes' ? '🔄' : v === 'hooks' ? '🪝' : v === 'strings' ? '📝' : '🎯'} {v}
                                </button>
                            ))}
                        </div>

                        {/* Process Tree */}
                        {activeView === 'processes' && (
                            <div className="mf-section">
                                <h3>🔄 Process Tree</h3>
                                <div className="mf-process-list">
                                    {analysis.processes.map((p, i) => (
                                        <motion.div key={i} className={`mf-proc ${p.suspicious ? 'suspicious' : ''}`}
                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            onClick={() => setSelectedProcess(selectedProcess === p.pid ? null : p.pid)}
                                        >
                                            <div className="mf-proc-main">
                                                <span className="mf-pid">{p.pid}</span>
                                                <span className="mf-pname">{p.name}</span>
                                                <span className="mf-puser">{p.user}</span>
                                                <span className="mf-pmem">{p.memory_mb} MB</span>
                                                {p.suspicious && <span className="mf-badge-sus">⚠️ SUSPICIOUS</span>}
                                            </div>
                                            {selectedProcess === p.pid && (
                                                <motion.div className="mf-proc-detail" initial={{ height: 0 }} animate={{ height: 'auto' }}>
                                                    <div>PPID: {p.ppid} • Threads: {p.threads} • Handles: {p.handles} • Modules: {p.modules}</div>
                                                    {p.anomaly && <div className="mf-anomaly">⚠️ {p.anomaly}</div>}
                                                    {p.mitre && <div className="mf-mitre-tag">MITRE: {p.mitre}</div>}
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hooks */}
                        {activeView === 'hooks' && (
                            <div className="mf-section">
                                <h3>🪝 API Hook Analysis</h3>
                                {analysis.hooks.map((h, i) => (
                                    <div key={i} className={`mf-hook ${h.suspicious ? 'suspicious' : ''}`}>
                                        <div className="mf-hook-main">
                                            <strong>{h.function}</strong>
                                            <span>in {h.module}</span>
                                            <span className="mf-hook-type">{h.type}</span>
                                            {h.suspicious && <span className="mf-badge-sus">SUSPICIOUS</span>}
                                        </div>
                                        <div className="mf-hook-detail">Hooked by: <code>{h.hooked_by}</code> — {h.details}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Strings */}
                        {activeView === 'strings' && (
                            <div className="mf-section">
                                <h3>📝 Extracted Strings</h3>
                                {analysis.strings.map((s, i) => (
                                    <div key={i} className="mf-string">
                                        <span className="mf-str-type">{s.type}</span>
                                        <code>{s.value}</code>
                                        <span className="mf-str-ctx">{s.context}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* MITRE */}
                        {activeView === 'mitre' && (
                            <div className="mf-section">
                                <h3>🎯 MITRE ATT&CK Mapping</h3>
                                <div className="mf-mitre-grid">
                                    {analysis.mitre_mapping.filter(Boolean).map((m, i) => (
                                        <div key={i} className="mf-mitre-card">
                                            <span className="mf-mitre-id">{m.id}</span>
                                            <strong>{m.name}</strong>
                                            <span className="mf-mitre-sev" style={{ color: getThreatColor(m.severity) }}>
                                                {m.severity.toUpperCase()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mf-recs">
                                    <h4>📋 Recommendations</h4>
                                    {analysis.recommendations.map((r, i) => <div key={i} className="mf-rec">{i + 1}. {r}</div>)}
                                </div>
                            </div>
                        )}

                        {/* Overview */}
                        {activeView === 'overview' && (
                            <div className="mf-section">
                                <h3>📊 Analysis Overview</h3>
                                <div className="mf-overview-grid">
                                    <div className="mf-ov-card">
                                        <h4>Suspicious Processes</h4>
                                        {analysis.suspicious_processes.map((p, i) => (
                                            <div key={i} className="mf-ov-item">
                                                <strong>{p.name}</strong> (PID: {p.pid})
                                                <div className="mf-anomaly">{p.anomaly}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {analysis.injections.length > 0 && (
                                        <div className="mf-ov-card">
                                            <h4>DLL Injections</h4>
                                            {analysis.injections.map((inj, i) => (
                                                <div key={i} className="mf-ov-item">
                                                    <strong>{inj.dll}</strong> → {inj.target_process}
                                                    <div>Entropy: {inj.entropy} | Signed: {inj.signed ? 'Yes' : 'No'}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {analysis?.error && <div className="mf-error">⚠️ {analysis.error}</div>}
            </motion.div>

            <style>{`
                .mf-page { max-width: 1200px; margin: 0 auto; padding: 24px; }
                .mf-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
                .mf-header h1 { font-size: 1.8rem; color: #00fff5; margin: 0; }
                .mf-subtitle { color: #888; margin-top: 4px; }
                .mf-scan-btn {
                    padding: 12px 28px; background: linear-gradient(135deg, #00fff5, #7c4dff);
                    border: none; border-radius: 10px; color: #000; font-weight: 700;
                    cursor: pointer; transition: all 0.3s; white-space: nowrap;
                }
                .mf-scan-btn:hover { box-shadow: 0 4px 20px rgba(0,255,245,0.3); }
                .mf-scan-btn:disabled { opacity: 0.5; }

                .mf-summary {
                    display: flex; align-items: center; gap: 24px; padding: 24px;
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 16px; margin-bottom: 24px;
                }
                .mf-score {
                    width: 90px; height: 90px; border-radius: 50%; border: 4px solid;
                    display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0;
                }
                .mf-score-val { font-size: 2rem; font-weight: 900; }
                .mf-score-lbl { font-size: 0.7rem; color: #888; }
                .mf-stats { display: flex; gap: 24px; flex: 1; }
                .mf-stat { text-align: center; }
                .mf-stat strong { display: block; font-size: 1.3rem; color: #e0e0e0; }
                .mf-stat span { font-size: 0.75rem; color: #888; }
                .mf-time { font-size: 0.85rem; color: #888; }

                .mf-tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
                .mf-tab {
                    padding: 8px 18px; border: 1px solid rgba(255,255,255,0.1); background: transparent;
                    color: #999; border-radius: 8px; cursor: pointer; text-transform: capitalize; font-size: 0.88rem;
                }
                .mf-tab.active { background: rgba(0,255,245,0.1); border-color: rgba(0,255,245,0.3); color: #00fff5; }

                .mf-section { margin-bottom: 24px; }
                .mf-section h3 { color: #e0e0e0; margin: 0 0 14px; }

                .mf-proc {
                    padding: 10px 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 8px; margin-bottom: 4px; cursor: pointer; transition: all 0.2s;
                }
                .mf-proc:hover { border-color: rgba(0,255,245,0.15); }
                .mf-proc.suspicious { border-left: 3px solid #ff4757; }
                .mf-proc-main { display: flex; align-items: center; gap: 12px; }
                .mf-pid { color: #888; font-family: monospace; font-size: 0.85rem; min-width: 50px; }
                .mf-pname { color: #ddd; font-weight: 600; min-width: 140px; }
                .mf-puser { color: #888; font-size: 0.85rem; min-width: 80px; }
                .mf-pmem { color: #aaa; font-size: 0.85rem; margin-left: auto; }
                .mf-badge-sus { font-size: 0.7rem; color: #ff4757; background: rgba(255,71,87,0.12); padding: 2px 8px; border-radius: 4px; font-weight: 700; }
                .mf-proc-detail { padding: 8px 0 0; font-size: 0.83rem; color: #888; }
                .mf-anomaly { color: #ff4757; font-size: 0.83rem; margin-top: 4px; }
                .mf-mitre-tag { color: #b388ff; font-size: 0.8rem; margin-top: 2px; }

                .mf-hook { padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 8px; }
                .mf-hook.suspicious { border-left: 3px solid #ffa502; }
                .mf-hook-main { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
                .mf-hook-main strong { color: #ddd; }
                .mf-hook-main span { color: #888; font-size: 0.85rem; }
                .mf-hook-type { background: rgba(124,77,255,0.12); color: #b388ff; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }
                .mf-hook-detail { font-size: 0.83rem; color: #999; }
                .mf-hook-detail code { color: #ffa502; }

                .mf-string { display: flex; align-items: center; gap: 12px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 6px; margin-bottom: 4px; }
                .mf-str-type { font-size: 0.7rem; color: #00fff5; background: rgba(0,255,245,0.08); padding: 2px 8px; border-radius: 4px; text-transform: uppercase; min-width: 60px; text-align: center; }
                .mf-string code { color: #ddd; font-size: 0.85rem; }
                .mf-str-ctx { color: #888; font-size: 0.8rem; margin-left: auto; }

                .mf-mitre-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; margin-bottom: 20px; }
                .mf-mitre-card {
                    padding: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 10px; display: flex; flex-direction: column; gap: 4px;
                }
                .mf-mitre-id { font-size: 0.75rem; color: #b388ff; }
                .mf-mitre-card strong { color: #e0e0e0; }
                .mf-mitre-sev { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }

                .mf-recs { margin-top: 12px; }
                .mf-recs h4 { color: #ddd; margin: 0 0 8px; }
                .mf-rec { color: #aaa; font-size: 0.88rem; padding: 4px 0; }

                .mf-overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
                .mf-ov-card { padding: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; }
                .mf-ov-card h4 { color: #ddd; margin: 0 0 12px; }
                .mf-ov-item { padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.88rem; color: #ccc; }
                .mf-ov-item div { font-size: 0.82rem; color: #888; margin-top: 2px; }

                .mf-error { color: #ff4757; padding: 20px; text-align: center; }
            `}</style>
        </div>
    )
}
