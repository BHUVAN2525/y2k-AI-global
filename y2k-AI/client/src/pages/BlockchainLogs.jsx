import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

function generateHash() {
    return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

function generateBlock(index, prevHash) {
    const timestamp = new Date(Date.now() - (50 - index) * 60000).toISOString()
    const events = Math.floor(Math.random() * 8 + 1)
    return {
        index,
        timestamp,
        hash: generateHash(),
        prevHash: prevHash || '0'.repeat(64),
        nonce: Math.floor(Math.random() * 100000),
        events,
        logEntries: Array.from({ length: events }, (_, i) => ({
            type: ['AUTH', 'NETWORK', 'FILE', 'PROCESS', 'ALERT'][Math.floor(Math.random() * 5)],
            severity: ['info', 'warning', 'critical'][Math.floor(Math.random() * 3)],
            message: [
                'User login from 192.168.1.42',
                'Firewall rule modified',
                'Failed SSH attempt from 10.0.0.99',
                'Suspicious process spawned: powershell.exe',
                'File integrity check failed: /etc/shadow',
                'New admin user created',
                'IDS alert: port scan detected',
                'Certificate expired on web-01',
            ][Math.floor(Math.random() * 8)],
            verified: Math.random() > 0.1,
        })),
        verified: Math.random() > 0.05,
    }
}

function generateChain() {
    const chain = []
    for (let i = 0; i < 20; i++) {
        chain.push(generateBlock(i, i > 0 ? chain[i - 1].hash : null))
    }
    return chain
}

export default function BlockchainLogs() {
    const [chain, setChain] = useState(generateChain())
    const [selectedBlock, setSelectedBlock] = useState(null)
    const [verifying, setVerifying] = useState(false)
    const [verificationResult, setVerificationResult] = useState(null)

    const verifyChain = async () => {
        setVerifying(true)
        setVerificationResult(null)
        await new Promise(r => setTimeout(r, 2000))
        const tampered = chain.filter(b => !b.verified).length
        setVerificationResult({
            valid: tampered === 0,
            blocks_checked: chain.length,
            tampered_blocks: tampered,
            verification_time: (Math.random() * 0.5 + 0.1).toFixed(3) + 's',
        })
        setVerifying(false)
    }

    const getSevColor = (sev) => {
        if (sev === 'critical') return 'var(--danger)'
        if (sev === 'warning') return 'var(--warning)'
        return 'var(--success)'
    }

    const totalEvents = chain.reduce((s, b) => s + b.events, 0)
    const tamperedBlocks = chain.filter(b => !b.verified).length

    return (
        <div className="page-container">
            <motion.div className="bl-page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bl-header">
                    <div>
                        <h1>⛓️ Blockchain Log Integrity</h1>
                        <p className="bl-subtitle">Tamper-proof audit trail with chain verification</p>
                    </div>
                    <button className="bl-verify-btn" onClick={verifyChain} disabled={verifying}>
                        {verifying ? '⏳ Verifying...' : '🔍 Verify Chain'}
                    </button>
                </div>

                {/* Stats */}
                <div className="bl-stats">
                    <div className="bl-stat"><strong>{chain.length}</strong><span>Blocks</span></div>
                    <div className="bl-stat"><strong>{totalEvents}</strong><span>Events</span></div>
                    <div className="bl-stat">
                        <strong style={{ color: tamperedBlocks > 0 ? 'var(--danger)' : 'var(--success)' }}>{tamperedBlocks}</strong>
                        <span>Tampered</span>
                    </div>
                    <div className="bl-stat">
                        <strong style={{ color: 'var(--success)' }}>{((chain.filter(b => b.verified).length / chain.length) * 100).toFixed(1)}%</strong>
                        <span>Integrity</span>
                    </div>
                </div>

                {/* Verification Result */}
                {verificationResult && (
                    <motion.div className={`bl-verify-result ${verificationResult.valid ? 'valid' : 'invalid'}`}
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        <span>{verificationResult.valid ? '✅ Chain Valid' : '❌ Tampering Detected'}</span>
                        <span>{verificationResult.blocks_checked} blocks checked in {verificationResult.verification_time}</span>
                        {verificationResult.tampered_blocks > 0 && (
                            <span className="bl-tampered-count">⚠️ {verificationResult.tampered_blocks} tampered blocks found</span>
                        )}
                    </motion.div>
                )}

                {/* Chain Visualization */}
                <div className="bl-chain">
                    {chain.map((block, i) => (
                        <motion.div key={i} className={`bl-block ${selectedBlock === i ? 'selected' : ''} ${!block.verified ? 'tampered' : ''}`}
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => setSelectedBlock(selectedBlock === i ? null : i)}
                        >
                            <div className="bl-block-header">
                                <span className="bl-block-idx">#{block.index}</span>
                                <span className={`bl-block-status ${block.verified ? 'ok' : 'bad'}`}>
                                    {block.verified ? '✓' : '✗'}
                                </span>
                            </div>
                            <div className="bl-block-hash">{block.hash.slice(0, 12)}...</div>
                            <div className="bl-block-meta">
                                <span>{block.events} events</span>
                                <span>{new Date(block.timestamp).toLocaleTimeString()}</span>
                            </div>
                            {i < chain.length - 1 && <div className="bl-chain-link">⛓</div>}
                        </motion.div>
                    ))}
                </div>

                {/* Block Detail */}
                {selectedBlock !== null && (
                    <motion.div className="bl-detail" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <h3>Block #{chain[selectedBlock].index} Details</h3>
                        <div className="bl-detail-grid">
                            <div className="bl-field"><span>Hash</span><code>{chain[selectedBlock].hash}</code></div>
                            <div className="bl-field"><span>Prev Hash</span><code>{chain[selectedBlock].prevHash}</code></div>
                            <div className="bl-field"><span>Nonce</span><code>{chain[selectedBlock].nonce}</code></div>
                            <div className="bl-field"><span>Timestamp</span><code>{chain[selectedBlock].timestamp}</code></div>
                        </div>
                        <h4>Log Entries</h4>
                        <div className="bl-entries">
                            {chain[selectedBlock].logEntries.map((entry, j) => (
                                <div key={j} className="bl-entry">
                                    <span className="bl-entry-type">{entry.type}</span>
                                    <span className="bl-entry-sev" style={{ color: getSevColor(entry.severity) }}>{entry.severity}</span>
                                    <span className="bl-entry-msg">{entry.message}</span>
                                    <span className={`bl-entry-verified ${entry.verified ? 'ok' : 'bad'}`}>
                                        {entry.verified ? '✓' : '✗'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </motion.div>

            <style>{`
                .bl-page { max-width: 1200px; margin: 0 auto; padding: 24px; }
                .bl-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
                .bl-header h1 { font-size: 1.8rem; color: var(--info); margin: 0; }
                .bl-subtitle { color: #888; margin-top: 4px; }
                .bl-verify-btn {
                    padding: 10px 22px; background: var(--bg-secondary), #00b894);
                    border: none; border-radius: 10px; color: #000; font-weight: 700; cursor: pointer; transition: all 0.3s;
                }
                .bl-verify-btn:disabled { opacity: 0.5; }

                .bl-stats { display: flex; gap: 16px; margin-bottom: 20px; }
                .bl-stat { flex: 1; padding: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; text-align: center; }
                .bl-stat strong { display: block; font-size: 1.5rem; color: #e0e0e0; }
                .bl-stat span { font-size: 0.8rem; color: #888; }

                .bl-verify-result {
                    padding: 16px; border-radius: 12px; margin-bottom: 20px; display: flex; gap: 20px; align-items: center;
                }
                .bl-verify-result.valid { background: rgba(46,213,115,0.08); border: 1px solid rgba(46,213,115,0.2); color: var(--success); }
                .bl-verify-result.invalid { background: rgba(255,71,87,0.08); border: 1px solid rgba(255,71,87,0.2); color: var(--danger); }
                .bl-tampered-count { color: var(--danger); font-weight: 700; }

                .bl-chain { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
                .bl-block {
                    padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 10px; cursor: pointer; min-width: 120px; position: relative; transition: all 0.2s;
                }
                .bl-block:hover { border-color: rgba(0,255,245,0.2); }
                .bl-block.selected { border-color: var(--info); background: rgba(0,255,245,0.05); }
                .bl-block.tampered { border-color: rgba(255,71,87,0.3); }
                .bl-block-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
                .bl-block-idx { color: #888; font-size: 0.78rem; font-weight: 700; }
                .bl-block-status.ok { color: var(--success); }
                .bl-block-status.bad { color: var(--danger); }
                .bl-block-hash { font-family: monospace; font-size: 0.72rem; color: var(--info); margin-bottom: 4px; }
                .bl-block-meta { display: flex; justify-content: space-between; }
                .bl-block-meta span { font-size: 0.7rem; color: #888; }
                .bl-chain-link { position: absolute; right: -12px; top: 50%; transform: translateY(-50%); font-size: 0.7rem; color: #444; }

                .bl-detail { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 20px; }
                .bl-detail h3 { color: #e0e0e0; margin: 0 0 14px; }
                .bl-detail h4 { color: #ddd; margin: 16px 0 8px; }
                .bl-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                .bl-field { display: flex; flex-direction: column; gap: 2px; }
                .bl-field span { font-size: 0.78rem; color: #888; }
                .bl-field code { font-size: 0.75rem; color: var(--info); word-break: break-all; }

                .bl-entry {
                    display: flex; align-items: center; gap: 10px; padding: 6px 8px;
                    background: rgba(0,0,0,0.2); border-radius: 6px; margin-bottom: 4px;
                }
                .bl-entry-type { font-size: 0.7rem; color: var(--primary); background: rgba(179,136,255,0.1); padding: 2px 6px; border-radius: 4px; min-width: 65px; text-align: center; }
                .bl-entry-sev { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; min-width: 55px; }
                .bl-entry-msg { flex: 1; font-size: 0.83rem; color: #ccc; }
                .bl-entry-verified.ok { color: var(--success); }
                .bl-entry-verified.bad { color: var(--danger); }
            `}</style>
        </div>
    )
}
