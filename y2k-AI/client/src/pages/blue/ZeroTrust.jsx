import { useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const TRUST_CHECKS = [
    {
        id: 'verify_explicitly', name: 'Verify Explicitly', icon: '🔐', description: 'MFA and strong authentication on all access points',
        checks: ['MFA enabled', 'Session timeouts configured', 'Certificate-based auth', 'No shared accounts']
    },
    {
        id: 'least_privilege', name: 'Least Privilege', icon: '🔒', description: 'Users and services have minimum required permissions',
        checks: ['Sudoers audited', 'Service accounts restricted', 'RBAC implemented', 'No default credentials']
    },
    {
        id: 'assume_breach', name: 'Assume Breach', icon: '🛡️', description: 'Network segmentation and monitoring assume compromise',
        checks: ['Network segmented', 'IDS/IPS deployed', 'Log monitoring active', 'Incident response plan']
    },
    {
        id: 'micro_segmentation', name: 'Micro-Segmentation', icon: '🌐', description: 'Services isolated with fine-grained network controls',
        checks: ['Firewall per service', 'East-west traffic filtered', 'Container isolation', 'API gateway controls']
    },
    {
        id: 'encrypt_everything', name: 'Encrypt Everything', icon: '🔑', description: 'Data encrypted in transit and at rest',
        checks: ['TLS 1.3 enforced', 'Database encryption', 'Key rotation policy', 'Certificate management']
    },
]

export default function ZeroTrust() {
    const [results, setResults] = useState({})
    const [scanning, setScanning] = useState(false)
    const [selectedCheck, setSelectedCheck] = useState(null)

    const runAssessment = async () => {
        setScanning(true)
        // Simulate progressive assessment
        for (const check of TRUST_CHECKS) {
            await new Promise(r => setTimeout(r, 800))
            setResults(prev => ({
                ...prev,
                [check.id]: {
                    status: Math.random() > 0.4 ? 'pass' : Math.random() > 0.5 ? 'partial' : 'fail',
                    score: Math.floor(Math.random() * 40 + 60),
                    findings: check.checks.map(c => ({
                        name: c,
                        status: Math.random() > 0.5 ? 'pass' : 'fail'
                    }))
                }
            }))
        }
        setScanning(false)
    }

    const totalScore = Object.values(results).length > 0
        ? Math.round(Object.values(results).reduce((s, r) => s + r.score, 0) / Object.values(results).length)
        : null

    const getStatusIcon = (status) => {
        if (status === 'pass') return '✅'
        if (status === 'partial') return '⚠️'
        return '❌'
    }

    const getStatusColor = (status) => {
        if (status === 'pass') return '#2ed573'
        if (status === 'partial') return '#ffa502'
        return '#ff4757'
    }

    return (
        <div className="page-container">
            <motion.div className="zt-page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="zt-header">
                    <div>
                        <h1>🌐 Zero Trust Architecture Validator</h1>
                        <p className="zt-subtitle">Assess your infrastructure against zero trust principles</p>
                    </div>
                    <button className="zt-scan-btn" onClick={runAssessment} disabled={scanning}>
                        {scanning ? '⏳ Scanning...' : '🔍 Run Assessment'}
                    </button>
                </div>

                {/* Overall Score */}
                {totalScore !== null && (
                    <motion.div className="zt-score-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <div className="zt-score-circle" style={{
                            borderColor: totalScore >= 80 ? '#2ed573' : totalScore >= 60 ? '#ffa502' : '#ff4757'
                        }}>
                            <span className="zt-score-value" style={{
                                color: totalScore >= 80 ? '#2ed573' : totalScore >= 60 ? '#ffa502' : '#ff4757'
                            }}>{totalScore}</span>
                            <span className="zt-score-label">/ 100</span>
                        </div>
                        <div className="zt-score-text">
                            <h3>Zero Trust Maturity Score</h3>
                            <p>{totalScore >= 80 ? 'Strong zero trust posture' : totalScore >= 60 ? 'Moderate — improvements needed' : 'Weak — significant gaps detected'}</p>
                        </div>
                    </motion.div>
                )}

                {/* Trust Principle Cards */}
                <div className="zt-checks-grid">
                    {TRUST_CHECKS.map((check, i) => {
                        const result = results[check.id]
                        return (
                            <motion.div
                                key={check.id}
                                className={`zt-check-card ${result ? result.status : ''}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                onClick={() => setSelectedCheck(selectedCheck === check.id ? null : check.id)}
                            >
                                <div className="zt-check-top">
                                    <span className="zt-check-icon">{check.icon}</span>
                                    {result && (
                                        <span className="zt-check-status" style={{ color: getStatusColor(result.status) }}>
                                            {getStatusIcon(result.status)} {result.score}%
                                        </span>
                                    )}
                                </div>
                                <h3>{check.name}</h3>
                                <p>{check.description}</p>

                                {/* Expanded findings */}
                                {selectedCheck === check.id && result && (
                                    <motion.div className="zt-findings" initial={{ height: 0 }} animate={{ height: 'auto' }}>
                                        {result.findings.map((f, j) => (
                                            <div key={j} className="zt-finding-item">
                                                <span>{getStatusIcon(f.status)}</span>
                                                <span style={{ color: f.status === 'pass' ? '#ccc' : '#ff4757' }}>{f.name}</span>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}

                                {!result && scanning && (
                                    <div className="zt-scanning-indicator">
                                        <div className="zt-scan-pulse" />
                                    </div>
                                )}
                            </motion.div>
                        )
                    })}
                </div>

                {/* Recommendations */}
                {Object.values(results).some(r => r.status !== 'pass') && (
                    <div className="zt-recommendations">
                        <h2>📋 Recommendations</h2>
                        {Object.entries(results).filter(([_, r]) => r.status !== 'pass').map(([id, result]) => {
                            const check = TRUST_CHECKS.find(c => c.id === id)
                            return (
                                <div key={id} className="zt-rec-item">
                                    <span className="zt-rec-icon">{check?.icon}</span>
                                    <div>
                                        <strong>{check?.name}</strong>
                                        <p>Fix: {result.findings.filter(f => f.status === 'fail').map(f => f.name).join(', ')}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </motion.div>

            <style>{`
                .zt-page { max-width: 1100px; margin: 0 auto; padding: 24px; }
                .zt-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
                .zt-header h1 { font-size: 1.8rem; color: #00fff5; margin: 0; }
                .zt-subtitle { color: #888; margin-top: 4px; }

                .zt-scan-btn {
                    padding: 12px 28px; background: linear-gradient(135deg, #00fff5, #7c4dff);
                    border: none; border-radius: 10px; color: #000; font-weight: 700;
                    font-size: 0.95rem; cursor: pointer; transition: all 0.3s; white-space: nowrap;
                }
                .zt-scan-btn:hover { box-shadow: 0 4px 20px rgba(0,255,245,0.3); }
                .zt-scan-btn:disabled { opacity: 0.5; }

                .zt-score-card {
                    display: flex; align-items: center; gap: 24px;
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 16px; padding: 28px; margin-bottom: 28px;
                }
                .zt-score-circle {
                    width: 100px; height: 100px; border-radius: 50%; border: 4px solid;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .zt-score-value { font-size: 2.2rem; font-weight: 900; }
                .zt-score-label { font-size: 0.8rem; color: #888; }
                .zt-score-text h3 { margin: 0; color: #e0e0e0; }
                .zt-score-text p { margin: 4px 0 0; color: #888; }

                .zt-checks-grid {
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 16px; margin-bottom: 28px;
                }
                .zt-check-card {
                    padding: 20px; background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08); border-radius: 14px;
                    cursor: pointer; transition: all 0.3s;
                }
                .zt-check-card:hover { border-color: rgba(0,255,245,0.2); transform: translateY(-2px); }
                .zt-check-card.pass { border-color: rgba(46,213,115,0.2); }
                .zt-check-card.fail { border-color: rgba(255,71,87,0.2); }
                .zt-check-card.partial { border-color: rgba(255,165,2,0.2); }

                .zt-check-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
                .zt-check-icon { font-size: 1.5rem; }
                .zt-check-status { font-size: 0.85rem; font-weight: 700; }
                .zt-check-card h3 { margin: 0 0 6px; color: #e0e0e0; font-size: 1rem; }
                .zt-check-card p { margin: 0; color: #888; font-size: 0.85rem; }

                .zt-findings { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
                .zt-finding-item { display: flex; gap: 8px; padding: 4px 0; font-size: 0.85rem; }

                .zt-scanning-indicator { margin-top: 12px; }
                .zt-scan-pulse {
                    width: 100%; height: 4px; background: rgba(0,255,245,0.1); border-radius: 2px;
                    overflow: hidden; position: relative;
                }
                .zt-scan-pulse::after {
                    content: ''; position: absolute; left: -30%; top: 0; width: 30%; height: 100%;
                    background: linear-gradient(90deg, transparent, #00fff5, transparent);
                    animation: zt-scan 1.5s linear infinite;
                }
                @keyframes zt-scan { to { left: 130%; } }

                .zt-recommendations {
                    background: rgba(255,71,87,0.04); border: 1px solid rgba(255,71,87,0.15);
                    border-radius: 16px; padding: 24px;
                }
                .zt-recommendations h2 { color: #e0e0e0; margin: 0 0 16px; font-size: 1.2rem; }
                .zt-rec-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
                .zt-rec-icon { font-size: 1.3rem; }
                .zt-rec-item strong { color: #ddd; }
                .zt-rec-item p { margin: 4px 0 0; font-size: 0.85rem; color: #ff4757; }
            `}</style>
        </div>
    )
}
