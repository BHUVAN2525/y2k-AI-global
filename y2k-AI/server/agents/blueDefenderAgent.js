/**
 * Blue Defender Agent — Thin wrapper around Y2K Agent Core
 * Preserves backward compatibility with existing route calls
 */
const agentCore = require('./y2kAgentCore');

class BlueDefenderAgent {
    constructor() {
        this.name = 'Blue Defender Agent';
        this.tools = agentCore.name;
    }

    async think(message, sessionId = null, history = []) {
        return agentCore.think(message, 'blue', sessionId, history);
    }

    async thinkStream(message, sessionId = null, history = [], callbacks = {}) {
        return agentCore.thinkStream(message, 'blue', sessionId, history, callbacks);
    }
}

module.exports = new BlueDefenderAgent();
