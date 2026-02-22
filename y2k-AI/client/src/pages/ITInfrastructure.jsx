import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 }
};

export default function ITInfrastructure() {
    const [assets, setAssets] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [assetRes, statRes] = await Promise.all([
                    axios.get('/api/infra/assets'),
                    axios.get('/api/infra/stats')
                ]);
                setAssets(assetRes.data);
                setStats(statRes.data);
            } catch (err) {
                console.error('Failed to fetch infrastructure data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate">
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="page-title">IT Infrastructure Security</h1>
                    <p className="page-subtitle">Asset inventory and vulnerability lifecycle management</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="stat-box" style={{ padding: '0.4rem 1rem', background: 'rgba(0,212,255,0.05)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>PATCH COMPLIANCE</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: (stats?.average_patch_level || 0) > 80 ? 'var(--success)' : '#ffaa00' }}>
                            {stats?.average_patch_level || 100}%
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <VulnStat label="Critical" count={stats?.vulnerabilities?.critical || 0} color="var(--danger)" />
                <VulnStat label="High" count={stats?.vulnerabilities?.high || 0} color="#ffaa00" />
                <VulnStat label="Medium" count={stats?.vulnerabilities?.medium || 0} color="var(--cyan)" />
                <VulnStat label="Low" count={stats?.vulnerabilities?.low || 0} color="#8892b0" />
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                    <div className="section-title" style={{ marginBottom: 0 }}>🖥️ Asset Inventory</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', color: '#8892b0' }}>HOSTNAME</th>
                                <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', color: '#8892b0' }}>IP ADDRESS</th>
                                <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', color: '#8892b0' }}>OS / TYPE</th>
                                <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', color: '#8892b0' }}>STATUS</th>
                                <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', color: '#8892b0' }}>PATCH</th>
                                <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', color: '#8892b0' }}>VULNS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.map(asset => (
                                <tr key={asset._id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                                    <td style={{ padding: '0.75rem 1.25rem' }}>
                                        <div style={{ fontWeight: 700 }}>{asset.hostname}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{asset.type.toUpperCase()}</div>
                                    </td>
                                    <td style={{ padding: '0.75rem 1.25rem', fontFamily: 'var(--font-mono)' }}>{asset.ip}</td>
                                    <td style={{ padding: '0.75rem 1.25rem' }}>{asset.os}</td>
                                    <td style={{ padding: '0.75rem 1.25rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.65rem', fontWeight: 700,
                                            background: asset.status === 'online' ? 'rgba(0,255,136,0.1)' : 'rgba(255,170,0,0.1)',
                                            color: asset.status === 'online' ? 'var(--success)' : '#ffaa00'
                                        }}>
                                            {asset.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1.25rem' }}>
                                        <div style={{ width: '100%', height: 4, background: 'var(--bg-primary)', borderRadius: 2, marginBottom: '0.2rem' }}>
                                            <div style={{ width: `${asset.patchLevel}%`, height: '100%', background: asset.patchLevel > 80 ? 'var(--success)' : '#ffaa00', borderRadius: 2 }} />
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{asset.patchLevel}%</span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1.25rem' }}>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            {asset.vulnerabilities.length > 0 ? (
                                                asset.vulnerabilities.slice(0, 3).map((v, i) => (
                                                    <span key={i} style={{
                                                        width: 12, height: 12, borderRadius: 2,
                                                        background: v.severity === 'critical' ? 'var(--danger)' : v.severity === 'high' ? '#ffaa00' : 'var(--cyan)'
                                                    }} title={v.cve} />
                                                ))
                                            ) : (
                                                <span style={{ color: 'var(--success)' }}>✅</span>
                                            )}
                                            {asset.vulnerabilities.length > 3 && <span style={{ fontSize: '0.7rem' }}>+{asset.vulnerabilities.length - 3}</span>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}

function VulnStat({ label, count, color }) {
    return (
        <div className="card" style={{ padding: '1rem', borderLeft: `3px solid ${color}` }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8892b0', marginBottom: '0.25rem' }}>{label.toUpperCase()}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{count}</div>
        </div>
    );
}
