import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const pageVariants = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

const SUGGESTIONS = [
    'How would attacker move from Web Server to DB?',
    'Show me RDP lateral movement steps',
    'EternalBlue SMB exploitation path',
    'What are the most likely attack vectors?',
    'Show recent recon results',
    'Estimate risk for open RDP port',
]

function MessageBubble({ msg }) {
    const isUser = msg.role === 'user'
    return (
        <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '1rem' }}>
            {!isUser && <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #ff3366, #cc0033)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, marginRight: '0.75rem' }}>⚔️</div>}
            <div style={{
                maxWidth: '75%', padding: '0.75rem 1rem', borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isUser ? 'linear-gradient(135deg, #ff3366, #cc0033)' : 'var(--bg-card)',
                border: isUser ? 'none' : '1px solid var(--border)',
                color: isUser ? '#fff' : 'var(--text-primary)',
                fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap'
            }}>
                {msg.content}
            </div>
        </div>
    )
}

export default function RedCopilot() {
    const [messages, setMessages] = useState([
        { role: 'agent', content: '⚔️ **Red Planner Agent Online**\n\n⚠️ *Authorized Lab Simulation Mode Only*\n\nI simulate attack scenarios for security testing. I can:\n• Generate attack paths and exploitation chains\n• Map techniques to MITRE ATT&CK\n• Estimate success probabilities\n• Explain lateral movement strategies\n\nWhat attack scenario would you like to simulate?' }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [steps, setSteps] = useState([])
    const [sessionId] = useState(`red_${Date.now()}`)
    const bottomRef = useRef(null)
    const ws = useRef(null)

    useEffect(() => {
        ws.current = new WebSocket(`ws://${window.location.hostname}:5000/ws`)
        ws.current.onmessage = (e) => {
            const d = JSON.parse(e.data)
            if (d.type === 'agent_step' && d.session_id === sessionId) {
                setSteps(prev => [...prev, d.step])
            }
        }
        return () => ws.current?.close()
    }, [sessionId])

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

    const send = async (text) => {
        const msg = text || input.trim()
        if (!msg || loading) return
        setInput('')
        setSteps([])
        setMessages(prev => [...prev, { role: 'user', content: msg }])
        setLoading(true)
        try {
            const r = await axios.post('/api/agent/chat', { session_id: sessionId, message: msg, mode: 'red' })
            if (r.data.blocked) {
                setMessages(prev => [...prev, { role: 'agent', content: r.data.response }])
            } else {
                setMessages(prev => [...prev, { role: 'agent', content: r.data.response }])
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'agent', content: `Error: ${e.message}` }])
        }
        setSteps([])
        setLoading(false)
    }

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate" style={{ maxWidth: 900 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div className="page-title" style={{ marginBottom: 0 }}>⚔️ Red Team Copilot</div>
                <span style={{ background: 'rgba(255,51,102,0.15)', color: '#ff3366', border: '1px solid rgba(255,51,102,0.3)', padding: '0.2rem 0.6rem', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700 }}>⚠️ AUTHORIZED LAB ONLY</span>
            </div>
            <div className="page-subtitle">AI-powered attack simulation and exploitation path planning</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '1.5rem' }}>
                {/* Chat */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 600, borderColor: 'rgba(255,51,102,0.2)' }}>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                        {messages.map((m, i) => <MessageBubble key={i} msg={m} />)}
                        {loading && steps.length > 0 && (
                            <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: '0.5rem' }}>
                                {steps.map((s, i) => (
                                    <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', padding: '2px 0' }}>
                                        {s.type === 'thinking' ? '💭' : s.type === 'tool_call' ? '🔧' : '✨'} {s.message}
                                    </div>
                                ))}
                            </div>
                        )}
                        {loading && steps.length === 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1rem', alignItems: 'center' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff3366', animation: 'blink 1s infinite' }} />
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Planning attack...</span>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <input
                            className="input" placeholder="Ask about attack paths, techniques, exploitation..."
                            value={input} onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                            disabled={loading}
                        />
                        <button onClick={() => send()} disabled={loading || !input.trim()}
                            style={{ padding: '0.6rem 1rem', background: '#ff3366', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
                            {loading ? '...' : '→'}
                        </button>
                    </div>
                </div>

                {/* Suggestions */}
                <div>
                    <div className="card" style={{ marginBottom: '1rem', borderColor: 'rgba(255,51,102,0.2)' }}>
                        <div className="section-title">💡 Attack Scenarios</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {SUGGESTIONS.map((s, i) => (
                                <button key={i} onClick={() => send(s)} disabled={loading}
                                    style={{
                                        textAlign: 'left', padding: '0.6rem 0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                        borderRadius: 8, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8rem', transition: 'all 0.2s'
                                    }}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="card" style={{ borderColor: 'rgba(255,51,102,0.2)' }}>
                        <div className="section-title" style={{ fontSize: '0.85rem' }}>⚔️ Capabilities</div>
                        {['Attack path simulation', 'MITRE ATT&CK mapping', 'Lateral movement paths', 'Exploit probability', 'Recon result analysis'].map(c => (
                            <div key={c} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', padding: '0.3rem 0', borderBottom: '1px solid var(--border)' }}>
                                ✓ {c}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
