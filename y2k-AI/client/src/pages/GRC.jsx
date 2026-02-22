import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 }
};

export default function GRC() {
    const [risks, setRisks] = useState([]);
    const [frameworks, setFrameworks] = useState([]);
    const [currentFramework, setCurrentFramework] = useState('ISO27001');
    const [compliance, setCompliance] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [riskRes, fwRes, compRes] = await Promise.all([
                    axios.get('/api/grc/risk-matrix'),
                    axios.get('/api/grc/frameworks'),
                    axios.get(`/api/grc/compliance/${currentFramework}`)
                ]);
                setRisks(riskRes.data);
                setFrameworks(fwRes.data);
                setCompliance(compRes.data);
            } catch (err) {
                console.error('Failed to fetch GRC data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentFramework]);

    const generateSummary = async () => {
        try {
            const res = await axios.post('/api/grc/summary', { risks, compliance });
            setSummary(res.data);
        } catch (err) {
            console.error('Failed to generate summary', err);
        }
    };

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate">
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="page-title">Governance, Risk & Compliance</h1>
                    <p className="page-subtitle">Unified risk posture and regulatory mapping</p>
                </div>
                <button className="btn-primary" onClick={generateSummary} style={{ padding: '0.6rem 1.2rem' }}>
                    📊 Generate Exec Report
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Risk Matrix */}
                <div className="card">
                    <div className="section-title">🛡️ Risk Assessment Matrix</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '0.75rem' }}>Risk Title</th>
                                <th style={{ padding: '0.75rem' }}>Category</th>
                                <th style={{ padding: '0.75rem' }}>Impact</th>
                                <th style={{ padding: '0.75rem' }}>Severity</th>
                                <th style={{ padding: '0.75rem' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {risks.map(risk => (
                                <tr key={risk.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{risk.title}</td>
                                    <td style={{ padding: '0.75rem' }}>{risk.category}</td>
                                    <td style={{ padding: '0.75rem' }}>{risk.impact}x{risk.likelihood}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.6rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700,
                                            background: risk.level === 'Critical' ? 'rgba(255,51,102,0.1)' : risk.level === 'High' ? 'rgba(255,170,0,0.1)' : 'rgba(0,212,255,0.1)',
                                            color: risk.level === 'Critical' ? 'var(--danger)' : risk.level === 'High' ? '#ffaa00' : 'var(--cyan)'
                                        }}>
                                            {risk.level.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{risk.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Risk Posture Visual */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                    <div className="section-title">Overall Risk Score</div>
                    <div style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--cyan)', textShadow: '0 0 20px rgba(0,212,255,0.4)' }}>
                        72
                    </div>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>MEDIUM / ELEVATED</div>
                    <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border)', textAlign: 'left' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: '#8892b0' }}>KEY RECOMMENDATION</div>
                        <div style={{ fontSize: '0.85rem' }}>Patch and isolate <strong>C2 exfiltration</strong> vectors in Segment B.</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Compliance Controls */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="section-title" style={{ marginBottom: 0 }}>⚖️ Compliance Mapping</div>
                        <select
                            value={currentFramework}
                            onChange={e => setCurrentFramework(e.target.value)}
                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, color: '#fff', padding: '0.2rem 0.5rem' }}
                        >
                            {frameworks.map(fw => <option key={fw} value={fw}>{fw}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {compliance.map(c => (
                            <div key={c.control} style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--cyan)', fontSize: '0.85rem' }}>{c.control}</span>
                                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: c.status === 'compliant' ? 'var(--success)' : '#ffaa00' }}>
                                        {c.status}
                                    </span>
                                </div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem' }}>{c.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}><strong>Evidence:</strong> {c.evidence}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Exec Summary */}
                <div className="card">
                    <div className="section-title">📊 Executive Insights</div>
                    {!summary ? (
                        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                            Click "Generate Exec Report" to synthesize current posture.
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '1rem', background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.1)', borderRadius: 10 }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--success)' }}>COMPLIANCE SCORE</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{summary.compliance_score}</div>
                                </div>
                                <div style={{ padding: '1rem', background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: 10 }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--cyan)' }}>OVERALL HEALTH</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{summary.overall_health}</div>
                                </div>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem', color: '#8892b0' }}>STRATEGIC RECOMMENDATIONS</div>
                            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', lineHeight: 2, marginBottom: '1.5rem' }}>
                                {summary.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                            <button
                                className="btn-secondary"
                                onClick={() => window.open('/api/grc/report/pdf', '_blank')}
                                style={{ width: '100%', padding: '0.6rem' }}
                            >
                                📥 Download Full PDF Report
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
