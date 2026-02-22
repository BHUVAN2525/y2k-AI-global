import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export default function Terminal({ sessionId, onClosed }) {
    const terminalRef = useRef(null);
    const xtermRef = useRef(null);
    const wsRef = useRef(null);
    const fitAddonRef = useRef(null);

    useEffect(() => {
        if (!terminalRef.current) return;

        // Initialize xterm.js
        const term = new XTerm({
            cursorBlink: true,
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            theme: {
                background: '#0a0a0a',
                foreground: 'var(--success)',
                cursor: 'var(--success)',
                selectionBackground: 'rgba(0, 255, 136, 0.3)',
                black: '#000000',
                red: 'var(--danger)',
                green: 'var(--success)',
                yellow: '#ffaa00',
                blue: 'var(--info)',
                magenta: '#cc00ff',
                cyan: '#00ffff',
                white: '#ffffff',
            }
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);

        // Initial fit
        setTimeout(() => fitAddon.fit(), 100);

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // WebSocket connection
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.hostname}:5000/ws`);

        ws.onopen = () => {
            console.log(`[Terminal] Connected for session ${sessionId}`);
            ws.send(JSON.stringify({
                type: 'terminal_init',
                sessionId,
                rows: term.rows,
                cols: term.cols
            }));
        };

        ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.sessionId !== sessionId) return;

                if (data.type === 'terminal_output') {
                    term.write(data.text);
                } else if (data.type === 'terminal_closed') {
                    term.write('\r\n\x1b[31m[Terminal Session Closed]\x1b[0m\r\n');
                    onClosed && onClosed();
                } else if (data.type === 'terminal_error') {
                    term.write(`\r\n\x1b[31m[Error] ${data.error}\x1b[0m\r\n`);
                }
            } catch (err) {
                // Ignore non-json
            }
        };

        ws.onerror = (err) => {
            term.write(`\r\n\x1b[31m[WebSocket Connection Error]\x1b[0m\r\n`);
        };

        wsRef.current = ws;

        // Input handlers
        term.onData(data => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'terminal_input', sessionId, text: data }));
            }
        });

        term.onResize(({ cols, rows }) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'terminal_resize', sessionId, cols, rows }));
            }
        });

        // Resize behavior
        const handleResize = () => {
            fitAddon.fit();
        };

        window.addEventListener('resize', handleResize);
        const resizeObserver = new ResizeObserver(() => fitAddon.fit());
        resizeObserver.observe(terminalRef.current);

        return () => {
            console.log(`[Terminal] Cleanup session ${sessionId}`);
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
            term.dispose();
            if (ws.readyState === WebSocket.OPEN) ws.close();
        };
    }, [sessionId, onClosed]);

    return (
        <div style={{ width: '100%', height: '100%', minHeight: '300px', background: '#0a0a0a', borderRadius: 8, padding: '8px', overflow: 'hidden', border: '1px solid #333' }}>
            <div ref={terminalRef} style={{ height: '100%', width: '100%' }} />
        </div>
    );
}
