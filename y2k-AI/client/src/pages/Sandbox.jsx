import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import Terminal from '../components/Terminal'

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -16 }
}

const SEVERITY_COLORS = { critical: 'var(--danger)', high: '#ff6600', medium: '#ffaa00', low: 'var(--info)', unknown: '#888' }

// ── SSH Connect Panel ─────────────────────────────────────────────────────────
function SSHPanel({ onConnected }) {
    const [config, setConfig] = useState(() => {
        try { return { ...JSON.parse(localStorage.getItem('y2k_ssh_config') || '{}'), password: '', privateKey: '' } }
        catch { return { ssh_host: '', ssh_port: '22', ssh_user: 'root', ssh_auth: 'password' } }
    })
    const [connecting, setConnecting] = useState(false)
    const [error, setError] = useState('')

    const update = (k, v) => setConfig(s => ({ ...s, [k]: v }))

    const connect = async () => {
        setConnecting(true)
        setError('')
        try {
            const res = await axios.post('/api/sandbox/connect', {
                host: config.ssh_host, port: config.ssh_port || 22,
                username: config.ssh_user, password: config.password,
                privateKey: config.privateKey, authMethod: config.ssh_auth || 'password'
            })
            onConnected(res.data)
        } catch (err) {
            setError(err.response?.data?.error || err.message)
        } finally {
            setConnecting(false)
        }
    }

    return (
        <div className="card" style={{ borderColor: 'rgba(0,212,255,0.3)' }}>
            <div className="section-title" style={{ color: 'var(--cyan)' }}>🖥️ Connect to Sandbox VM</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', padding: '0.6rem 0.9rem', background: 'rgba(0,212,255,0.05)', borderRadius: 8, border: '1px solid rgba(0,212,255,0.15)' }}>
                Connect your VM via SSH. The platform will create an isolated temp directory for safe malware execution. All execution happens on your VM only.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <input className="input" placeholder="VM Host / IP (e.g. 192.168.1.100)" value={config.ssh_host || ''} onChange={e => update('ssh_host', e.target.value)} />
                <input className="input" placeholder="Port" value={config.ssh_port || '22'} onChange={e => update('ssh_port', e.target.value)} style={{ width: 80 }} />
            </div>
            <input className="input" placeholder="Username (e.g. root)" value={config.ssh_user || ''} onChange={e => update('ssh_user', e.target.value)} style={{ marginBottom: '0.75rem' }} />

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {['password', 'key'].map(m => (
                    <button key={m} onClick={() => update('ssh_auth', m)} style={{
                        padding: '0.35rem 0.9rem', borderRadius: 6, border: '1px solid',
                        borderColor: config.ssh_auth === m ? 'var(--cyan)' : 'var(--border)',
                        background: config.ssh_auth === m ? 'rgba(0,212,255,0.1)' : 'var(--bg-secondary)',
                        color: config.ssh_auth === m ? 'var(--cyan)' : 'var(--text-muted)',
                        cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600
                    }}>{m === 'password' ? '🔑 Password' : '📄 Private Key'}</button>
                ))}
            </div>

            {config.ssh_auth !== 'key'
                ? <input className="input" type="password" placeholder="Password" value={config.password || ''} onChange={e => update('password', e.target.value)} style={{ marginBottom: '0.75rem' }} />
                : <textarea className="input" placeholder="Paste PEM private key..." value={config.privateKey || ''} onChange={e => update('privateKey', e.target.value)} style={{ marginBottom: '0.75rem', height: 80, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }} />
            }

            {error && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)' }}>✗ {error}</div>}

            <button onClick={connect} disabled={connecting || !config.ssh_host} style={{
                width: '100%', padding: '0.65rem', fontWeight: 700,
                background: connecting || !config.ssh_host ? 'var(--bg-secondary)' : 'var(--bg-secondary),#0066cc)',
                color: connecting || !config.ssh_host ? 'var(--text-muted)' : '#fff',
                border: 'none', borderRadius: 8, cursor: connecting || !config.ssh_host ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem', transition: 'all 0.2s'
            }}>{connecting ? '⏳ Connecting...' : '🔌 Connect & Create Sandbox'}</button>
        </div>
    )
}

// ── Upload Panel ──────────────────────────────────────────────────────────────
function UploadPanel({ sessionId, onUploaded }) {
    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')
    const inputRef = useRef()

    const upload = async () => {
        if (!file) return
        setUploading(true)
        setError('')
        const fd = new FormData()
        fd.append('sample', file)
        fd.append('session_id', sessionId)
        try {
            const res = await axios.post('/api/sandbox/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            setResult(res.data)
            onUploaded(res.data)
        } catch (err) {
            setError(err.response?.data?.error || err.message)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="card">
            <div className="section-title">📁 Upload Sample</div>
            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]) }}
                style={{
                    border: `2px dashed ${file ? 'var(--cyan)' : 'var(--border)'}`,
                    borderRadius: 10, padding: '1.5rem', textAlign: 'center', cursor: 'pointer',
                    background: file ? 'rgba(0,212,255,0.05)' : 'var(--bg-secondary)',
                    marginBottom: '0.75rem', transition: 'all 0.2s'
                }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{file ? '📄' : '📂'}</div>
                <div style={{ fontSize: '0.85rem', color: file ? 'var(--cyan)' : 'var(--text-muted)' }}>
                    {file ? file.name : 'Drop malware sample here or click to browse'}
                </div>
                {file && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{(file.size / 1024).toFixed(1)} KB</div>}
            </div>
            <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />

            {error && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>✗ {error}</div>}

            {result && (
                <div style={{ padding: '0.75rem', background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, marginBottom: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                    <div style={{ color: 'var(--success)', marginBottom: '0.25rem' }}>✓ Uploaded to {result.remotePath}</div>
                    <div style={{ color: 'var(--text-muted)' }}>MD5: {result.md5}</div>
                    <div style={{ color: 'var(--text-muted)' }}>SHA256: {result.sha256?.slice(0, 32)}...</div>
                </div>
            )}

            <button onClick={upload} disabled={!file || uploading} style={{
                width: '100%', padding: '0.6rem', fontWeight: 700,
                background: !file || uploading ? 'var(--bg-secondary)' : 'var(--bg-secondary),#0066cc)',
                color: !file || uploading ? 'var(--text-muted)' : '#fff',
                border: 'none', borderRadius: 8, cursor: !file || uploading ? 'not-allowed' : 'pointer', fontSize: '0.85rem'
            }}>{uploading ? '⏳ Uploading...' : '⬆️ Upload to VM'}</button>
        </div>
    )
}

// ── Execution Console ─────────────────────────────────────────────────────────
function ExecutionConsole({ sessionId, onDone }) {
    const [running, setRunning] = useState(false)
    const [output, setOutput] = useState('')
    const [timeout, setTimeout_] = useState(30)
    const [done, setDone] = useState(false)
    const [mode, setMode] = useState('live') // 'live' (terminal) or 'automated' (scripts)
    const consoleRef = useRef()
    const wsRef = useRef()

    useEffect(() => {
        const ws = new WebSocket(`ws://${window.location.hostname}:5000/ws`)
        ws.onmessage = (e) => {
            const data = JSON.parse(e.data)
            if (data.sessionId !== sessionId) return
            if (data.type === 'sandbox_output') {
                setOutput(prev => prev + data.text)
                consoleRef.current?.scrollTo(0, consoleRef.current.scrollHeight)
            }
            if (data.type === 'sandbox_exec_done') {
                setRunning(false)
                setDone(true)
                onDone && onDone()
            }
            if (data.type === 'sandbox_error') {
                setOutput(prev => prev + `\n[ERROR] ${data.error}\n`)
                setRunning(false)
            }
        }
        wsRef.current = ws
        return () => ws.close()
    }, [sessionId])

    const execute = async () => {
        setRunning(true)
        setDone(false)
        setOutput('> Executing sample in sandbox...\n')
        try {
            await axios.post('/api/sandbox/execute', { session_id: sessionId, timeout: timeout })
        } catch (err) {
            setOutput(prev => prev + `\n[ERROR] ${err.response?.data?.error || err.message}\n`)
            setRunning(false)
        }
    }

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="section-title" style={{ marginBottom: 0 }}>⚡ Execution</div>
                    <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 8, padding: '2px', border: '1px solid var(--border)' }}>
                        {['live', 'automated'].map(m => (
                            <button key={m} onClick={() => setMode(m)} style={{
                                padding: '0.3rem 0.75rem', borderRadius: 6, border: 'none',
                                background: mode === m ? 'rgba(0,212,255,0.1)' : 'transparent',
                                color: mode === m ? 'var(--cyan)' : 'var(--text-muted)',
                                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s'
                            }}>{m === 'live' ? '🐚 Interactive Shell' : '🤖 Script Execution'}</button>
                        ))}
                    </div>
                </div>

                {mode === 'automated' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Timeout:</label>
                        <select value={timeout} onChange={e => setTimeout_(Number(e.target.value))} style={{
                            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                            borderRadius: 6, color: 'var(--text-primary)', padding: '0.25rem 0.5rem', fontSize: '0.8rem'
                        }}>
                            {[10, 30, 60, 120].map(t => <option key={t} value={t}>{t}s</option>)}
                        </select>
                        <button onClick={execute} disabled={running} style={{
                            padding: '0.4rem 1rem', fontWeight: 700, fontSize: '0.82rem',
                            background: running ? 'var(--bg-secondary)' : 'var(--bg-secondary),#cc0033)',
                            color: running ? 'var(--text-muted)' : '#fff',
                            border: 'none', borderRadius: 6, cursor: running ? 'not-allowed' : 'pointer'
                        }}>{running ? '⏳ Running...' : '▶ Execute'}</button>
                    </div>
                )}
            </div>

            {/* Console or Terminal */}
            <div style={{ position: 'relative', height: 350 }}>
                {mode === 'automated' ? (
                    <div ref={consoleRef} style={{
                        background: '#0a0a0a', border: '1px solid #333', borderRadius: 8,
                        padding: '1rem', height: '100%', overflowY: 'auto',
                        fontFamily: 'var(--font-mono)', fontSize: '0.78rem', lineHeight: 1.6,
                        color: 'var(--success)', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
                    }}>
                        {output || <span style={{ color: '#555' }}>// Output will appear here when execution starts</span>}
                        {running && <span style={{ color: 'var(--info)' }} className="blink">█</span>}
                    </div>
                ) : (
                    <Terminal sessionId={sessionId} />
                )}
            </div>

            {done && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
                    ✓ Execution complete — scroll down to analyze artifacts
                </div>
            )}
        </div>
    )
}

import RefreshButton from '../components/RefreshButton'

// ── Artifacts Panel ───────────────────────────────────────────────────────────
function ArtifactsPanel({ sessionId }) {
    const [tab, setTab] = useState('processes')
    const [artifacts, setArtifacts] = useState(null)
    const [loading, setLoading] = useState(false)

    const load = async () => {
        setLoading(true)
        try {
            const res = await axios.get(`/api/sandbox/artifacts/${sessionId}`)
            setArtifacts(res.data.artifacts)
        } catch { }
        setLoading(false)
    }

    useEffect(() => { load() }, [sessionId])

    const tabs = [
        { id: 'processes', label: '⚙️ Processes' },
        { id: 'network', label: '🌐 Network' },
        { id: 'files', label: '📁 Files' },
    ]

    const getContent = () => {
        if (!artifacts) return 'No artifacts yet — run execution first'
        if (tab === 'processes') return artifacts.processes?.after || 'No process data'
        if (tab === 'network') return artifacts.network?.after || 'No network data'
        if (tab === 'files') return artifacts.files?.after || 'No file data'
    }

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div className="section-title" style={{ marginBottom: 0 }}>🔬 Artifacts</div>
                <RefreshButton loading={loading} onClick={load} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                        padding: '0.35rem 0.75rem', borderRadius: 6, border: '1px solid',
                        borderColor: tab === t.id ? 'var(--cyan)' : 'var(--border)',
                        background: tab === t.id ? 'rgba(0,212,255,0.1)' : 'var(--bg-secondary)',
                        color: tab === t.id ? 'var(--cyan)' : 'var(--text-muted)',
                        cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600
                    }}>{t.label}</button>
                ))}
            </div>

            <div style={{
                background: '#0a0a0a', border: '1px solid #333', borderRadius: 8,
                padding: '0.75rem', height: 200, overflowY: 'auto',
                fontFamily: 'var(--font-mono)', fontSize: '0.72rem', lineHeight: 1.5,
                color: '#ccc', whiteSpace: 'pre-wrap'
            }}>{getContent()}</div>
        </div>
    )
}

// ── AI Analysis Panel ─────────────────────────────────────────────────────────
function AnalysisPanel({ sessionId, fileInfo }) {
    const [analyzing, setAnalyzing] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')
    const [expandedSections, setExpandedSections] = useState({ behaviors: true, iocs: true, mitre: true, techs: true, actions: true })

    const analyze = async () => {
        setAnalyzing(true)
        setError('')
        try {
            const res = await axios.post('/api/sandbox/analyze', { session_id: sessionId })
            setResult(res.data)
        } catch (err) {
            setError(err.response?.data?.error || err.message)
        } finally {
            setAnalyzing(false)
        }
    }

    const cleanup = async () => {
        try { await axios.delete(`/api/sandbox/session/${sessionId}`) } catch { }
        alert('Sandbox session cleaned up. Temp files deleted from VM.')
    }

    const toggleSection = (key) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const verdict = result?.report?.consolidated_verdict || {}
    const dynamic = result?.report?.dynamic_analysis || {}
    const staticData = result?.report?.static_analysis
    const sevColor = SEVERITY_COLORS[dynamic.severity] || '#888'

    return (
        <div className="card" style={{ borderColor: result ? `${sevColor}40` : 'var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div className="section-title" style={{ marginBottom: 0 }}>🤖 Dynamic Analysis Report</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={cleanup} style={{
                        padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: 'rgba(255,51,102,0.1)',
                        border: '1px solid rgba(255,51,102,0.3)', borderRadius: 6, cursor: 'pointer', color: 'var(--danger)'
                    }}>🗑 Cleanup</button>
                    <button onClick={analyze} disabled={analyzing} style={{
                        padding: '0.35rem 1rem', fontSize: '0.82rem', fontWeight: 700,
                        background: analyzing ? 'var(--bg-secondary)' : 'var(--bg-secondary),#0066cc)',
                        color: analyzing ? 'var(--text-muted)' : '#fff',
                        border: 'none', borderRadius: 6, cursor: analyzing ? 'not-allowed' : 'pointer'
                    }}>{analyzing ? '⏳ Analyzing...' : '🧠 Analyze'}</button>
                </div>
            </div>

            {error && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,51,102,0.1)', borderRadius: 6 }}>✗ {error}</div>}

            {!result && !analyzing && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Run execution first, then click Analyze for comprehensive AI-powered dynamic analysis report
                </div>
            )}

            {result && (
                <div style={{ fontSize: '0.78rem' }}>
                    {/* Consolidated Verdict */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', padding: '0.75rem 1rem', background: `${sevColor}15`, border: `1px solid ${sevColor}40`, borderRadius: 8 }}>
                        <div style={{ fontSize: '1.5rem' }}>
                            {verdict.verdict === 'MALICIOUS' ? '🚨' : verdict.verdict === 'SUSPICIOUS' ? '⚠️' : verdict.verdict === 'CLEAN' ? '✅' : '❓'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: sevColor, textTransform: 'uppercase', fontSize: '0.9rem' }}>
                                {verdict.verdict} {verdict.confidence && `(${verdict.confidence} confidence)`}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                {dynamic.summary || 'Analysis in progress...'}
                            </div>
                            {verdict.action && <div style={{ fontSize: '0.72rem', color: sevColor, marginTop: '0.3rem', fontWeight: 600 }}>▸ ACTION: {verdict.action}</div>}
                        </div>
                        {staticData && (
                            <div style={{ textAlign: 'right', fontSize: '0.72rem' }}>
                                <div style={{ fontWeight: 700 }}>VirusTotal</div>
                                <div style={{ color: staticData.malicious > 0 ? 'var(--danger)' : 'var(--success)' }}>{staticData.malicious}/{staticData.total}</div>
                            </div>
                        )}
                    </div>

                    {/* Behavior Analysis Section */}
                    {dynamic.behaviors && dynamic.behaviors.length > 0 && (
                        <div style={{ marginBottom: '0.75rem' }}>
                            <div onClick={() => toggleSection('behaviors')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: 6, marginBottom: '0.5rem', fontWeight: 600 }}>
                                <span>{expandedSections.behaviors ? '▼' : '▶'}</span>
                                <span>🔍 Observed Behaviors ({dynamic.behaviors.length})</span>
                            </div>
                            {expandedSections.behaviors && (
                                <div style={{ paddingLeft: '1rem' }}>
                                    {dynamic.behaviors.map((b, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                                            <span style={{ color: '#ffaa00', flexShrink: 0 }}>•</span> {b}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* IOCs Section */}
                    {dynamic.iocs && (dynamic.iocs.ips?.length > 0 || dynamic.iocs.domains?.length > 0 || dynamic.iocs.files?.length > 0) && (
                        <div style={{ marginBottom: '0.75rem' }}>
                            <div onClick={() => toggleSection('iocs')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: 6, marginBottom: '0.5rem', fontWeight: 600 }}>
                                <span>{expandedSections.iocs ? '▼' : '▶'}</span>
                                <span>🔓 Indicators of Compromise ({result.report?.analysis_summary?.total_iocs || 0})</span>
                            </div>
                            {expandedSections.iocs && (
                                <div style={{ paddingLeft: '1rem', background: 'rgba(255,170,0,0.05)', padding: '0.5rem 0.75rem', borderRadius: 6 }}>
                                    {dynamic.iocs.ips?.length > 0 && (
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <div style={{ fontWeight: 600, color: '#ffaa00', marginBottom: '0.2rem' }}>IPs ({dynamic.iocs.ips.length})</div>
                                            {dynamic.iocs.ips.map((ip, i) => (
                                                <div key={i} style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>
                                                    {ip.value} {ip.context && <span style={{ color: '#888' }}>— {ip.context}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {dynamic.iocs.domains?.length > 0 && (
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <div style={{ fontWeight: 600, color: '#ffaa00', marginBottom: '0.2rem' }}>Domains ({dynamic.iocs.domains.length})</div>
                                            {dynamic.iocs.domains.map((d, i) => (
                                                <div key={i} style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>
                                                    {d.value} {d.context && <span style={{ color: '#888' }}>— {d.context}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {dynamic.iocs.files?.length > 0 && (
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#ffaa00', marginBottom: '0.2rem' }}>Files ({dynamic.iocs.files.length})</div>
                                            {dynamic.iocs.files.map((f, i) => (
                                                <div key={i} style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>
                                                    {f.value} {f.purpose && <span style={{ color: '#888' }}>— {f.purpose}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* MITRE Section */}
                    {dynamic.techniques && dynamic.techniques.length > 0 && (
                        <div style={{ marginBottom: '0.75rem' }}>
                            <div onClick={() => toggleSection('mitre')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: 6, marginBottom: '0.5rem', fontWeight: 600 }}>
                                <span>{expandedSections.mitre ? '▼' : '▶'}</span>
                                <span>🎯 MITRE ATT&CK Techniques ({dynamic.techniques.length})</span>
                            </div>
                            {expandedSections.mitre && (
                                <div style={{ paddingLeft: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {dynamic.techniques.map((t, i) => (
                                        <div key={i} style={{ padding: '0.35rem 0.6rem', borderRadius: 6, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
                                            <div style={{ fontWeight: 600 }}>{t.id}</div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{t.name}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Technologies Section */}
                    {dynamic.technologies && (dynamic.technologies.implants?.length > 0 || dynamic.technologies.frameworks?.length > 0 || dynamic.technologies.encodings?.length > 0) && (
                        <div style={{ marginBottom: '0.75rem' }}>
                            <div onClick={() => toggleSection('techs')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: 6, marginBottom: '0.5rem', fontWeight: 600 }}>
                                <span>{expandedSections.techs ? '▼' : '▶'}</span>
                                <span>🛠️ Technologies & Frameworks</span>
                            </div>
                            {expandedSections.techs && (
                                <div style={{ paddingLeft: '1rem', background: 'rgba(153,102,255,0.05)', padding: '0.5rem 0.75rem', borderRadius: 6 }}>
                                    {dynamic.technologies.implants?.length > 0 && <div><strong>Implants:</strong> {dynamic.technologies.implants.join(', ')}</div>}
                                    {dynamic.technologies.frameworks?.length > 0 && <div><strong>Frameworks:</strong> {dynamic.technologies.frameworks.join(', ')}</div>}
                                    {dynamic.technologies.encodings?.length > 0 && <div><strong>Encodings:</strong> {dynamic.technologies.encodings.join(', ')}</div>}
                                    {dynamic.technologies.payloads?.length > 0 && <div><strong>Payloads:</strong> {dynamic.technologies.payloads.join(', ')}</div>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Recommended Actions */}
                    {dynamic.recommendedActions && dynamic.recommendedActions.length > 0 && (
                        <div>
                            <div onClick={() => toggleSection('actions')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: 6, marginBottom: '0.5rem', fontWeight: 600 }}>
                                <span>{expandedSections.actions ? '▼' : '▶'}</span>
                                <span>🛡️ Recommended Actions ({dynamic.recommendedActions.length})</span>
                            </div>
                            {expandedSections.actions && (
                                <div style={{ paddingLeft: '1rem' }}>
                                    {dynamic.recommendedActions.map((a, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                                            <span style={{ color: 'var(--success)', flexShrink: 0, fontWeight: 600 }}>{i + 1}.</span> {a}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Sandbox() {
    const [session, setSession] = useState(null)
    const [uploadInfo, setUploadInfo] = useState(null)
    const [execDone, setExecDone] = useState(false)

    const handleConnected = (data) => {
        setSession(data)
        setUploadInfo(null)
        setExecDone(false)
    }

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-secondary),#0066cc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}>🧪</div>
                    <div>
                        <div className="page-title" style={{ marginBottom: 0 }}>Dynamic Analysis Sandbox</div>
                        <div className="page-subtitle" style={{ marginBottom: 0 }}>Execute malware in your isolated VM — AI-guided analysis</div>
                    </div>
                </div>
            </div>

            {/* Status bar */}
            {session && (
                <div style={{ padding: '0.6rem 1rem', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>● CONNECTED</span>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Session: {session.sessionId?.slice(0, 8)}...</span>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Sandbox: {session.sandboxDir}</span>
                    {uploadInfo && <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>📄 {uploadInfo.filename}</span>}
                </div>
            )}

            {/* Workflow steps */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.78rem' }}>
                {['1. Connect VM', '2. Upload Sample', '3. Execute', '4. Analyze'].map((step, i) => {
                    const done = (i === 0 && session) || (i === 1 && uploadInfo) || (i === 2 && execDone) || (i === 3 && false)
                    const active = (i === 0 && !session) || (i === 1 && session && !uploadInfo) || (i === 2 && uploadInfo && !execDone) || (i === 3 && execDone)
                    return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                padding: '0.3rem 0.75rem', borderRadius: 100, fontWeight: 600,
                                background: done ? 'rgba(0,255,136,0.15)' : active ? 'rgba(0,212,255,0.15)' : 'var(--bg-secondary)',
                                border: `1px solid ${done ? 'rgba(0,255,136,0.3)' : active ? 'rgba(0,212,255,0.3)' : 'var(--border)'}`,
                                color: done ? 'var(--success)' : active ? 'var(--cyan)' : 'var(--text-muted)'
                            }}>{done ? '✓ ' : ''}{step}</div>
                            {i < 3 && <span style={{ color: 'var(--border)' }}>→</span>}
                        </div>
                    )
                })}
            </div>

            {/* Main layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Left column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {!session
                        ? <SSHPanel onConnected={handleConnected} />
                        : <div className="card" style={{ borderColor: 'rgba(0,255,136,0.3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontWeight: 700, color: 'var(--success)' }}>✓ Sandbox Connected</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>{session.sandboxDir}</div>
                                </div>
                                <button onClick={() => setSession(null)} style={{ padding: '0.3rem 0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.78rem' }}>Disconnect</button>
                            </div>
                        </div>
                    }

                    {session && <UploadPanel sessionId={session.sessionId} onUploaded={setUploadInfo} />}
                    {uploadInfo && <ExecutionConsole sessionId={session.sessionId} onDone={() => setExecDone(true)} />}
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {session && <ArtifactsPanel sessionId={session.sessionId} />}
                    {session && <AnalysisPanel sessionId={session.sessionId} fileInfo={uploadInfo} />}

                    {!session && (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧪</div>
                            <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>How It Works</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                                1. Connect your VM via SSH<br />
                                2. Upload a malware sample<br />
                                3. Execute in isolated sandbox<br />
                                4. AI analyzes behavior + MITRE mapping<br />
                                5. Cross-check with VirusTotal<br />
                                6. Cleanup temp files automatically
                            </div>
                            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: 6 }}>
                                ⚠️ Add your SSH credentials in <strong>Settings</strong> to get started
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
