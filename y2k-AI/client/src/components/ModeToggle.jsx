import { useMode } from '../contexts/ModeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export default function ModeToggle() {
    const { mode, setMode, switching } = useMode()
    const [showConfirm, setShowConfirm] = useState(false)

    const handleRedClick = () => {
        if (mode === 'red') return
        setShowConfirm(true)
    }

    const confirmRed = () => {
        setShowConfirm(false)
        setMode('red')
    }

    return (
        <>
            <div className="mode-toggle">
                <button
                    className={`mode-btn mode-btn-blue ${mode === 'blue' ? 'active' : ''}`}
                    onClick={() => setMode('blue')}
                >
                    🔵 BLUE
                </button>
                <button
                    className={`mode-btn mode-btn-red ${mode === 'red' ? 'active' : ''}`}
                    onClick={handleRedClick}
                >
                    🔴 RED
                </button>
            </div>

            {/* Red Mode Confirmation Dialog */}
            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 9999, backdropFilter: 'blur(4px)'
                        }}
                        onClick={() => setShowConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: '#1e0c10', border: '1px solid rgba(255,51,102,0.4)',
                                borderRadius: 16, padding: '2rem', maxWidth: 420, width: '90%',
                                boxShadow: '0 0 40px rgba(255,51,102,0.2)'
                            }}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
                            <h2 style={{ color: '#ff3366', marginBottom: '0.75rem', fontSize: '1.1rem' }}>
                                Authorized Lab Simulation Mode
                            </h2>
                            <p style={{ color: '#8892a4', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                                Red Mode enables offensive simulation tools for <strong style={{ color: '#e8eaf0' }}>authorized lab environments only</strong>.
                                All recon and attack simulations must target private/lab IP ranges.
                                Unauthorized use against real systems is illegal.
                            </p>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    onClick={confirmRed}
                                    style={{
                                        flex: 1, padding: '0.6rem', background: '#ff3366', color: '#fff',
                                        border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    I Understand — Enter Red Mode
                                </button>
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    style={{
                                        flex: 1, padding: '0.6rem', background: 'transparent', color: '#8892a4',
                                        border: '1px solid #3d1520', borderRadius: 8, cursor: 'pointer',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
