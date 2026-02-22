/**
 * SSH Terminal Service — Interactive Shell Over WebSockets
 */
const sandbox = require('./sandboxService');

function handleTerminalMessage(ws, data) {
    const { type, sessionId } = data;

    if (type === 'terminal_init') {
        initShell(ws, sessionId, data.rows || 24, data.cols || 80);
    } else if (type === 'terminal_input') {
        const stream = ws.terminalStreams?.[sessionId];
        if (stream) stream.write(data.text);
    } else if (type === 'terminal_resize') {
        const stream = ws.terminalStreams?.[sessionId];
        if (stream) stream.setWindow(data.rows, data.cols);
    }
}

async function initShell(ws, sessionId, rows, cols) {
    try {
        const stream = await sandbox.createShell(sessionId, { rows, cols, term: 'xterm-256color' });

        if (!ws.terminalStreams) ws.terminalStreams = {};
        ws.terminalStreams[sessionId] = stream;

        stream.on('data', (d) => {
            if (ws.readyState === 1) { // OPEN
                ws.send(JSON.stringify({ type: 'terminal_output', sessionId, text: d.toString() }));
            }
        });

        stream.on('close', () => {
            if (ws.readyState === 1) {
                ws.send(JSON.stringify({ type: 'terminal_closed', sessionId }));
            }
            delete ws.terminalStreams[sessionId];
        });

        stream.on('error', (err) => {
            console.error(`[Terminal] Stream error (${sessionId}):`, err);
            if (ws.readyState === 1) {
                ws.send(JSON.stringify({ type: 'terminal_error', sessionId, error: err.message }));
            }
        });

    } catch (err) {
        console.error(`[Terminal] Failed to init shell (${sessionId}):`, err);
        ws.send(JSON.stringify({ type: 'terminal_error', sessionId, error: err.message }));
    }
}

function cleanupTerminal(ws) {
    if (ws.terminalStreams) {
        Object.values(ws.terminalStreams).forEach(stream => stream.end());
        ws.terminalStreams = {};
    }
}

module.exports = { handleTerminalMessage, cleanupTerminal };
