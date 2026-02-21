import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import axios from 'axios'

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -16 }
}

export default function Reports() {
    const [scans, setScans] = useState([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [pages, setPages] = useState(1)
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({ search: '', is_malware: '', malware_type: 'all' })

    const MALWARE_TYPES = ['all', 'Ransomware', 'Trojan', 'Worm', 'Spyware', 'Virus', 'Unknown']

    const fetchReports = async () => {
        setLoading(true)
        try {
            const params = { page, limit: 20, ...filters }
            if (!params.is_malware) delete params.is_malware
            if (params.malware_type === 'all') delete params.malware_type
            const res = await axios.get('/api/reports', { params })
            setScans(res.data.scans)
            setTotal(res.data.total)
            setPages(res.data.pages)
        } catch { setScans([]) }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchReports() }, [page, filters])

    const deleteReport = async (id) => {
        if (!confirm('Delete this report?')) return
        await axios.delete(`/api/reports/${id}`)
        fetchReports()
    }

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <div className="page-title">Reports</div>
            <div className="page-subtitle">Scan history — {total} total records</div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input className="input" style={{ maxWidth: 280 }} placeholder="🔍 Search filename..."
                    value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />

                <select className="input" style={{ maxWidth: 160 }}
                    value={filters.is_malware} onChange={e => setFilters(f => ({ ...f, is_malware: e.target.value }))}>
                    <option value="">All Status</option>
                    <option value="true">Malware</option>
                    <option value="false">Clean</option>
                </select>

                <select className="input" style={{ maxWidth: 160 }}
                    value={filters.malware_type} onChange={e => setFilters(f => ({ ...f, malware_type: e.target.value }))}>
                    {MALWARE_TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>)}
                </select>

                <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ search: '', is_malware: '', malware_type: 'all' })}>
                    Clear Filters
                </button>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0 }}>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Filename</th>
                                <th>Status</th>
                                <th>Type</th>
                                <th>Confidence</th>
                                <th>Category</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</td></tr>
                            ) : scans.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No reports found</td></tr>
                            ) : scans.map(scan => (
                                <tr key={scan._id}>
                                    <td>
                                        <Link to={`/reports/${scan._id}`} style={{ color: 'var(--cyan)', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                                            {scan.filename}
                                        </Link>
                                    </td>
                                    <td><span className={`badge ${scan.is_malware ? 'badge-danger' : 'badge-success'}`}>{scan.is_malware ? '⚠ Malware' : '✓ Clean'}</span></td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{scan.malware_type || '—'}</td>
                                    <td><span className="mono" style={{ fontSize: '0.85rem', color: scan.confidence > 0.7 ? 'var(--red)' : 'var(--text-secondary)' }}>
                                        {scan.confidence ? `${(scan.confidence * 100).toFixed(1)}%` : '—'}
                                    </span></td>
                                    <td><span className="badge badge-info">{scan.file_category || '—'}</span></td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(scan.timestamp).toLocaleString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Link to={`/reports/${scan._id}`} className="btn btn-ghost btn-sm">View</Link>
                                            <button className="btn btn-ghost btn-sm" onClick={() => deleteReport(scan._id)} style={{ color: 'var(--red)' }}>✕</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderTop: '1px solid var(--border)' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                        <span style={{ padding: '0.4rem 0.8rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Page {page} of {pages}</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>Next →</button>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
