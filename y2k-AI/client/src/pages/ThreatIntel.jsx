import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

export default function ThreatIntel() {
    const [feeds, setFeeds] = useState(null)
    const [searchType, setSearchType] = useState('hash')
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResult, setSearchResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [feedLoading, setFeedLoading] = useState(true)

    useEffect(() => {
        loadFeeds()
    }, [])

    const loadFeeds = async () => {
        setFeedLoading(true)
        try {
            const res = await axios.get('/api/threatintel/feeds')
            setFeeds(res.data)
        } catch (err) {
            console.error('Feed load error:', err)
        }
        setFeedLoading(false)
    }

    const search = async () => {
        if (!searchQuery.trim()) return
        setLoading(true)
        setSearchResult(null)
        try {
            const endpoint = searchType === 'hash'
                ? `/api/threatintel/hash/${searchQuery.trim()}`
                : `/api/threatintel/ip/${searchQuery.trim()}`
            const res = await axios.get(endpoint)
            setSearchResult(res.data)
        } catch (err) {
            setSearchResult({ error: err.response?.data?.error || err.message })
        }
        setLoading(false)
    }

    const getThreatBadge = (level) => {
        const colors = {
            critical: { bg: 'rgba(255,71,87,0.15)', color: 'var(--danger)', border: 'rgba(255,71,87,0.4)' },
            high: { bg: 'rgba(255,165,2,0.15)', color: 'var(--warning)', border: 'rgba(255,165,2,0.4)' },
            medium: { bg: 'rgba(55,66,250,0.15)', color: '#5b8aff', border: 'rgba(55,66,250,0.4)' },
            low: { bg: 'rgba(46,213,115,0.15)', color: 'var(--success)', border: 'rgba(46,213,115,0.4)' },
            unknown: { bg: 'rgba(255,255,255,0.05)', color: '#888', border: 'rgba(255,255,255,0.1)' },
        }
        const c = colors[level] || colors.unknown
        return (
            <span style={{
                background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                padding: '4px 12px', borderRadius: '6px', fontSize: '0.78rem',
                fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase'
            }}>
                {level}
            </span>
        )
    }

    return (
        <div className="page-container">
            <motion.div
                className="ti-page"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="ti-header">
                    <h1>📡 Threat Intelligence Center</h1>
                    <p className="ti-subtitle">Live IOC enrichment & global threat feed aggregation</p>
                </div>

                {/* IOC Search */}
                <div className="ti-search-card">
                    <h2>🔍 IOC Lookup</h2>
                    <div className="ti-search-controls">
                        <div className="ti-search-tabs">
                            <button
                                className={`ti-tab ${searchType === 'hash' ? 'active' : ''}`}
                                onClick={() => setSearchType('hash')}
                            >
                                # Hash
                            </button>
                            <button
                                className={`ti-tab ${searchType === 'ip' ? 'active' : ''}`}
                                onClick={() => setSearchType('ip')}
                            >
                                🌐 IP Address
                            </button>
                        </div>
                        <div className="ti-search-input-row">
                            <input
                                type="text"
                                className="ti-search-input"
                                placeholder={searchType === 'hash'
                                    ? 'Enter MD5, SHA1, or SHA256 hash...'
                                    : 'Enter IP address (e.g., 185.220.101.1)...'}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && search()}
                            />
                            <button className="ti-search-btn" onClick={search} disabled={loading}>
                                {loading ? '⏳' : '🔍'} Search
                            </button>
                        </div>
                    </div>

                    {/* Search Results */}
                    {searchResult && (
                        <motion.div
                            className="ti-results"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {searchResult.error ? (
                                <div className="ti-error">⚠️ {searchResult.error}</div>
                            ) : (
                                <>
                                    <div className="ti-result-header">
                                        <div>
                                            <span className="ti-result-type">{searchType.toUpperCase()}</span>
                                            <code className="ti-result-value">{searchResult.hash || searchResult.ip}</code>
                                        </div>
                                        {getThreatBadge(searchResult.threat_level)}
                                    </div>
                                    <div className="ti-sources">
                                        {Object.entries(searchResult.sources || {}).map(([name, data]) => (
                                            <div key={name} className="ti-source-card">
                                                <div className="ti-source-header">
                                                    <h4>{name === 'virustotal' ? '🦠 VirusTotal' : name === 'abuseipdb' ? '🛡️ AbuseIPDB' : `📡 ${name}`}</h4>
                                                    <span className={`ti-source-status ${data.available ? 'online' : 'offline'}`}>
                                                        {data.available ? '● Available' : '○ ' + (data.error || 'Unavailable')}
                                                    </span>
                                                </div>
                                                {data.available && (
                                                    <div className="ti-source-data">
                                                        {data.detections !== undefined && (
                                                            <div className="ti-data-row">
                                                                <span>Detections</span>
                                                                <strong style={{ color: data.detections > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                                                    {data.detection_rate || `${data.detections}`}
                                                                </strong>
                                                            </div>
                                                        )}
                                                        {data.abuse_confidence_score !== undefined && (
                                                            <div className="ti-data-row">
                                                                <span>Abuse Confidence</span>
                                                                <strong style={{ color: data.abuse_confidence_score > 50 ? 'var(--danger)' : 'var(--success)' }}>
                                                                    {data.abuse_confidence_score}%
                                                                </strong>
                                                            </div>
                                                        )}
                                                        {data.total_reports !== undefined && (
                                                            <div className="ti-data-row">
                                                                <span>Total Reports</span>
                                                                <strong>{data.total_reports}</strong>
                                                            </div>
                                                        )}
                                                        {data.country && (
                                                            <div className="ti-data-row">
                                                                <span>Country</span>
                                                                <strong>{data.country}</strong>
                                                            </div>
                                                        )}
                                                        {data.isp && (
                                                            <div className="ti-data-row">
                                                                <span>ISP</span>
                                                                <strong>{data.isp}</strong>
                                                            </div>
                                                        )}
                                                        {data.is_tor && (
                                                            <div className="ti-data-row">
                                                                <span>Tor Exit Node</span>
                                                                <strong style={{ color: 'var(--danger)' }}>YES</strong>
                                                            </div>
                                                        )}
                                                        {data.file_type && (
                                                            <div className="ti-data-row">
                                                                <span>File Type</span>
                                                                <strong>{data.file_type}</strong>
                                                            </div>
                                                        )}
                                                        {data.tags?.length > 0 && (
                                                            <div className="ti-tags">
                                                                {data.tags.map((t, i) => (
                                                                    <span key={i} className="ti-tag">{t}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* Live Feeds */}
                <div className="ti-feeds-section">
                    <h2>🌍 Live Threat Feeds</h2>
                    {feedLoading ? (
                        <div className="ti-loading">Loading feeds...</div>
                    ) : feeds?.sources?.length > 0 ? (
                        <div className="ti-feed-grid">
                            {feeds.sources.map((feed, i) => (
                                <motion.div
                                    key={i}
                                    className="ti-feed-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <div className="ti-feed-header">
                                        <h3>{feed.name}</h3>
                                        <span className={`ti-feed-status ${feed.status}`}>
                                            {feed.status === 'operational' ? '🟢' : '🔴'} {feed.status}
                                        </span>
                                    </div>
                                    {feed.type && (
                                        <span className="ti-feed-type">{feed.type.replace(/_/g, ' ')}</span>
                                    )}
                                    {feed.count !== undefined && (
                                        <div className="ti-feed-count">
                                            <strong>{feed.count.toLocaleString()}</strong> entries
                                        </div>
                                    )}
                                    {feed.sample?.length > 0 && (
                                        <div className="ti-feed-samples">
                                            {feed.sample.slice(0, 3).map((s, j) => (
                                                <div key={j} className="ti-feed-sample">
                                                    {s.ip && <code>{s.ip}:{s.port}</code>}
                                                    {s.url && <code>{s.url.slice(0, 60)}...</code>}
                                                    {s.malware && <span className="ti-tag">{s.malware}</span>}
                                                    {s.threat && <span className="ti-tag">{s.threat}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="ti-empty">No feed data available. Check API connectivity.</div>
                    )}
                </div>
            </motion.div>

            <style>{`
                .ti-page { max-width: 1200px; margin: 0 auto; padding: 24px; }
                .ti-header { margin-bottom: 32px; }
                .ti-header h1 { font-size: 1.8rem; color: var(--info); margin: 0; }
                .ti-subtitle { color: #888; margin-top: 4px; }

                .ti-search-card {
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 16px; padding: 24px; margin-bottom: 32px;
                }
                .ti-search-card h2 { color: #e0e0e0; margin: 0 0 16px; font-size: 1.2rem; }

                .ti-search-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
                .ti-tab {
                    padding: 8px 20px; border: 1px solid rgba(255,255,255,0.1);
                    background: transparent; color: #999; border-radius: 8px;
                    cursor: pointer; transition: all 0.2s; font-size: 0.9rem;
                }
                .ti-tab.active {
                    background: rgba(0,255,245,0.1); border-color: rgba(0,255,245,0.3);
                    color: var(--info);
                }

                .ti-search-input-row { display: flex; gap: 12px; }
                .ti-search-input {
                    flex: 1; padding: 12px 16px; background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
                    color: #e0e0e0; font-size: 0.95rem; font-family: 'Fira Code', monospace;
                }
                .ti-search-input:focus { outline: none; border-color: var(--info); }
                .ti-search-btn {
                    padding: 12px 24px; background: var(--bg-secondary), var(--primary));
                    border: none; border-radius: 10px; color: #000; font-weight: 700;
                    cursor: pointer; white-space: nowrap; transition: all 0.3s;
                }
                .ti-search-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,255,245,0.3); }
                .ti-search-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .ti-results { margin-top: 20px; }
                .ti-error { color: var(--danger); padding: 16px; background: rgba(255,71,87,0.08); border-radius: 10px; }

                .ti-result-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 16px; background: rgba(0,0,0,0.2); border-radius: 10px; margin-bottom: 16px;
                }
                .ti-result-type {
                    font-size: 0.7rem; color: #888; letter-spacing: 1px;
                    background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 4px;
                    margin-right: 12px;
                }
                .ti-result-value { color: #e0e0e0; font-size: 0.85rem; }

                .ti-sources { display: flex; flex-direction: column; gap: 12px; }
                .ti-source-card {
                    padding: 16px; background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;
                }
                .ti-source-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
                .ti-source-header h4 { margin: 0; color: #ddd; font-size: 1rem; }
                .ti-source-status { font-size: 0.8rem; }
                .ti-source-status.online { color: var(--success); }
                .ti-source-status.offline { color: #888; }

                .ti-data-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
                .ti-data-row span { color: #888; font-size: 0.88rem; }
                .ti-data-row strong { color: #e0e0e0; font-size: 0.88rem; }

                .ti-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
                .ti-tag {
                    padding: 3px 10px; background: rgba(124,77,255,0.12); color: var(--primary);
                    border-radius: 5px; font-size: 0.75rem; border: 1px solid rgba(124,77,255,0.2);
                }

                .ti-feeds-section { margin-top: 8px; }
                .ti-feeds-section h2 { color: #e0e0e0; font-size: 1.3rem; margin-bottom: 16px; }
                .ti-feed-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 16px; }

                .ti-feed-card {
                    padding: 20px; background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08); border-radius: 14px;
                    transition: all 0.3s;
                }
                .ti-feed-card:hover { border-color: rgba(0,255,245,0.2); transform: translateY(-2px); }
                .ti-feed-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                .ti-feed-header h3 { margin: 0; color: #ddd; font-size: 1rem; }
                .ti-feed-status { font-size: 0.8rem; }
                .ti-feed-type {
                    font-size: 0.75rem; color: var(--info); background: rgba(0,255,245,0.08);
                    padding: 3px 10px; border-radius: 5px; text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .ti-feed-count { margin-top: 12px; color: #aaa; }
                .ti-feed-count strong { color: var(--info); font-size: 1.3rem; }

                .ti-feed-samples { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
                .ti-feed-sample {
                    padding: 6px 10px; background: rgba(0,0,0,0.2); border-radius: 6px;
                    display: flex; align-items: center; gap: 8px; font-size: 0.82rem;
                }
                .ti-feed-sample code { color: #ccc; font-size: 0.8rem; }

                .ti-loading, .ti-empty { color: #888; padding: 40px; text-align: center; }
            `}</style>
        </div>
    )
}
