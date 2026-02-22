import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export default function ForensicLab() {
    const [analyses, setAnalyses] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalyses = async () => {
            try {
                // Fetch from BattleRecords or specialized endpoint
                const res = await axios.get('/api/battles?type=malware_analysis');
                setAnalyses(res.data);
            } catch (err) {
                console.error('Failed to fetch forensic data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalyses();
        const interval = setInterval(fetchAnalyses, 10000);
        return () => clearInterval(interval);
    }, []);

    const selectedAnalyses = analyses.find(a => a.battleId === selectedId || a._id === selectedId);

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;

    return (
        <div className="page-container">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 className="page-title">🔬 Autonomous Forensic Lab</h1>
                    <p className="page-subtitle">Market-standard sandbox investigation and behavioral reporting</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', height: 'calc(100vh - 250px)' }}>
                    {/* Sidebar: Analysis Runs */}
                    <div className="card" style={{ padding: '1rem', overflowY: 'auto' }}>
                        <div className="section-title">Recent Investigations</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {analyses.length === 0 ? (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>
                                    No autonomous runs detected.
                                </div>
                            ) : (
                                analyses.map(run => (
                                    <div
                                        key={run._id}
                                        onClick={() => setSelectedId(run._id)}
                                        style={{
                                            padding: '1rem',
                                            borderRadius: 12,
                                            background: selectedId === run._id ? 'var(--cyan-dim)' : 'var(--bg-primary)',
                                            border: `1px solid ${selectedId === run._id ? 'var(--cyan)' : 'var(--border)'}`,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>{run.attacker || 'Sample Analysis'}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            <span>{new Date(run.timestamp).toLocaleTimeString()}</span>
                                            <span style={{ color: run.winner.includes('Success') ? 'var(--success)' : 'var(--danger)' }}>{run.winner}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main View: Report Details */}
                    <div className="card" style={{ overflowY: 'auto' }}>
                        <AnimatePresence mode="wait">
                            {selectedAnalyses ? (
                                <motion.div
                                    key={selectedAnalyses._id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                        <div>
                                            <h2 style={{ margin: 0, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                Artifact: {selectedAnalyses.attacker}
                                            </h2>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ID: {selectedAnalyses.battleId} • Recorded: {new Date(selectedAnalyses.timestamp).toLocaleString()}</p>
                                        </div>
                                        <div style={{
                                            padding: '0.75rem 1.5rem',
                                            background: 'rgba(0,0,0,0.4)',
                                            borderRadius: 12,
                                            border: `2px solid ${selectedAnalyses.rounds?.[0]?.findings?.ml?.risk_score > 70 ? 'var(--danger)' : selectedAnalyses.rounds?.[0]?.findings?.ml?.risk_score > 30 ? 'var(--warning)' : 'var(--success)'}`,
                                            textAlign: 'center',
                                            minWidth: '120px'
                                        }}>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', fontWeight: 800 }}>THREAT SCORE</span>
                                            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: selectedAnalyses.rounds?.[0]?.findings?.ml?.risk_score > 70 ? 'var(--danger)' : selectedAnalyses.rounds?.[0]?.findings?.ml?.risk_score > 30 ? 'var(--warning)' : 'var(--success)' }}>
                                                {selectedAnalyses.rounds?.[0]?.findings?.ml?.risk_score || 0}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Detailed Sections */}
                                    {selectedAnalyses.rounds?.[0] && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                                            {/* AI EXECUTIVE SUMMARY */}
                                            {selectedAnalyses.rounds[0].findings?.ai_report && (
                                                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--cyan)', background: 'rgba(0, 255, 255, 0.03)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                        <div className="section-title" style={{ margin: 0 }}>🤖 AI Agent Verdict</div>
                                                        <div style={{
                                                            fontSize: '0.7rem',
                                                            padding: '0.2rem 0.6rem',
                                                            borderRadius: '4px',
                                                            background: 'var(--cyan)',
                                                            color: '#000',
                                                            fontWeight: 800
                                                        }}>
                                                            {selectedAnalyses.rounds[0].findings.ai_report.classification?.toUpperCase()}
                                                        </div>
                                                    </div>
                                                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                                                        {selectedAnalyses.rounds[0].findings.ai_report.summary || "No summary provided by agent."}
                                                    </p>
                                                    <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                        <div>
                                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>IDENTIFIED TECHNOLOGIES</div>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                                {Object.keys(selectedAnalyses.rounds[0].findings.ai_report.technologies || {}).map(t => (
                                                                    <span key={t} style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.4rem', borderRadius: 4 }}>{t}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>SEVERITY LEVEL</div>
                                                            <div style={{ color: selectedAnalyses.rounds[0].findings.ai_report.severity === 'critical' ? 'var(--danger)' : 'var(--warning)', fontWeight: 700, fontSize: '0.85rem' }}>
                                                                {selectedAnalyses.rounds[0].findings.ai_report.severity?.toUpperCase()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* DOCUMENT FORENSICS (IF APPLICABLE) */}
                                            {selectedAnalyses.rounds[0].findings?.ml?.document_forensics && (
                                                <div>
                                                    <div className="section-title">📄 Document Forensic Analysis</div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                                        <div className="card" style={{ padding: '1rem' }}>
                                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>MIME TYPE</div>
                                                            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{selectedAnalyses.rounds[0].findings.ml.document_forensics.type}</div>
                                                        </div>
                                                        <div className="card" style={{ padding: '1rem' }}>
                                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>MACROS DETECTED</div>
                                                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: selectedAnalyses.rounds[0].findings.ml.document_forensics.features?.hasMacros ? 'var(--danger)' : 'var(--success)' }}>
                                                                {selectedAnalyses.rounds[0].findings.ml.document_forensics.features?.hasMacros ? 'YES' : 'NO'}
                                                            </div>
                                                        </div>
                                                        <div className="card" style={{ padding: '1rem' }}>
                                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>SUSPICIOUS OBJECTS</div>
                                                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: selectedAnalyses.rounds[0].findings.ml.document_forensics.features?.hasSuspiciousObjects ? 'var(--danger)' : 'var(--success)' }}>
                                                                {selectedAnalyses.rounds[0].findings.ml.document_forensics.features?.hasSuspiciousObjects ? 'YES' : 'NO'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {selectedAnalyses.rounds[0].findings.ml.document_forensics.indicators?.length > 0 && (
                                                        <div style={{ marginTop: '1rem' }}>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>FORENSIC INDICATORS</div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                                {selectedAnalyses.rounds[0].findings.ml.document_forensics.indicators.map((ind, i) => (
                                                                    <div key={i} style={{ fontSize: '0.75rem', color: 'var(--danger)', background: 'rgba(255,0,0,0.05)', padding: '0.4rem 0.8rem', borderRadius: 6, borderLeft: '2px solid var(--danger)' }}>
                                                                        {ind}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* MITRE ATT&CK MAPPINGS */}
                                            {selectedAnalyses.rounds[0].findings?.ai_report?.mitre?.length > 0 && (
                                                <div>
                                                    <div className="section-title">🛡️ MITRE ATT&CK® Correlation</div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                                        {selectedAnalyses.rounds[0].findings.ai_report.mitre.map((tech, i) => (
                                                            <div key={i} className="card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--cyan)' }}>{tech.id}</span>
                                                                    <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>{tech.tactic?.toUpperCase()}</span>
                                                                </div>
                                                                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>{tech.technique}</div>
                                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{tech.description}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* IOCS & NETWORK */}
                                            <div>
                                                <div className="section-title">🌍 Extracted Intelligence (IOCs)</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                    <div className="card" style={{ padding: '1.2rem' }}>
                                                        <div style={{ fontSize: '0.65rem', color: 'var(--cyan)', fontWeight: 800, marginBottom: '1rem' }}>NETWORK CALLS</div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                            {selectedAnalyses.rounds[0].findings?.ai_report?.iocs?.ips?.length > 0 ? (
                                                                selectedAnalyses.rounds[0].findings.ai_report.iocs.ips.map((ip, i) => (
                                                                    <div key={i} style={{ fontSize: '0.8rem', fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between' }}>
                                                                        <span>{ip}</span>
                                                                        <span style={{ color: 'var(--danger)', fontSize: '0.6rem' }}>MALICIOUS</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No network IOCs found.</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="card" style={{ padding: '1.2rem' }}>
                                                        <div style={{ fontSize: '0.65rem', color: 'var(--cyan)', fontWeight: 800, marginBottom: '1rem' }}>PERSISTENCE ARTIFACTS</div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                            {selectedAnalyses.rounds[0].findings?.ai_report?.iocs?.files?.length > 0 ? (
                                                                selectedAnalyses.rounds[0].findings.ai_report.iocs.files.map((f, i) => (
                                                                    <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f}</div>
                                                                ))
                                                            ) : (
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No file artifacts found.</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RECOMMENDED MITIGATIONS */}
                                            {selectedAnalyses.rounds[0].findings?.ai_report?.mitigations?.length > 0 && (
                                                <div style={{ marginBottom: '2rem' }}>
                                                    <div className="section-title">⚡ Autonomous Remediation Plan</div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                        {selectedAnalyses.rounds[0].findings.ai_report.mitigations.map((m, i) => (
                                                            <div key={i} className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--success)', background: 'rgba(0, 255, 0, 0.02)' }}>
                                                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--success)' }}>{m.action}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{m.rationale}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                    Select an investigation from the sidebar to view the forensic report.
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
