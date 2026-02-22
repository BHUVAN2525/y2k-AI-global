import React from 'react';

/**
 * Animated Refresh Button Component
 * Design sourced via Uiverse.io
 */
export default function RefreshButton({ onClick, loading, title = "Refresh" }) {
    return (
        <button className="loader-btn" onClick={onClick} disabled={loading} title={title}>
            <div className="loader" style={{
                // Tweak the animation speed if loading, otherwise pause it or slow it down
                '--time-animation': loading ? '1s' : '0s',
                opacity: loading ? 1 : 0.8
            }}>
                <svg viewBox="0 0 100 100" id="cloud">
                    <g id="shapes">
                        <g>
                            <circle r="15" cy="60" cx="20"></circle>
                            <circle r="20" cy="45" cx="50"></circle>
                            <circle r="15" cy="60" cx="80"></circle>
                        </g>
                    </g>
                    <g>
                        <rect height="30" width="60" y="45" x="20"></rect>
                    </g>
                    {/* Arrows for rotation */}
                    <g>
                        <path d="M 50 10 A 40 40 0 1 1 10 50 L 20 50 A 30 30 0 1 0 50 20 Z" />
                        <polygon points="50,0 65,15 35,15" />
                    </g>
                </svg>
            </div>
            {/* Optional visible text next to icon */}
            <span style={{
                marginLeft: '4px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)'
            }}>
                {loading ? 'Refreshing...' : title}
            </span>
        </button>
    );
}
