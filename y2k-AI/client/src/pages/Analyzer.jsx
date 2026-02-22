import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -16 }
}

const STEPS = [
    { id: 'static', label: 'Static Analysis', icon: '🔍' },
    { id: 'ml', label: 'ML Prediction', icon: '🧠' },
    { id: 'virustotal', label: 'VirusTotal Check', icon: '🌐' },
    { id: 'explain', label: 'AI Explanation', icon: '💡' },
]

export default function Analyzer() {
    const [file, setFile] = useState(null)
    const [status, setStatus] = useState('idle') // idle | uploading | analyzing | done | error
    const [currentStep, setCurrentStep] = useState(null)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)

    const onDrop = useCallback((accepted) => {
        if (accepted[0]) setFile(accepted[0])
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, multiple: false, maxSize: 50 * 1024 * 1024
    })

    const analyze = async () => {
        if (!file) return
        setStatus('uploading')
        setResult(null)
        setError(null)

        // WebSocket for live steps
        const ws = new WebSocket(`ws://${window.location.host}/ws`)
        ws.onmessage = (e) => {
            const data = JSON.parse(e.data)
            if (data.type === 'analysis_step') setCurrentStep(data.step)
        }

        const form = new FormData()
        form.append('file', file)
        setStatus('analyzing')

        try {
            const res = await axios.post('/api/analyze', form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setResult(res.data)
            setStatus('done')
        } catch (err) {
            setError(err.response?.data?.error || err.message)
            setStatus('error')
        } finally {
            ws.close()
            setCurrentStep(null)
        }
    }

    const reset = () => {
        setFile(null)
        setResult(null)
        setError(null)
        setStatus('idle')
    }

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <div className="page-title">File Analyzer</div>
            <div className="page-subtitle">Upload a file for comprehensive AI-powered malware analysis</div>

            {/* Drop Zone */}
            {status === 'idle' && (
                <div
                    {...getRootProps()}
                    style={{
                        border: `2px dashed ${isDragActive ? 'var(--cyan)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-lg)',
                        padding: '4rem 2rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: isDragActive ? 'var(--cyan-dim)' : 'var(--bg-card)',
                        transition: 'all 0.2s ease',
                        marginBottom: '1.5rem'
                    }}
                >
                    <input {...getInputProps()} />
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        {isDragActive ? 'Drop it here!' : 'Drag & drop a file here'}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        or click to browse · Max 50MB · EXE, DLL, PDF, Office, Scripts
                    </div>
                </div>
            )}

            {/* Selected File */}
            {file && status === 'idle' && (
                <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '2rem' }}>📄</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{file.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {(file.size / 1024).toFixed(1)} KB · {file.type || 'Unknown type'}
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={analyze}>🔬 Analyze</button>
                    <button className="btn btn-ghost" onClick={reset}>✕</button>
                </motion.div>
            )}

            {/* Analysis Progress */}
            {(status === 'uploading' || status === 'analyzing') && (
                <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '1.5rem' }}>
                    <div className="section-title">🔄 Analyzing: {file?.name}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {STEPS.map((step, i) => {
                            const stepIndex = STEPS.findIndex(s => s.id === currentStep)
                            const isDone = stepIndex > i
                            const isActive = currentStep === step.id
                            return (
                                <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: '50%',
                                        background: isDone ? 'var(--green-dim)' : isActive ? 'var(--cyan-dim)' : 'var(--bg-secondary)',
                                        border: `2px solid ${isDone ? 'var(--green)' : isActive ? 'var(--cyan)' : 'var(--border)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.9rem', transition: 'all 0.3s ease'
                                    }}>
                                        {isDone ? '✓' : isActive ? <span className="blink">●</span> : step.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--cyan)' : isDone ? 'var(--green)' : 'var(--text-secondary)' }}>
                                            {step.label}
                                        </div>
                                    </div>
                                    {isActive && <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>Running...</div>}
                                    {isDone && <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--green)' }}>Done</div>}
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
            )}

            {/* Error */}
            {status === 'error' && (
                <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ borderColor: 'var(--red)', marginBottom: '1.5rem' }}>
                    <div style={{ color: 'var(--red)', fontWeight: 600, marginBottom: '0.5rem' }}>❌ Analysis Failed</div>
                    <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{error}</div>
                    <button className="btn btn-ghost btn-sm" onClick={reset} style={{ marginTop: '1rem' }}>Try Again</button>
                </motion.div>
            )}

            {/* Results */}
            <AnimatePresence>
                {result && status === 'done' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {/* Verdict Banner */}
                        <div className="card" style={{
                            borderColor: result.is_malware ? 'var(--red)' : 'var(--green)',
                            background: result.is_malware ? 'rgba(255,51,102,0.05)' : 'rgba(0,255,136,0.05)',
                            marginBottom: '1.5rem',
                            display: 'flex', alignItems: 'center', gap: '1.5rem'
                        }}>
                            <div style={{ fontSize: '3rem' }}>{result.is_malware ? '⚠️' : '✅'}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: result.is_malware ? 'var(--red)' : 'var(--green)' }}>
                                    {result.is_malware ? 'MALWARE DETECTED' : 'FILE IS CLEAN'}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    {result.malware_type !== 'Unknown' ? `Type: ${result.malware_type} · ` : ''}
                                    Confidence: {(result.confidence * 100).toFixed(1)}%
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={reset}>Analyze Another</button>
                        </div>

                        {/* File Info */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className="card">
                                <div className="section-title">📄 File Information</div>
                                <InfoRow label="Filename" value={result.filename} mono />
                                <InfoRow label="Size" value={`${(result.file_size / 1024).toFixed(1)} KB`} />
                                <InfoRow label="Category" value={result.file_category} />
                                <InfoRow label="MD5" value={result.hashes?.md5} mono small />
                                <InfoRow label="SHA256" value={result.hashes?.sha256?.slice(0, 32) + '...'} mono small />
                            </div>

                            {/* Risk Gauge */}
                            <div className="card">
                                <div className="section-title">🎯 Risk Assessment</div>
                                <RiskGauge confidence={result.confidence} isMalware={result.is_malware} />
                            </div>
                        </div>

                        {/* SHAP Explanation */}
                        {result.explanation?.top_features && (
                            <div className="card" style={{ marginBottom: '1.5rem' }}>
                                <div className="section-title">💡 AI Explanation — Top Contributing Features</div>
                                <FeatureChart features={result.explanation.top_features} />
                            </div>
                        )}

                        {/* VirusTotal */}
                        {result.virustotal && !result.virustotal.error && (
                            <div className="card" style={{ marginBottom: '1.5rem' }}>
                                <div className="section-title">🌐 VirusTotal Results</div>
                                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 700, color: result.virustotal.positives > 0 ? 'var(--red)' : 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                                            {result.virustotal.positives}/{result.virustotal.total}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Engines Detected</div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{
                                                width: `${(result.virustotal.positives / result.virustotal.total) * 100}%`,
                                                background: result.virustotal.positives > 5 ? 'var(--red)' : result.virustotal.positives > 0 ? 'var(--yellow)' : 'var(--green)'
                                            }} />
                                        </div>
                                        <a href={result.virustotal.permalink} target="_blank" rel="noreferrer"
                                            style={{ color: 'var(--cyan)', fontSize: '0.8rem', marginTop: '0.5rem', display: 'block' }}>
                                            View full report on VirusTotal →
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Raw Details */}
                        <details className="card">
                            <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                🔧 Raw Analysis Details
                            </summary>
                            <pre style={{ marginTop: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'auto', maxHeight: 400 }}>
                                {JSON.stringify(result.details, null, 2)}
                            </pre>
                        </details>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

function InfoRow({ label, value, mono, small }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontFamily: mono ? 'var(--font-mono)' : 'inherit', fontSize: small ? '0.75rem' : '0.85rem', color: 'var(--text-primary)', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {value || '—'}
            </span>
        </div>
    )
}

function RiskGauge({ confidence, isMalware }) {
    const pct = Math.round(confidence * 100)
    const color = pct > 70 ? 'var(--red)' : pct > 40 ? 'var(--yellow)' : 'var(--green)'
    return (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>{pct}%</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Confidence Score</div>
            <div className="progress-bar" style={{ height: 8 }}>
                <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color }}>
                {pct > 70 ? '🔴 High Risk' : pct > 40 ? '🟡 Medium Risk' : '🟢 Low Risk'}
            </div>
        </div>
    )
}

function FeatureChart({ features }) {
    const data = features.slice(0, 10).map(f => ({
        name: f.feature?.replace(/_/g, ' ').slice(0, 20) || f.name,
        value: Math.abs(f.shap_value || f.importance || 0),
        positive: (f.shap_value || 0) > 0
    }))

    return (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
                <XAxis type="number" tick={{ fill: '#4a5568', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#8892a4', fontSize: 11 }} width={120} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 8 }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {data.map((d, i) => <Cell key={i} fill={d.positive ? 'var(--danger)' : 'var(--info)'} />)}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}
