import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -16 }
}

export default function BatchScanner() {
    const [files, setFiles] = useState([])
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)

    const onDrop = useCallback((accepted) => setFiles(prev => [...prev, ...accepted]), [])
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true, maxSize: 50 * 1024 * 1024 })

    const analyze = async () => {
        if (!files.length) return
        setLoading(true)
        setResults([])
        setProgress(0)

        const form = new FormData()
        files.forEach(f => form.append('files', f))

        try {
            const res = await axios.post('/api/batch', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => setProgress(Math.round((e.loaded / e.total) * 50))
            })
            setProgress(100)
            setResults(res.data.results || [])
        } catch (err) {
            alert('Batch analysis failed: ' + (err.response?.data?.error || err.message))
        } finally {
            setLoading(false)
        }
    }

    const malwareCount = results.filter(r => r.is_malware).length
    const cleanCount = results.filter(r => !r.is_malware && !r.error).length

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <div className="page-title">Batch Scanner</div>
            <div className="page-subtitle">Analyze multiple files simultaneously</div>

            {/* Drop Zone */}
            <div {...getRootProps()} style={{
                border: `2px dashed ${isDragActive ? 'var(--cyan)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)', padding: '3rem 2rem', textAlign: 'center',
                cursor: 'pointer', background: isDragActive ? 'var(--cyan-dim)' : 'var(--bg-card)',
                transition: 'all 0.2s ease', marginBottom: '1.5rem'
            }}>
                <input {...getInputProps()} />
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</div>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                    {isDragActive ? 'Drop files here!' : 'Drag & drop multiple files'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {files.length > 0 ? `${files.length} file(s) selected` : 'or click to browse · Max 50 files'}
                </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div className="section-title" style={{ margin: 0 }}>📋 {files.length} Files Selected</div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setFiles([])}>Clear All</button>
                            <button className="btn btn-primary" onClick={analyze} disabled={loading}>
                                {loading ? '⏳ Analyzing...' : '🔬 Analyze All'}
                            </button>
                        </div>
                    </div>
                    {loading && (
                        <div style={{ marginBottom: '1rem' }}>
                            <div className="progress-bar" style={{ height: 6 }}>
                                <div className="progress-fill" style={{ width: `${progress}%`, background: 'var(--cyan)' }} />
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{progress}% complete</div>
                        </div>
                    )}
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {files.map((f, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                                <span className="mono">{f.name}</span>
                                <span style={{ color: 'var(--text-muted)' }}>{(f.size / 1024).toFixed(1)} KB</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Results */}
            {results.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    {/* Summary */}
                    <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
                        <div className="stat-card"><span className="stat-label">Total</span><span className="stat-value" style={{ color: 'var(--cyan)' }}>{results.length}</span></div>
                        <div className="stat-card"><span className="stat-label">Malware</span><span className="stat-value" style={{ color: 'var(--red)' }}>{malwareCount}</span></div>
                        <div className="stat-card"><span className="stat-label">Clean</span><span className="stat-value" style={{ color: 'var(--green)' }}>{cleanCount}</span></div>
                        <div className="stat-card"><span className="stat-label">Detection Rate</span><span className="stat-value" style={{ color: 'var(--yellow)' }}>{results.length > 0 ? ((malwareCount / results.length) * 100).toFixed(0) : 0}%</span></div>
                    </div>

                    <div className="card" style={{ padding: 0 }}>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr><th>Filename</th><th>Status</th><th>Type</th><th>Confidence</th><th>Category</th></tr>
                                </thead>
                                <tbody>
                                    {results.map((r, i) => (
                                        <tr key={i}>
                                            <td className="mono" style={{ fontSize: '0.85rem' }}>{r.filename}</td>
                                            <td>
                                                {r.error
                                                    ? <span className="badge badge-warning">⚠ Error</span>
                                                    : <span className={`badge ${r.is_malware ? 'badge-danger' : 'badge-success'}`}>{r.is_malware ? '⚠ Malware' : '✓ Clean'}</span>
                                                }
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{r.malware_type || '—'}</td>
                                            <td className="mono" style={{ fontSize: '0.85rem', color: r.confidence > 0.7 ? 'var(--red)' : 'var(--text-secondary)' }}>
                                                {r.confidence ? `${(r.confidence * 100).toFixed(1)}%` : '—'}
                                            </td>
                                            <td><span className="badge badge-info">{r.file_category || '—'}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    )
}
