import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 }
};

export default function BankingSecurity() {
    const [transactions, setTransactions] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [txRes, alertRes, metricRes] = await Promise.all([
                    axios.get('/api/banking/transactions'),
                    axios.get('/api/banking/alerts'),
                    axios.get('/api/banking/metrics')
                ]);
                setTransactions(txRes.data);
                setAlerts(alertRes.data);
                setMetrics(metricRes.data);
            } catch (err) {
                console.error('Failed to fetch banking data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate">
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="page-title">Banking Security & Fraud Detection</h1>
                <p className="page-subtitle">Real-time financial transaction monitoring and threat analysis</p>
            </div>

            {/* Top Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <MetricCard
                    label="Fraud Prevention Rate"
                    value={metrics?.fraud_prevention_rate}
                    color="var(--success)"
                    icon="🛡️"
                />
                <MetricCard
                    label="Blocked Volume (24h)"
                    value={metrics?.blocked_volume_24h}
                    color="var(--cyan)"
                    icon="💰"
                />
                <MetricCard
                    label="Active Fraud Alerts"
                    value={metrics?.active_alerts}
                    color="var(--danger)"
                    icon="⚠️"
                />
                <MetricCard
                    label="PCI-DSS Score"
                    value={`${metrics?.pci_compliance_score}%`}
                    color="var(--primary)"
                    icon="🏛️"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                {/* Transaction Feed */}
                <div className="card" style={{ padding: '0' }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                        <div className="section-title" style={{ marginBottom: 0 }}>💸 Live Transaction Stream</div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', color: '#8892b0' }}>ID</th>
                                    <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', color: '#8892b0' }}>MERCHANT</th>
                                    <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', color: '#8892b0' }}>AMOUNT</th>
                                    <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', color: '#8892b0' }}>RISK</th>
                                    <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', color: '#8892b0' }}>LOC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(tx => (
                                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                                        <td style={{ padding: '0.75rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{tx.id}</td>
                                        <td style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}>{tx.merchant}</td>
                                        <td style={{ padding: '0.75rem 1.25rem' }}>{tx.amount.toLocaleString('en-US', { style: 'currency', currency: tx.currency })}</td>
                                        <td style={{ padding: '0.75rem 1.25rem' }}>
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: 4,
                                                background: tx.risk === 'critical' || tx.risk === 'high' ? 'rgba(255,51,102,0.1)' : 'rgba(0,212,255,0.1)',
                                                color: tx.risk === 'critical' || tx.risk === 'high' ? 'var(--danger)' : 'var(--cyan)'
                                            }}>{tx.risk.toUpperCase()}</span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-muted)' }}>{tx.location}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Fraud Alerts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card">
                        <div className="section-title">🚨 Fraud Alerts</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {alerts.map(alert => (
                                <div key={alert.id} style={{
                                    padding: '1rem', background: 'var(--bg-primary)', borderRadius: 12,
                                    borderLeft: `3px solid ${alert.severity === 'critical' ? 'var(--danger)' : '#ffaa00'}`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{alert.type}</span>
                                        <span style={{
                                            fontSize: '0.65rem', padding: '0.1rem 0.3rem', borderRadius: 4, background: 'rgba(255,255,255,0.05)',
                                            color: '#8892b0'
                                        }}>{alert.status.replace('_', ' ').toUpperCase()}</span>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{alert.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ background: 'var(--bg-secondary), rgba(0,212,255,0.02))' }}>
                        <div className="section-title">🧠 Fraud Intelligence</div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Identifying anomalies with <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>AI Isolation Forest</span> models. Currently monitoring for large-scale "Silver-Liner" banking trojan infrastructure.
                        </p>
                        <div style={{
                            padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 8,
                            border: '1px solid rgba(0,212,255,0.2)', fontSize: '0.8rem'
                        }}>
                            <span style={{ color: 'var(--success)' }}>●</span> Model active: tx_classifier_v4.2<br />
                            <span style={{ color: 'var(--success)' }}>●</span> Latency: 14ms per tx
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function MetricCard({ label, value, color, icon }) {
    return (
        <div className="card" style={{ padding: '1.25rem', borderLeft: `3px solid ${color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: '#8892b0', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
                <span style={{ fontSize: '1.2rem' }}>{icon}</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{value}</div>
        </div>
    );
}
