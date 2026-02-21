import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const SCENARIOS = [
    { id: 'phishing', name: 'Phishing Defense', difficulty: 'beginner', icon: '🎣', xp: 100, description: 'Identify and respond to phishing attacks', duration: '15 min' },
    { id: 'ransomware', name: 'Ransomware Response', difficulty: 'intermediate', icon: '💀', xp: 250, description: 'Isolate and recover from ransomware infection', duration: '30 min' },
    { id: 'apt', name: 'APT Hunt', difficulty: 'advanced', icon: '🕵️', xp: 500, description: 'Detect and track advanced persistent threat', duration: '45 min' },
    { id: 'insider', name: 'Insider Threat', difficulty: 'intermediate', icon: '🎭', xp: 300, description: 'Identify malicious insider activity', duration: '25 min' },
    { id: 'supply_chain', name: 'Supply Chain Attack', difficulty: 'advanced', icon: '🔗', xp: 450, description: 'Respond to compromised software dependency', duration: '40 min' },
    { id: 'zero_day', name: 'Zero-Day Exploit', difficulty: 'expert', icon: '💣', xp: 750, description: 'Triage and mitigate unknown vulnerability', duration: '60 min' },
]

const LEADERBOARD = [
    { rank: 1, name: 'CyberSentinel', score: 12500, badge: '🏆' },
    { rank: 2, name: 'RedHunter', score: 11200, badge: '🥈' },
    { rank: 3, name: 'BlueShield', score: 10800, badge: '🥉' },
    { rank: 4, name: 'NetGuardian', score: 9400, badge: '⭐' },
    { rank: 5, name: 'You', score: 8750, badge: '🎯' },
]

export default function CyberRange() {
    const [activeTab, setActiveTab] = useState('scenarios')
    const [activeScenario, setActiveScenario] = useState(null)
    const [score, setScore] = useState(8750)
    const [level, setLevel] = useState(15)
    const [terminalOutput, setTerminalOutput] = useState([])
    const [terminalInput, setTerminalInput] = useState('')
    const termRef = useRef(null)

    const startScenario = (scenario) => {
        setActiveScenario(scenario)
        setTerminalOutput([
            { type: 'system', text: `━━━ CYBER RANGE: ${scenario.name.toUpperCase()} ━━━` },
            { type: 'info', text: `Difficulty: ${scenario.difficulty} | XP Reward: ${scenario.xp}` },
            { type: 'system', text: 'Environment initializing...' },
            { type: 'success', text: 'Virtual network deployed. Targets online.' },
            { type: 'info', text: 'Scenario briefing:' },
            { type: 'text', text: scenario.description },
            { type: 'system', text: '─── Type your commands below ───' },
        ])
    }

    const handleCommand = (cmd) => {
        const newOutput = [...terminalOutput, { type: 'command', text: `$ ${cmd}` }]
        const lower = cmd.toLowerCase().trim()

        if (lower === 'help') {
            newOutput.push({ type: 'info', text: 'Available: nmap, whois, grep, isolate, quarantine, report, hint, exit' })
        } else if (lower.startsWith('nmap')) {
            newOutput.push({ type: 'success', text: 'Scanning target network...' })
            newOutput.push({ type: 'text', text: 'PORT    STATE    SERVICE\n22/tcp  open     ssh\n80/tcp  open     http\n443/tcp open     https\n3306/tcp filtered mysql\n8080/tcp open     http-proxy' })
            setScore(s => s + 25)
        } else if (lower.startsWith('isolate')) {
            newOutput.push({ type: 'success', text: '✅ Host isolated from network. Lateral movement blocked.' })
            setScore(s => s + 50)
        } else if (lower.startsWith('quarantine')) {
            newOutput.push({ type: 'success', text: '✅ Malicious file quarantined successfully.' })
            setScore(s => s + 40)
        } else if (lower === 'hint') {
            newOutput.push({ type: 'info', text: '💡 Try scanning the network first with nmap, then isolate suspicious hosts.' })
        } else if (lower === 'exit') {
            newOutput.push({ type: 'system', text: `Scenario complete! Score: +${activeScenario.xp} XP` })
            setScore(s => s + activeScenario.xp)
            setTimeout(() => setActiveScenario(null), 2000)
        } else if (lower.startsWith('report')) {
            newOutput.push({ type: 'success', text: '📋 Incident report generated and submitted to SOC.' })
            setScore(s => s + 30)
        } else {
            newOutput.push({ type: 'error', text: `Command not recognized: ${cmd}. Type 'help' for available commands.` })
        }

        setTerminalOutput(newOutput)
        setTerminalInput('')
        setTimeout(() => termRef.current?.scrollTo(0, termRef.current.scrollHeight), 50)
    }

    const getDiffColor = (d) => {
        const colors = { beginner: '#2ed573', intermediate: '#ffa502', advanced: '#ff4757', expert: '#b388ff' }
        return colors[d] || '#888'
    }

    return (
        <div className="page-container">
            <motion.div className="cr-page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="cr-header">
                    <div>
                        <h1>🎮 Cyber Range</h1>
                        <p className="cr-subtitle">Interactive training scenarios & CTF challenges</p>
                    </div>
                    <div className="cr-player-info">
                        <span className="cr-level">Lv.{level}</span>
                        <span className="cr-xp">⭐ {score.toLocaleString()} XP</span>
                    </div>
                </div>

                {activeScenario ? (
                    <div className="cr-terminal-container">
                        <div className="cr-terminal-header">
                            <span>🖥️ {activeScenario.name} — LIVE SCENARIO</span>
                            <button className="cr-exit-btn" onClick={() => setActiveScenario(null)}>✕ Exit</button>
                        </div>
                        <div className="cr-terminal" ref={termRef}>
                            {terminalOutput.map((line, i) => (
                                <div key={i} className={`cr-line cr-line-${line.type}`}>
                                    {line.text.split('\n').map((l, j) => <div key={j}>{l}</div>)}
                                </div>
                            ))}
                        </div>
                        <form className="cr-input-row" onSubmit={(e) => { e.preventDefault(); if (terminalInput.trim()) handleCommand(terminalInput) }}>
                            <span className="cr-prompt">$</span>
                            <input value={terminalInput} onChange={e => setTerminalInput(e.target.value)}
                                className="cr-input" placeholder="Enter command..." autoFocus />
                        </form>
                    </div>
                ) : (
                    <>
                        <div className="cr-tabs">
                            {['scenarios', 'leaderboard'].map(t => (
                                <button key={t} className={`cr-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                                    {t === 'scenarios' ? '🎯' : '🏆'} {t}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'scenarios' && (
                            <div className="cr-scenarios-grid">
                                {SCENARIOS.map((s, i) => (
                                    <motion.div key={s.id} className="cr-scenario-card"
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                    >
                                        <div className="cr-sc-top">
                                            <span className="cr-sc-icon">{s.icon}</span>
                                            <span className="cr-sc-diff" style={{ color: getDiffColor(s.difficulty) }}>{s.difficulty}</span>
                                        </div>
                                        <h4>{s.name}</h4>
                                        <p>{s.description}</p>
                                        <div className="cr-sc-meta">
                                            <span>⏱ {s.duration}</span>
                                            <span>⭐ {s.xp} XP</span>
                                        </div>
                                        <button className="cr-start-btn" onClick={() => startScenario(s)}>▶ Launch</button>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'leaderboard' && (
                            <div className="cr-leaderboard">
                                {LEADERBOARD.map((p, i) => (
                                    <motion.div key={i} className={`cr-lb-row ${p.name === 'You' ? 'cr-lb-you' : ''}`}
                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <span className="cr-lb-rank">{p.badge}</span>
                                        <span className="cr-lb-name">{p.name}</span>
                                        <span className="cr-lb-score">{p.score.toLocaleString()} XP</span>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </motion.div>

            <style>{`
                .cr-page { max-width: 1200px; margin: 0 auto; padding: 24px; }
                .cr-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
                .cr-header h1 { font-size: 1.8rem; color: #00fff5; margin: 0; }
                .cr-subtitle { color: #888; margin-top: 4px; }
                .cr-player-info { display: flex; gap: 12px; align-items: center; }
                .cr-level { background: linear-gradient(135deg, #7c4dff, #b388ff); padding: 6px 14px; border-radius: 8px; color: #fff; font-weight: 800; font-size: 0.9rem; }
                .cr-xp { color: #ffa502; font-weight: 700; font-size: 1rem; }

                .cr-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
                .cr-tab { padding: 8px 18px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #999; border-radius: 8px; cursor: pointer; text-transform: capitalize; }
                .cr-tab.active { background: rgba(0,255,245,0.1); border-color: rgba(0,255,245,0.3); color: #00fff5; }

                .cr-scenarios-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
                .cr-scenario-card {
                    padding: 22px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 14px; transition: all 0.3s;
                }
                .cr-scenario-card:hover { border-color: rgba(0,255,245,0.2); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
                .cr-sc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                .cr-sc-icon { font-size: 1.5rem; }
                .cr-sc-diff { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; }
                .cr-scenario-card h4 { margin: 0 0 6px; color: #e0e0e0; }
                .cr-scenario-card p { color: #888; font-size: 0.85rem; margin: 0 0 10px; }
                .cr-sc-meta { display: flex; gap: 12px; margin-bottom: 12px; }
                .cr-sc-meta span { font-size: 0.8rem; color: #999; }
                .cr-start-btn {
                    width: 100%; padding: 10px; background: rgba(0,255,245,0.1); border: 1px solid rgba(0,255,245,0.2);
                    color: #00fff5; border-radius: 8px; cursor: pointer; font-weight: 700; transition: all 0.2s;
                }
                .cr-start-btn:hover { background: rgba(0,255,245,0.2); }

                .cr-leaderboard { max-width: 600px; }
                .cr-lb-row {
                    display: flex; align-items: center; gap: 16px; padding: 14px 16px;
                    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 10px; margin-bottom: 6px;
                }
                .cr-lb-you { border-color: rgba(0,255,245,0.3); background: rgba(0,255,245,0.05); }
                .cr-lb-rank { font-size: 1.3rem; min-width: 30px; }
                .cr-lb-name { flex: 1; color: #e0e0e0; font-weight: 600; }
                .cr-lb-score { color: #ffa502; font-weight: 700; }

                .cr-terminal-container { background: #0d0d14; border: 1px solid rgba(0,255,245,0.15); border-radius: 14px; overflow: hidden; }
                .cr-terminal-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: rgba(0,255,245,0.05); border-bottom: 1px solid rgba(0,255,245,0.1); }
                .cr-terminal-header span { color: #00fff5; font-weight: 700; font-size: 0.9rem; }
                .cr-exit-btn { background: none; border: none; color: #ff4757; cursor: pointer; font-size: 1rem; }
                .cr-terminal { height: 400px; overflow-y: auto; padding: 16px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; line-height: 1.6; }
                .cr-line-system { color: #00fff5; }
                .cr-line-info { color: #b388ff; }
                .cr-line-success { color: #2ed573; }
                .cr-line-error { color: #ff4757; }
                .cr-line-command { color: #ffa502; }
                .cr-line-text { color: #ccc; }
                .cr-input-row { display: flex; align-items: center; padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.05); }
                .cr-prompt { color: #00fff5; font-family: monospace; margin-right: 8px; }
                .cr-input { flex: 1; background: none; border: none; color: #e0e0e0; font-family: monospace; font-size: 0.9rem; outline: none; }
            `}</style>
        </div>
    )
}
