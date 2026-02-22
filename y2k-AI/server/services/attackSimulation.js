const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

/**
 * Attack Simulation Service
 * Provides realistic attack models and simulations for Red Team exercises.
 */
class AttackSimulationService {
    constructor(geminiKey = process.env.GEMINI_API_KEY) {
        this.geminiKey = geminiKey;
    }

    /**
     * Generate an attack path model using AI
     */
    async generateAttackModel(targetInfo) {
        const prompt = `Generate a detailed attack path graph for the following target in a LAB ENVIRONMENT:
        Target: ${JSON.stringify(targetInfo)}
        
        Provide the result as a JSON object representing a graph:
        {
          "nodes": [ { "id": "node1", "label": "Initial Access", "technique": "T1190" }, ... ],
          "edges": [ { "from": "node1", "to": "node2", "label": "Exploit" }, ... ]
        }`;

        try {
            const response = await this.callGemini(prompt);
            return this.parseJSON(response, { nodes: [], edges: [] });
        } catch (err) {
            return { error: err.message, nodes: [], edges: [] };
        }
    }

    /**
     * Simulate a Brute Force attack (logical steps + artifacts)
     */
    async simulateBruteForce(target) {
        return {
            type: 'brute_force',
            target,
            technique: 'T1110',
            steps: [
                { time: '+0s', action: 'Port Scan (SSH/RDP)', status: 'success' },
                { time: '+5s', action: 'Credential Guessing (Admin)', status: 'failed' },
                { time: '+10s', action: 'Credential Guessing (User)', status: 'failed' },
                { time: '+60s', action: 'Detection Trigger: Brute Force Alert', status: 'detected' },
                { time: '+120s', action: 'IP Blocked by IDS', status: 'blocked' }
            ],
            artifacts: ['auth.log: Failed password for root', 'fail2ban: Ban IP']
        };
    }

    /**
     * Simulate Data Exfiltration
     */
    async simulateExfiltration(target) {
        return {
            type: 'exfiltration',
            target,
            technique: 'T1041',
            steps: [
                { time: '+0s', action: 'Data Collection (Compressing .sql backups)', status: 'success' },
                { time: '+15s', action: 'Channel Setup (DNS Tunneling)', status: 'success' },
                { time: '+30s', action: 'Transfer Start (1.2 GB)', status: 'in_progress' },
                { time: '+300s', action: 'Detection Trigger: Large Outbound Flow', status: 'detected' }
            ],
            artifacts: ['NetFlow: High volume to unusual IP', 'Bro/Zeek: DNS tunnel detected']
        };
    }

    async callGemini(prompt) {
        if (!this.geminiKey) return "";
        try {
            const res = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiKey}`,
                {
                    contents: [{ parts: [{ text: prompt }] }],
                    systemInstruction: {
                        parts: [{ text: 'You are a cybersecurity attack simulation assistant. Only use information provided and do not make up or hallucinate attack details. If unsure, return empty structures.' }]
                    }
                }
            );
            return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } catch { return ""; }
    }

    parseJSON(text, fallback) {
        try {
            const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            return match ? JSON.parse(match[0]) : fallback;
        } catch { return fallback; }
    }
}

module.exports = new AttackSimulationService();
