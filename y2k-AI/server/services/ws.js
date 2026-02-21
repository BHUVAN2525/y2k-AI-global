/**
 * Shared WebSocket broadcast helper
 * Avoids circular dependency between index.js and routes
 */
const WebSocket = require('ws')

const clients = new Set()

function registerClient(ws) {
    clients.add(ws)
    ws.on('close', () => clients.delete(ws))
    ws.on('error', () => clients.delete(ws))
}

function broadcast(data) {
    const msg = JSON.stringify(data)
    clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) ws.send(msg)
    })
}

module.exports = { clients, registerClient, broadcast }
