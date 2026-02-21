import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -16 }
}

// ── Field component ───────────────────────────────────────────────────────────
function ApiKeyField({ label, keyName, hint, link, linkLabel, value, onChange, type = 'password', placeholder }) {
    const [show, setShow] = useState(false)
    const isSet = value && !value.startsWith('•')

    return (
        <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</label>
                {isSet && <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 100, background: 'rgba(0,212,255,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,212,255,0.2)' }}>✓ Set</span>}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    className="input"
                    type={type === 'password' && !show ? 'password' : 'text'}
                    value={value}
                    onChange={e => onChange(keyName, e.target.value)}
                    placeholder={placeholder || `Enter ${label}...`}
                    style={{ flex: 1 }}
                />
                {type === 'password' && (
                    <button onClick={() => setShow(s => !s)} style={{
                        padding: '0 0.75rem', background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem'
                    }}>{show ? '🙈' : '👁'}</button>
                )}
            </div>
            {hint && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    {hint}{link && <> — <a href={link} target="_blank" rel="noreferrer" style={{ color: 'var(--cyan)' }}>{linkLabel || link}</a></>}
                </div>
            )}
        </div>
    )
}

// ── Section header ────────────────────────────────────────────────────────────
function Section({ icon, title, children, accent }) {
    return (
        <div className="card" style={{ marginBottom: '1.5rem', borderColor: accent || 'var(--border)' }}>
            <div className="section-title" style={{ color: accent || 'var(--text-primary)', marginBottom: '1.25rem' }}>
                {icon} {title}
            </div>
            {children}
        </div>
    )
}

// ── SSH Test ──────────────────────────────────────────────────────────────────
function SSHTestPanel({ settings, onChange }) {
    const [testing, setTesting] = useState(false)
    const [result, setResult] = useState(null)

    const test = async () => {
        setTesting(true)
        setResult(null)
        try {
            const res = await axios.post('/api/settings/test-ssh', {
                host: settings.ssh_host,
                port: settings.ssh_port || 22,
                username: settings.ssh_user,
                password: settings.ssh_password,
                authMethod: settings.ssh_auth || 'password'
            })
            setResult({ ok: true, msg: res.data.message, system: res.data.system })
        } catch (err) {
            setResult({ ok: false, msg: err.response?.data?.error || err.message })
        } finally {
            setTesting(false)
        }
    }

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', marginBottom: '1rem' }}>
                <ApiKeyField label="SSH Host / IP" keyName="ssh_host" type="text" placeholder="192.168.1.100" value={settings.ssh_host || ''} onChange={onChange} hint="Your VM's IP address or hostname" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <ApiKeyField label="SSH Port" keyName="ssh_port" type="text" placeholder="22" value={settings.ssh_port || ''} onChange={onChange} />
                <ApiKeyField label="Username" keyName="ssh_user" type="text" placeholder="root" value={settings.ssh_user || ''} onChange={onChange} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>Auth Method</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {['password', 'key'].map(m => (
                        <button key={m} onClick={() => onChange('ssh_auth', m)} style={{
                            padding: '0.4rem 1rem', borderRadius: 6, border: '1px solid',
                            borderColor: settings.ssh_auth === m ? 'var(--cyan)' : 'var(--border)',
                            background: settings.ssh_auth === m ? 'rgba(0,212,255,0.1)' : 'var(--bg-secondary)',
                            color: settings.ssh_auth === m ? 'var(--cyan)' : 'var(--text-muted)',
                            cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600
                        }}>{m === 'password' ? '🔑 Password' : '📄 Private Key'}</button>
                    ))}
                </div>
            </div>
            {settings.ssh_auth !== 'key'
                ? <ApiKeyField label="Password" keyName="ssh_password" value={settings.ssh_password || ''} onChange={onChange} placeholder="VM password" />
                : <ApiKeyField label="Private Key (PEM)" keyName="ssh_private_key" type="text" value={settings.ssh_private_key || ''} onChange={onChange} placeholder="-----BEGIN RSA PRIVATE KEY-----..." />
            }
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <button onClick={test} disabled={testing || !settings.ssh_host} style={{
                    padding: '0.5rem 1.25rem', background: 'linear-gradient(135deg,#00d4ff,#0066cc)',
                    color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem'
                }}>{testing ? '⏳ Testing...' : '🔌 Test Connection'}</button>
                <AnimatePresence>
                    {result && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                            style={{ fontSize: '0.82rem', color: result.ok ? '#00ff88' : '#ff3366', fontFamily: 'var(--font-mono)' }}>
                            {result.ok ? `✓ ${result.msg}` : `✗ ${result.msg}`}
                            {result.system && <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.2rem' }}>{result.system}</div>}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Settings() {
    const [settings, setSettings] = useState({
        gemini_api_key: '', vt_api_key: '', abuseipdb_key: '',
        python_api_url: 'http://localhost:8001', mongo_uri: '',
        ssh_host: '', ssh_port: '22', ssh_user: 'root', ssh_password: '', ssh_auth: 'password', ssh_private_key: ''
    })
    const [saved, setSaved] = useState(false)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Load masked keys from server
    useEffect(() => {
        axios.get('/api/settings/keys').then(res => {
            const s = res.data.settings || {}
            setSettings(prev => ({
                ...prev,
                gemini_api_key: s.gemini_api_key || '',
                vt_api_key: s.vt_api_key || '',
                abuseipdb_key: s.abuseipdb_key || '',
                python_api_url: s.python_api_url || prev.python_api_url,
                mongo_uri: s.mongo_uri || '',
            }))
        }).catch(() => { }).finally(() => setLoading(false))
    }, [])

    const update = (key, value) => setSettings(s => ({ ...s, [key]: value }))

    const save = async () => {
        setSaving(true)
        setError('')
        try {
            // Save API keys to server
            const serverKeys = {}
            if (settings.gemini_api_key && !settings.gemini_api_key.includes('•')) serverKeys.gemini_api_key = settings.gemini_api_key
            if (settings.vt_api_key && !settings.vt_api_key.includes('•')) serverKeys.vt_api_key = settings.vt_api_key
            if (settings.abuseipdb_key && !settings.abuseipdb_key.includes('•')) serverKeys.abuseipdb_key = settings.abuseipdb_key
            if (settings.python_api_url) serverKeys.python_api_url = settings.python_api_url
            if (settings.mongo_uri && !settings.mongo_uri.includes('•')) serverKeys.mongo_uri = settings.mongo_uri

            if (Object.keys(serverKeys).length > 0) {
                await axios.post('/api/settings/keys', serverKeys)
            }

            // Save SSH config to localStorage (not sent to server for security)
            localStorage.setItem('y2k_ssh_config', JSON.stringify({
                ssh_host: settings.ssh_host, ssh_port: settings.ssh_port,
                ssh_user: settings.ssh_user, ssh_auth: settings.ssh_auth
            }))

            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        } catch (err) {
            setError(err.response?.data?.error || err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="page-container"><div style={{ color: 'var(--text-muted)' }}>Loading settings...</div></div>

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div>
                    <div className="page-title">⚙️ Settings</div>
                    <div className="page-subtitle">Configure API keys and platform integrations</div>
                </div>
                <button onClick={save} disabled={saving} style={{
                    padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: '0.9rem',
                    background: saved ? 'linear-gradient(135deg,#00ff88,#00cc66)' : 'linear-gradient(135deg,#00d4ff,#0066cc)',
                    color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
                    boxShadow: '0 0 16px rgba(0,212,255,0.3)', transition: 'all 0.2s'
                }}>{saving ? '⏳ Saving...' : saved ? '✓ Saved!' : '💾 Save All'}</button>
            </div>

            {error && <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', borderRadius: 8, color: '#ff3366', marginBottom: '1rem', fontSize: '0.85rem' }}>❌ {error}</div>}

            <div style={{ maxWidth: 760 }}>
                {/* AI Keys */}
                <Section icon="🤖" title="AI Provider Keys" accent="rgba(0,212,255,0.4)">
                    <ApiKeyField
                        label="Gemini API Key" keyName="gemini_api_key"
                        value={settings.gemini_api_key} onChange={update}
                        hint="Powers the Blue Defender and Red Planner AI agents"
                        link="https://aistudio.google.com/app/apikey" linkLabel="Get free key at Google AI Studio"
                    />
                </Section>

                {/* Threat Intel Keys */}
                <Section icon="🦠" title="Threat Intelligence Keys">
                    <ApiKeyField
                        label="VirusTotal API Key" keyName="vt_api_key"
                        value={settings.vt_api_key} onChange={update}
                        hint="Used for malware hash lookup and sandbox cross-check"
                        link="https://www.virustotal.com/gui/my-apikey" linkLabel="Get free key at VirusTotal"
                    />
                    <ApiKeyField
                        label="AbuseIPDB API Key" keyName="abuseipdb_key"
                        value={settings.abuseipdb_key} onChange={update}
                        hint="Used for IP reputation checks in Blue Mode"
                        link="https://www.abuseipdb.com/account/api" linkLabel="Get free key at AbuseIPDB"
                    />
                </Section>

                {/* Service URLs */}
                <Section icon="🔌" title="Service Configuration">
                    <ApiKeyField
                        label="Python API URL" keyName="python_api_url" type="text"
                        value={settings.python_api_url} onChange={update}
                        placeholder="http://localhost:8001"
                        hint="URL of the Python FastAPI analysis engine"
                    />
                    <ApiKeyField
                        label="MongoDB URI" keyName="mongo_uri" type="password"
                        value={settings.mongo_uri} onChange={update}
                        placeholder="mongodb://localhost:27017/y2k_cyber_ai"
                        hint="MongoDB connection string (restart server after changing)"
                    />
                </Section>

                {/* Sandbox SSH Config */}
                <Section icon="🖥️" title="Sandbox VM — SSH Configuration" accent="rgba(255,51,102,0.3)">
                    <div style={{ padding: '0.6rem 0.9rem', background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.2)', borderRadius: 8, marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        ⚠️ Connect your own VM (VirtualBox, VMware, cloud VM) for dynamic malware analysis. All execution happens on your VM — never on this host.
                    </div>
                    <SSHTestPanel settings={settings} onChange={update} />
                </Section>

                {/* Info cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                        { icon: '🔒', title: 'Key Security', text: 'API keys are stored server-side in config/settings.json. SSH passwords are only kept in browser localStorage and never sent to disk.' },
                        { icon: '🆓', title: 'Free Tiers', text: 'Gemini, VirusTotal, and AbuseIPDB all offer free API tiers sufficient for testing. No paid plan required to get started.' },
                    ].map((c, i) => (
                        <div key={i} style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.85rem' }}>{c.icon} {c.title}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{c.text}</div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}
