import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -16 }
}

export default function ReportDetail() {
    const { id } = useParams()
    const [scan, setScan] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        axios.get(`/api/reports/${id}`)
            .then(r => setScan(r.data))
            .catch(() => setScan(null))
            .finally(() => setLoading(false))
    }, [id])

    if (loading) return <div className="page-container" style={{ color: 'var(--text-muted)' }}>Loading report...</div>
    if (!scan) return <div className="page-container"><div style={{ color: 'var(--red)' }}>Report not found.</div><Link to="/reports" className="btn btn-ghost btn-sm" style={{ marginTop: '1rem' }}>← Back</Link></div>

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <Link to="/reports" className="btn btn-ghost btn-sm">← Back</Link>
                <div>
                    <div className="page-title" style={{ margin: 0 }}>{scan.filename}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(scan.timestamp).toLocaleString()}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <span className={`badge ${scan.is_malware ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
                        {scan.is_malware ? '⚠ MALWARE' : '✓ CLEAN'}
                    </span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="card">
                    <div className="section-title">📄 File Details</div>
                    {[
                        ['Filename', scan.filename],
                        ['Size', scan.file_size ? `${(scan.file_size / 1024).toFixed(1)} KB` : '—'],
                        ['Category', scan.file_category],
                        ['Malware Type', scan.malware_type],
                        ['Confidence', scan.confidence ? `${(scan.confidence * 100).toFixed(1)}%` : '—'],
                    ].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{k}</span>
                            <span style={{ fontSize: '0.85rem' }}>{v || '—'}</span>
                        </div>
                    ))}
                </div>

                <div className="card">
                    <div className="section-title">🔑 File Hashes</div>
                    {[['MD5', scan.hashes?.md5], ['SHA1', scan.hashes?.sha1], ['SHA256', scan.hashes?.sha256]].map(([k, v]) => (
                        <div key={k} style={{ marginBottom: '0.75rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{k}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--cyan)', wordBreak: 'break-all' }}>{v || '—'}</div>
                        </div>
                    ))}
                </div>
            </div>

            {scan.virustotal && !scan.virustotal.error && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="section-title">🌐 VirusTotal</div>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: scan.virustotal.positives > 0 ? 'var(--red)' : 'var(--green)' }}>
                                {scan.virustotal.positives}/{scan.virustotal.total}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Engines Detected</div>
                        </div>
                        <a href={scan.virustotal.permalink} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                            View on VirusTotal →
                        </a>
                    </div>
                </div>
            )}

            <details className="card">
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)' }}>🔧 Full Analysis Details</summary>
                <pre style={{ marginTop: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'auto', maxHeight: 500 }}>
                    {JSON.stringify(scan.details, null, 2)}
                </pre>
            </details>
        </motion.div>
    )
}
