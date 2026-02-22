import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const pageVariants = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

const SUGGESTIONS = [
    'Why was admin locked out?',
    'Show me recent critical threats',
    'What is the brute force playbook?',
    'How many open incidents do we have?',
    'Map the latest attack to MITRE',
    'What happened in the last hour?',
]

function MessageBubble({ msg }) {
    const isUser = msg.role === 'user'
    return (
        <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '1rem' }}>
            {!isUser && <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-secondary), #0066cc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, marginRight: '0.75rem' }}>🛡️</div>}
            <div style={{
                maxWidth: '75%', padding: '0.75rem 1rem', borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isUser ? 'var(--bg-secondary), #0066cc)' : 'var(--bg-card)',
                border: isUser ? 'none' : '1px solid var(--border)',
                color: isUser ? '#060b18' : 'var(--text-primary)',
                fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap'
            }}>
                {msg.content}
            </div>
        </div>
    )
}

export default function SOCAssistant() {
    const [messages, setMessages] = useState([
        { role: 'agent', content: '🛡️ **Blue Defender Agent Online**\n\nI\'m your AI SOC assistant. I can:\n• Explain incidents and threat activity\n• Map events to MITRE ATT&CK techniques\n• Provide response playbooks\n• Show security statistics\n\nWhat would you like to investigate?' }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [steps, setSteps] = useState([])
    const [sessionId] = useState(`blue_${Date.now()}`)
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
            const r = await axios.post('/api/agent/chat', { session_id: sessionId, message: msg, mode: 'blue' })
            setMessages(prev => [...prev, { role: 'agent', content: r.data.response }])
        } catch (e) {
            setMessages(prev => [...prev, { role: 'agent', content: `Error: ${e.message}` }])
        }
        setSteps([])
        setLoading(false)
    }

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate" style={{ maxWidth: 900 }}>
            <div className="page-title">🛡️ SOC AI Assistant</div>
            <div className="page-subtitle">RAG-powered threat intelligence — ask anything about your environment</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '1.5rem' }}>
                {/* Chat */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 600 }}>
                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                        {messages.map((m, i) => <MessageBubble key={i} msg={m} />)}
                        {/* Reasoning steps */}
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
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--info)', animation: 'blink 1s infinite' }} />
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Analyzing...</span>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <input
                            className="input" placeholder="Ask about threats, incidents, MITRE techniques..."
                            value={input} onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                            disabled={loading}
                        />
                        <button className="btn btn-primary" onClick={() => send()} disabled={loading || !input.trim()}>
                            {loading ? '...' : '→'}
                        </button>
                    </div>
                </div>

                {/* Suggestions */}
                <div>
                    <div className="card" style={{ marginBottom: '1rem' }}>
                        <div className="section-title">💡 Suggested Queries</div>
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
                    <div className="card">
                        <div className="section-title" style={{ fontSize: '0.85rem' }}>🎯 Capabilities</div>
                        {['Incident explanation', 'MITRE ATT&CK mapping', 'Response playbooks', 'Threat statistics', 'Log analysis'].map(c => (
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
