import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Terminal from '../components/Terminal';

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -16 }
};

export default function VMTerminal() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch current active session if any
        const fetchSession = async () => {
            try {
                const res = await axios.get('/api/sandbox/sessions');
                if (res.data?.sessions?.length > 0) {
                    setSession(res.data.sessions[0]);
                }
            } catch (err) {
                console.error('Failed to fetch sessions', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSession();
    }, []);

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'var(--bg-secondary),var(--primary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.3rem', boxShadow: '0 0 20px rgba(99,102,241,0.3)'
                    }}>🐚</div>
                    <div>
                        <h1 className="page-title" style={{ marginBottom: 0 }}>VM Terminal</h1>
                        <p className="page-subtitle" style={{ marginBottom: 0 }}>Interactive Remote Shell Access</p>
                    </div>
                </div>

                {session && (
                    <div style={{
                        padding: '0.4rem 0.8rem', background: 'rgba(0,255,136,0.1)',
                        border: '1px solid rgba(0,255,136,0.2)', borderRadius: 8,
                        fontSize: '0.75rem', color: 'var(--success)', fontFamily: 'var(--font-mono)'
                    }}>
                        CONNECTED: {session.host}
                    </div>
                )}
            </div>

            {!session && !loading && (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗</div>
                    <h2 style={{ marginBottom: '0.5rem' }}>No Active Session</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto' }}>
                        You must first connect to a VM in the <strong>Sandbox</strong> or <strong>Settings</strong> to open an interactive terminal session.
                    </p>
                    <button
                        onClick={() => window.location.href = '/sandbox'}
                        style={{
                            padding: '0.6rem 1.5rem', borderRadius: 8, border: 'none',
                            background: 'var(--bg-secondary),#0066cc)',
                            color: '#fff', fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        Go to Sandbox
                    </button>
                </div>
            )}

            {session && (
                <div style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
                    <Terminal sessionId={session.id || session.sessionId} />
                </div>
            )}

            {loading && (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="loader" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Initializing terminal stream...</p>
                </div>
            )}
        </motion.div>
    );
}
