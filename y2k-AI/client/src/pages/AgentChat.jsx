import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMode } from '../contexts/ModeContext'
import ModeToggle from '../components/ModeToggle'
import ReactMarkdown from 'react-markdown'

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -16 }
}

// ── Mode config ───────────────────────────────────────────────────────────────
const MODE_CONFIG = {
    blue: {
        name: 'Blue Defender Agent',
        icon: '🛡️',
        color: 'var(--cyan)',
        gradient: 'var(--bg-secondary),#0066cc)',
        glow: 'rgba(0,212,255,0.2)',
        badge: 'SOC DEFENDER',
        greeting: `🛡️ **Y2K Blue Agent — SOC Defender & Trainer**

I'm your AI-powered SOC analyst and cybersecurity instructor. I combine real-time threat analysis with education — every response teaches you something new.

**I can help you:**
• Analyze threats and map them to MITRE ATT&CK
• Generate SIEM detection rules (Splunk SPL / Sigma)
• Build incident response playbooks
• Check file hashes via VirusTotal
• Analyze malware sandbox artifacts
• Check IP reputation via AbuseIPDB

💡 *Add your Gemini API key in Settings to unlock full AI-powered analysis.*`,
        suggestions: [
            'What threats are in my logs?',
            'Generate a Sigma rule for brute force detection',
            'Build a malware incident response playbook',
            'Explain MITRE T1059 and how to detect it',
            'Check this hash: d41d8cd98f00b204e9800998ecf8427e',
        ]
    },
    red: {
        name: 'Red Planner Agent',
        icon: '⚔️',
        color: 'var(--danger)',
        gradient: 'var(--bg-secondary),#cc0033)',
        glow: 'rgba(255,51,102,0.2)',
        badge: 'LAB SIMULATION ONLY',
        greeting: `⚔️ **Y2K Red Agent — Offensive Simulator & Instructor**

I simulate attack scenarios for **authorized lab environments only**. I think like an attacker — but I always show you how to defend.

**I can help you:**
• Design attack paths and lateral movement scenarios
• Explain exploitation techniques conceptually
• Map attacks to MITRE ATT&CK
• Run recon commands on your connected lab VM
• Teach you how attackers think — so you can stop them

🎓 *Every attack I explain includes how Blue Team detects and stops it.*

⚠️ **Authorized Lab Simulation Only**`,
        suggestions: [
            'How would an attacker move from web server to database?',
            'Show me RDP lateral movement steps',
            'EternalBlue SMB exploitation path',
            'How does pass-the-hash work?',
            'What is a Golden Ticket attack?',
        ]
    }
}

// ── Tool Call Card ────────────────────────────────────────────────────────────
function ToolCard({ tool }) {
    const [expanded, setExpanded] = useState(false)
    const icons = { virustotal_lookup: '🦠', abuseipdb_check: '🌐', shodan_lookup: '🔍', ssh_exec: '💻', search_logs: '📡', get_incidents: '🚨', get_mitre_info: '🎯', generate_siem_rule: '📊', build_playbook: '📋', get_sandbox_artifacts: '🧪' }
    const icon = icons[tool.tool] || '🔧'

    return (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            style={{ margin: '0.4rem 0', padding: '0.5rem 0.75rem', background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, fontSize: '0.78rem', cursor: 'pointer' }}
            onClick={() => setExpanded(e => !e)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                <span>{icon}</span>
                <span style={{ fontWeight: 700 }}>{tool.tool}</span>
                <span style={{ color: 'var(--text-muted)' }}>({Object.entries(tool.args || {}).map(([k, v]) => `${k}="${String(v).slice(0, 20)}"`).join(', ')})</span>
                <span style={{ marginLeft: 'auto', color: tool.result?.error ? 'var(--danger)' : 'var(--success)' }}>
                    {tool.result?.error ? '✗ Error' : '✓ Done'}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>{expanded ? '▲' : '▼'}</span>
            </div>
            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#0a0a0a', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#ccc', maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(tool.result, null, 2).slice(0, 1500)}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function Message({ msg, modeColor }) {
    const isUser = msg.role === 'user'
    const isBlocked = msg.blocked

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'flex-start' }}>

            {/* Avatar */}
            <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: isUser ? 'var(--bg-secondary)' : isBlocked ? 'rgba(255,51,102,0.2)' : `${modeColor}20`,
                border: `1px solid ${isUser ? 'var(--border)' : isBlocked ? 'rgba(255,51,102,0.4)' : `${modeColor}40`}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
            }}>
                {isUser ? '👤' : isBlocked ? '🚫' : '🤖'}
            </div>

            <div style={{ maxWidth: '80%', minWidth: 0 }}>
                {/* Streaming indicator */}
                {msg.streaming && (
                    <div style={{ fontSize: '0.72rem', color: modeColor, marginBottom: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                        ⚡ Generating...
                    </div>
                )}

                {/* Tool calls */}
                {msg.toolsUsed?.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                        {msg.toolsUsed.map((t, i) => <ToolCard key={i} tool={t} />)}
                    </div>
                )}

                {/* Live tool steps */}
                {msg.steps?.filter(s => s.type === 'tool_call').map((s, i) => (
                    <div key={i} style={{ fontSize: '0.72rem', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem', padding: '0.3rem 0.6rem', background: 'rgba(0,212,255,0.05)', borderRadius: 6, border: '1px solid rgba(0,212,255,0.15)' }}>
                        🔧 {s.message}
                    </div>
                ))}

                {/* Content */}
                <div style={{
                    padding: '0.85rem 1rem',
                    background: isUser ? 'var(--bg-secondary)' : isBlocked ? 'rgba(255,51,102,0.08)' : 'var(--bg-card)',
                    border: `1px solid ${isUser ? 'var(--border)' : isBlocked ? 'rgba(255,51,102,0.3)' : 'var(--border)'}`,
                    borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    fontSize: '0.88rem', lineHeight: 1.65, color: 'var(--text-primary)',
                }}>
                    {isUser
                        ? <span>{msg.content}</span>
                        : <div className="markdown-body" style={{ fontSize: '0.88rem' }}>
                            <ReactMarkdown>{msg.content || ''}</ReactMarkdown>
                            {msg.streaming && <span style={{ color: modeColor }} className="blink">█</span>}
                        </div>
                    }
                </div>

                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.3rem', textAlign: isUser ? 'right' : 'left' }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                    {msg.intent && msg.intent !== 'heuristic' && msg.intent !== 'fallback' && (
                        <span style={{ marginLeft: '0.5rem', color: modeColor }}>✦ AI</span>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

// ── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ steps, modeColor }) {
    if (!steps?.length) return null
    const latest = steps[steps.length - 1]
    const icons = { thinking: '🧠', tool_call: '🔧', tool_result: '✓', synthesizing: '⚡', info: 'ℹ️' }
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', background: `${modeColor}10`, border: `1px solid ${modeColor}30`, borderRadius: 8, fontSize: '0.75rem', color: modeColor, fontFamily: 'var(--font-mono)', marginBottom: '0.75rem' }}>
            <span>{icons[latest.type] || '⚙️'}</span>
            <span>{latest.message}</span>
            <span className="blink" style={{ marginLeft: 'auto' }}>●</span>
        </motion.div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AgentChat() {
    const { mode } = useMode()
    const cfg = MODE_CONFIG[mode]
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [sessionId] = useState(() => `session_${Date.now()}`)
    const [liveSteps, setLiveSteps] = useState([])
    const [sandboxSessionId, setSandboxSessionId] = useState(() => {
        try { return JSON.parse(localStorage.getItem('y2k_sandbox_session') || 'null') } catch { return null }
    })
    const bottomRef = useRef()
    const inputRef = useRef()
    const abortRef = useRef()

    // Reset on mode change
    useEffect(() => {
        setMessages([{
            role: 'agent', content: cfg.greeting,
            timestamp: new Date(), intent: 'greeting'
        }])
        setLiveSteps([])
        setLoading(false)
        abortRef.current?.abort()
    }, [mode])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, liveSteps])

    const sendMessage = useCallback(async (text) => {
        const msg = text || input.trim()
        if (!msg || loading) return
        setInput('')
        setLoading(true)
        setLiveSteps([])

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: msg, timestamp: new Date() }])

        // Add streaming placeholder for agent
        const agentMsgId = Date.now()
        setMessages(prev => [...prev, { id: agentMsgId, role: 'agent', content: '', timestamp: new Date(), streaming: true, steps: [], toolsUsed: [] }])

        // Use SSE streaming
        abortRef.current = new AbortController()
        const params = new URLSearchParams({ message: msg, mode, session_id: sessionId })
        if (sandboxSessionId) params.append('sandbox_session_id', sandboxSessionId)

        try {
            const response = await fetch(`/api/agent/stream?${params}`, { signal: abortRef.current.signal })
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            let fullText = ''
            let toolsUsed = []
            let steps = []

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop()

                for (const line of lines) {
                    if (!line.startsWith('data:')) continue
                    try {
                        const data = JSON.parse(line.slice(5))
                        const event = line.includes('event:') ? '' : 'chunk'

                        // Parse event type from SSE
                        const eventLine = lines[lines.indexOf(line) - 1] || ''
                        const eventType = eventLine.startsWith('event:') ? eventLine.slice(6).trim() : 'chunk'

                        if (data.text !== undefined) {
                            fullText += data.text
                            setMessages(prev => prev.map(m =>
                                m.id === agentMsgId ? { ...m, content: fullText } : m
                            ))
                        } else if (data.tool) {
                            toolsUsed.push(data)
                            setMessages(prev => prev.map(m =>
                                m.id === agentMsgId ? { ...m, toolsUsed: [...toolsUsed] } : m
                            ))
                        } else if (data.type) {
                            steps.push(data)
                            setLiveSteps([...steps])
                        }
                    } catch { }
                }
            }

            // Finalize message
            setMessages(prev => prev.map(m =>
                m.id === agentMsgId ? { ...m, content: fullText || m.content, streaming: false, toolsUsed, steps } : m
            ))
        } catch (err) {
            if (err.name !== 'AbortError') {
                // Fallback to regular POST
                try {
                    const res = await fetch('/api/agent/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: msg, mode, session_id: sessionId, sandbox_session_id: sandboxSessionId })
                    })
                    const data = await res.json()
                    setMessages(prev => prev.map(m =>
                        m.id === agentMsgId ? { ...m, content: data.response || data.error, streaming: false, intent: data.intent, toolsUsed: data.tools_used || [], blocked: data.blocked } : m
                    ))
                } catch (e) {
                    setMessages(prev => prev.map(m =>
                        m.id === agentMsgId ? { ...m, content: `⚠️ Error: ${e.message}`, streaming: false } : m
                    ))
                }
            }
        } finally {
            setLoading(false)
            setLiveSteps([])
            inputRef.current?.focus()
        }
    }, [input, loading, mode, sessionId, sandboxSessionId])

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    }

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate" exit="exit"
            style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', padding: 0 }}>

            {/* Header */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', boxShadow: `0 0 20px ${cfg.glow}` }}>
                        {cfg.icon}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{cfg.name}</div>
                        <div style={{ fontSize: '0.72rem', color: cfg.color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            ● {cfg.badge}
                            {sandboxSessionId && <span style={{ marginLeft: '0.75rem', color: 'var(--success)' }}>🧪 VM Connected</span>}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => {
                        setMessages([{ role: 'agent', content: cfg.greeting, timestamp: new Date(), intent: 'greeting' }])
                        setLiveSteps([])
                    }} style={{ padding: '0.35rem 0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        🗑 Clear
                    </button>
                    <ModeToggle />
                </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                {messages.map((msg, i) => (
                    <Message key={msg.id || i} msg={msg} modeColor={cfg.color} />
                ))}

                <AnimatePresence>
                    {loading && liveSteps.length > 0 && (
                        <StepIndicator steps={liveSteps} modeColor={cfg.color} />
                    )}
                </AnimatePresence>

                <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            <AnimatePresence>
                {messages.length <= 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ padding: '0 1.5rem 0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {cfg.suggestions.map((s, i) => (
                            <button key={i} onClick={() => sendMessage(s)} style={{
                                padding: '0.4rem 0.85rem', borderRadius: 100, fontSize: '0.78rem',
                                background: `${cfg.color}10`, border: `1px solid ${cfg.color}30`,
                                color: cfg.color, cursor: 'pointer', transition: 'all 0.15s',
                                fontWeight: 500
                            }}>{s}</button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input */}
            <div style={{ padding: '0.75rem 1.5rem 1rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder={mode === 'blue' ? 'Ask about threats, logs, MITRE techniques, detection rules...' : 'Ask about attack paths, lateral movement, exploitation concepts...'}
                        rows={1}
                        style={{
                            flex: 1, padding: '0.75rem 1rem', background: 'var(--bg-secondary)',
                            border: `1px solid ${input ? cfg.color + '60' : 'var(--border)'}`,
                            borderRadius: 12, color: 'var(--text-primary)', fontSize: '0.9rem',
                            resize: 'none', outline: 'none', fontFamily: 'inherit',
                            transition: 'border-color 0.2s', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto'
                        }}
                        onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                        style={{
                            width: 48, height: 48, borderRadius: 12, border: 'none', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                            background: !input.trim() || loading ? 'var(--bg-secondary)' : cfg.gradient,
                            color: !input.trim() || loading ? 'var(--text-muted)' : '#fff',
                            fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, boxShadow: input.trim() && !loading ? `0 0 16px ${cfg.glow}` : 'none',
                            transition: 'all 0.2s'
                        }}>
                        {loading ? '⏳' : '➤'}
                    </button>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem', textAlign: 'center' }}>
                    {mode === 'red' ? '⚠️ Authorized lab simulation only — all tool execution on your VM' : '🛡️ Blue Mode — defensive analysis and education'}
                    {' · '}Enter to send · Shift+Enter for new line
                </div>
            </div>
        </motion.div>
    )
}
