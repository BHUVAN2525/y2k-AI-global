/**
 * Shared WebSocket broadcast helper
 * Avoids circular dependency between index.js and routes
 */
const WebSocket = require('ws')
const { handleTerminalMessage, cleanupTerminal } = require('./sshTerminalService')

const clients = new Set()

function registerClient(ws) {
    clients.add(ws)

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type?.startsWith('terminal_')) {
                handleTerminalMessage(ws, data);
            }
        } catch (err) {
            // Ignore non-JSON or malformed messages
        }
    });

    ws.on('close', () => {
        cleanupTerminal(ws);
        clients.delete(ws);
    })

    ws.on('error', () => {
        cleanupTerminal(ws);
        clients.delete(ws);
    })
}

function broadcast(data) {
    const msg = JSON.stringify(data)
    clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) ws.send(msg)
    })
}

module.exports = { clients, registerClient, broadcast }
