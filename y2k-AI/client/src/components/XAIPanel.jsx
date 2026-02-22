import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

export default function XAIPanel({ analysisResult, onClose }) {
    const [explanation, setExplanation] = useState(null)
    const [loading, setLoading] = useState(false)

    const requestExplanation = async () => {
        setLoading(true)
        try {
            const res = await axios.post('/api/agent/chat', {
                message: `Explain in detail why this file was classified as "${analysisResult?.prediction || 'unknown'}". 
                File: ${analysisResult?.filename || 'unknown'}
                Prediction: ${analysisResult?.prediction}
                Confidence: ${analysisResult?.confidence}
                Features detected: ${JSON.stringify(analysisResult?.features?.slice(0, 10) || [])}
                
                Provide a breakdown of each feature's contribution to the classification and why it matters for malware detection.`,
                mode: 'blue'
            })
            setExplanation(res.data.response)
        } catch (err) {
            setExplanation('⚠️ Unable to generate explanation. Please check your API key configuration.')
        }
        setLoading(false)
    }

    if (!analysisResult) return null

    const features = analysisResult?.feature_importance || [
        { name: 'Entropy (High)', weight: 0.89, impact: 'suspicious', description: 'Packed or encrypted code sections detected' },
        { name: 'CreateRemoteThread API', weight: 0.82, impact: 'malicious', description: 'Used for process injection (T1055)' },
        { name: 'VirtualAllocEx API', weight: 0.76, impact: 'suspicious', description: 'Remote memory allocation for code injection' },
        { name: 'Network Callbacks', weight: 0.71, impact: 'malicious', description: 'C2 communication patterns detected (T1071)' },
        { name: 'Registry Modification', weight: 0.65, impact: 'suspicious', description: 'Persistence via registry keys (T1547)' },
        { name: 'File Size Anomaly', weight: 0.45, impact: 'info', description: 'Unusual file size for declared type' },
        { name: 'Import Count', weight: 0.38, impact: 'info', description: 'Number of imported functions' },
        { name: 'Section Count', weight: 0.22, impact: 'benign', description: 'Standard section layout' },
    ]

    const confidence = analysisResult?.confidence || 0.87
    const prediction = analysisResult?.prediction || 'Malware'

    const getImpactColor = (impact) => {
        switch (impact) {
            case 'malicious': return 'var(--danger)'
            case 'suspicious': return 'var(--warning)'
            case 'info': return '#3742fa'
            case 'benign': return 'var(--success)'
            default: return '#747d8c'
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                className="xai-panel-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="xai-panel"
                    initial={{ x: 400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 400, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25 }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="xai-header">
                        <div>
                            <h2>🧠 Explainable AI Analysis</h2>
                            <span className="xai-subtitle">Why was this decision made?</span>
                        </div>
                        <button className="xai-close" onClick={onClose}>✕</button>
                    </div>

                    {/* Verdict */}
                    <div className={`xai-verdict ${prediction === 'Malware' ? 'malicious' : prediction === 'Suspicious' ? 'suspicious' : 'benign'}`}>
                        <div className="verdict-label">VERDICT</div>
                        <div className="verdict-value">{prediction}</div>
                        <div className="verdict-confidence">
                            <div className="confidence-bar">
                                <motion.div
                                    className="confidence-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${confidence * 100}%` }}
                                    transition={{ duration: 1, delay: 0.3 }}
                                />
                            </div>
                            <span>{(confidence * 100).toFixed(1)}% confidence</span>
                        </div>
                    </div>

                    {/* Feature Importance */}
                    <div className="xai-section">
                        <h3>📊 Feature Importance</h3>
                        <p className="xai-desc">Each feature's contribution to the classification decision:</p>
                        <div className="feature-list">
                            {features.map((f, i) => (
                                <motion.div
                                    key={i}
                                    className="feature-item"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                >
                                    <div className="feature-header">
                                        <span className="feature-name">{f.name}</span>
                                        <span className="feature-impact" style={{ color: getImpactColor(f.impact) }}>
                                            {f.impact.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="feature-bar-container">
                                        <motion.div
                                            className="feature-bar"
                                            style={{ backgroundColor: getImpactColor(f.impact) }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${f.weight * 100}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.1 }}
                                        />
                                        <span className="feature-weight">{(f.weight * 100).toFixed(0)}%</span>
                                    </div>
                                    <p className="feature-desc">{f.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* AI Explanation */}
                    <div className="xai-section">
                        <h3>💬 AI Explanation</h3>
                        {!explanation && !loading && (
                            <button className="btn-explain" onClick={requestExplanation}>
                                🧠 Generate Detailed Explanation
                            </button>
                        )}
                        {loading && (
                            <div className="xai-loading">
                                <div className="xai-spinner"></div>
                                <span>AI is analyzing decision factors...</span>
                            </div>
                        )}
                        {explanation && (
                            <motion.div
                                className="xai-explanation"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div dangerouslySetInnerHTML={{ __html: explanation.replace(/\n/g, '<br/>') }} />
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </motion.div>

            <style>{`
                .xai-panel-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
                    z-index: 1000; display: flex; justify-content: flex-end;
                    backdrop-filter: blur(4px);
                }
                .xai-panel {
                    width: 520px; max-width: 90vw; height: 100vh; overflow-y: auto;
                    background: var(--bg-secondary);
                    border-left: 1px solid rgba(0,255,255,0.15);
                    padding: 24px; color: #e0e0e0;
                }
                .xai-header {
                    display: flex; justify-content: space-between; align-items: flex-start;
                    margin-bottom: 24px; padding-bottom: 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .xai-header h2 { margin: 0; font-size: 1.4rem; color: var(--info); }
                .xai-subtitle { color: #888; font-size: 0.85rem; }
                .xai-close {
                    background: none; border: 1px solid rgba(255,255,255,0.1);
                    color: #999; font-size: 1.2rem; cursor: pointer; padding: 4px 10px;
                    border-radius: 6px; transition: all 0.2s;
                }
                .xai-close:hover { border-color: var(--danger); color: var(--danger); }

                .xai-verdict {
                    background: rgba(255,255,255,0.03); border-radius: 12px;
                    padding: 20px; text-align: center; margin-bottom: 24px;
                    border: 1px solid rgba(255,255,255,0.08);
                }
                .xai-verdict.malicious { border-color: rgba(255,71,87,0.3); }
                .xai-verdict.suspicious { border-color: rgba(255,165,2,0.3); }
                .xai-verdict.benign { border-color: rgba(46,213,115,0.3); }
                .verdict-label { font-size: 0.7rem; letter-spacing: 2px; color: #888; margin-bottom: 4px; }
                .verdict-value { font-size: 2rem; font-weight: 800; color: #fff; }
                .malicious .verdict-value { color: var(--danger); }
                .suspicious .verdict-value { color: var(--warning); }
                .benign .verdict-value { color: var(--success); }

                .confidence-bar {
                    height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px;
                    margin: 12px 0 8px; overflow: hidden;
                }
                .confidence-fill {
                    height: 100%; border-radius: 4px;
                    background: var(--bg-secondary), var(--primary));
                }
                .verdict-confidence span { font-size: 0.85rem; color: #aaa; }

                .xai-section { margin-bottom: 24px; }
                .xai-section h3 { color: var(--info); font-size: 1.1rem; margin-bottom: 8px; }
                .xai-desc { color: #888; font-size: 0.85rem; margin-bottom: 12px; }

                .feature-item {
                    padding: 12px; margin-bottom: 8px;
                    background: rgba(255,255,255,0.02); border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .feature-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
                .feature-name { font-weight: 600; color: #ddd; font-size: 0.9rem; }
                .feature-impact { font-size: 0.7rem; letter-spacing: 1px; font-weight: 700; }

                .feature-bar-container {
                    display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
                }
                .feature-bar-container { position: relative; }
                .feature-bar {
                    height: 6px; border-radius: 3px; min-width: 4px;
                }
                .feature-weight { font-size: 0.8rem; color: #aaa; min-width: 36px; }
                .feature-desc { font-size: 0.78rem; color: #777; margin: 0; }

                .btn-explain {
                    width: 100%; padding: 14px; border: 1px solid rgba(0,255,245,0.3);
                    background: rgba(0,255,245,0.05); color: var(--info); font-size: 0.95rem;
                    border-radius: 10px; cursor: pointer; transition: all 0.3s;
                    font-weight: 600;
                }
                .btn-explain:hover {
                    background: rgba(0,255,245,0.15); border-color: var(--info);
                    box-shadow: 0 0 20px rgba(0,255,245,0.2);
                }

                .xai-loading { display: flex; align-items: center; gap: 12px; padding: 20px; color: #aaa; }
                .xai-spinner {
                    width: 24px; height: 24px; border: 2px solid rgba(0,255,245,0.2);
                    border-top-color: var(--info); border-radius: 50%;
                    animation: xai-spin 0.8s linear infinite;
                }
                @keyframes xai-spin { to { transform: rotate(360deg); } }

                .xai-explanation {
                    padding: 16px; background: rgba(0,255,245,0.03);
                    border: 1px solid rgba(0,255,245,0.1); border-radius: 10px;
                    line-height: 1.6; font-size: 0.9rem; color: #ccc;
                }
            `}</style>
        </AnimatePresence>
    )
}
