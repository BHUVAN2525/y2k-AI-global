/**
 * Red Planner Agent — Thin wrapper around Y2K Agent Core
 * Preserves backward compatibility with existing route calls
 */
const agentCore = require('./y2kAgentCore');

class RedPlannerAgent {
    constructor() {
        this.name = 'Red Planner Agent';
        this.tools = agentCore.name;
    }

    async think(message, sessionId = null, history = []) {
        return agentCore.think(message, 'red', sessionId, history);
    }

    async thinkStream(message, sessionId = null, history = [], callbacks = {}) {
        return agentCore.thinkStream(message, 'red', sessionId, history, callbacks);
    }
}

module.exports = new RedPlannerAgent();
