import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -16 }
}

export default function Monitor() {
    const [status, setStatus] = useState({ running: false, directories: [], events: [] })
    const [dirs, setDirs] = useState('C:\\Users\\Public')
    const [events, setEvents] = useState([])
    const wsRef = useRef(null)
    const eventsEndRef = useRef(null)

    useEffect(() => {
        axios.get('/api/monitor/status').then(r => setStatus(r.data)).catch(() => { })

        const ws = new WebSocket(`ws://${window.location.host}/ws`)
        ws.onmessage = (e) => {
            const data = JSON.parse(e.data)
            if (['monitor_started', 'monitor_stopped', 'monitor_event'].includes(data.type)) {
                setEvents(prev => [{ ...data, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 99)])
            }
        }
        wsRef.current = ws
        return () => ws.close()
    }, [])

    useEffect(() => { eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [events])

    const start = async () => {
        const directories = dirs.split(',').map(d => d.trim()).filter(Boolean)
        const res = await axios.post('/api/monitor/start', { directories })
        setStatus(res.data.state)
        setEvents(prev => [{ type: 'monitor_started', message: `Monitoring: ${directories.join(', ')}`, time: new Date().toLocaleTimeString() }, ...prev])
    }

    const stop = async () => {
        const res = await axios.post('/api/monitor/stop')
        setStatus(res.data.state)
        setEvents(prev => [{ type: 'monitor_stopped', message: 'Monitoring stopped', time: new Date().toLocaleTimeString() }, ...prev])
    }

    return (
        <motion.div className="page-container" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <div className="page-title">Real-time Monitor</div>
            <div className="page-subtitle">Live file system surveillance and threat detection</div>

            {/* Warning */}
            <div style={{ background: 'rgba(255,204,0,0.1)', border: '1px solid rgba(255,204,0,0.3)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--yellow)' }}>
                ⚠️ <strong>VM Recommended:</strong> Real-time monitoring with dynamic analysis should only be used in an isolated VM environment.
            </div>

            {/* Control Panel */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{
                        width: 12, height: 12, borderRadius: '50%',
                        background: status.running ? 'var(--green)' : 'var(--text-muted)',
                        boxShadow: status.running ? '0 0 10px var(--green)' : 'none'
                    }} />
                    <span style={{ fontWeight: 600 }}>Status: {status.running ? 'Monitoring Active' : 'Stopped'}</span>
                </div>

                {!status.running ? (
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                                Directories to monitor (comma-separated):
                            </label>
                            <input className="input" value={dirs} onChange={e => setDirs(e.target.value)} placeholder="C:\Users\Public, C:\Downloads" />
                        </div>
                        <button className="btn btn-primary" onClick={start}>▶ Start Monitoring</button>
                    </div>
                ) : (
                    <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Watching: {status.directories?.join(', ')}
                        </div>
                        <button className="btn btn-danger" onClick={stop}>⏹ Stop Monitoring</button>
                    </div>
                )}
            </div>

            {/* Event Feed */}
            <div className="card">
                <div className="section-title">📡 Live Event Feed</div>
                <div style={{ height: 400, overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {events.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            {status.running ? 'Waiting for events...' : 'Start monitoring to see live events'}
                        </div>
                    ) : events.map((ev, i) => (
                        <div key={i} style={{
                            padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)',
                            color: ev.type === 'monitor_stopped' ? 'var(--text-muted)' : ev.type?.includes('malware') ? 'var(--red)' : 'var(--text-secondary)',
                            display: 'flex', gap: '1rem'
                        }}>
                            <span style={{ color: 'var(--text-muted)', minWidth: 70 }}>{ev.time}</span>
                            <span style={{ color: ev.type === 'monitor_started' ? 'var(--green)' : 'inherit' }}>
                                {ev.type === 'monitor_started' ? '▶' : ev.type === 'monitor_stopped' ? '⏹' : '→'} {ev.message || ev.type}
                            </span>
                        </div>
                    ))}
                    <div ref={eventsEndRef} />
                </div>
            </div>
        </motion.div>
    )
}
