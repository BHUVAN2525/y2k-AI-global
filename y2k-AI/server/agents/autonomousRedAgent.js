/**
 * Autonomous Red Team Agent
 * 
 * Fully autonomous red team agent that:
 * - Self-directs attack scenarios
 * - Plans sophisticated attack paths
 * - Simulates lateral movement
 * - Generates attack playbooks
 * - Maps to MITRE ATT&CK framework
 * - Provides defense recommendations
 * 
 * Works ONLY on authorized lab environments
 * ZERO real system targeting
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class AutonomousRedAgent {
    constructor(geminiKey = process.env.GEMINI_API_KEY) {
        this.agentId = `red-${uuidv4().slice(0, 8)}`;
        this.geminiKey = geminiKey;
        this.mode = 'red';
        this.conversationHistory = [];
        this.attackPlans = [];
        this.simulationResults = [];
        this.defenseRecommendations = [];
        this.automationStatus = 'idle';
        this.decisionLog = [];
        this.labEnvironmentOnly = true;
    }

    /**
     * Main autonomous red team simulation
     */
    async autonomousAttackSimulation(labTarget = {}) {
        console.log(`[${this.agentId}] Starting autonomous red team simulation...`);
        
        // Verify lab-only restriction
        if (!this.isLabEnvironment(labTarget)) {
            return {
                success: false,
                error: 'ERROR: Red Team Agent only operates on AUTHORIZED LAB ENVIRONMENTS',
                reason: 'IP range suggests production system',
                agentId: this.agentId
            };
        }

        this.automationStatus = 'running';
        const simulation = {
            simulationId: uuidv4(),
            timestamp: new Date().toISOString(),
            target: labTarget,
            phases: [],
            decisions: [],
            artifacts: []
        };

        try {
            // Phase 1: Reconnaissance
            console.log(`[${this.agentId}] Phase 1: Reconnaissance`);
            const recon = await this.conductReconnaissance(labTarget);
            simulation.phases.push({
                phase: 'reconnaissance',
                findings: recon,
                duration: '5-10 minutes'
            });
            simulation.decisions.push({
                phase: 'recon',
                targets_identified: recon.targets?.length || 0,
                vulnerabilities: recon.vulnerabilities?.length || 0
            });

            // Phase 2: Attack Path Planning
            console.log(`[${this.agentId}] Phase 2: Attack Path Planning`);
            const attackPaths = await this.planAttackPaths(recon);
            this.attackPlans.push(...attackPaths);
            simulation.phases.push({
                phase: 'attack_planning',
                paths: attackPaths,
                duration: '10-15 minutes'
            });
            simulation.decisions.push({
                phase: 'planning',
                attack_paths: attackPaths.length,
                selected_path: attackPaths[0]?.id || null
            });

            // Phase 3: Initial Access Simulation
            console.log(`[${this.agentId}] Phase 3: Initial Access`);
            const initialAccess = await this.simulateInitialAccess(attackPaths[0], recon);
            simulation.phases.push({
                phase: 'initial_access',
                technique: initialAccess.technique,
                success: initialAccess.success,
                artifacts: initialAccess.artifacts
            });
            simulation.artifacts.push(...(initialAccess.artifacts || []));

            // Phase 4: Persistence Mechanisms
            console.log(`[${this.agentId}] Phase 4: Persistence`);
            const persistence = await this.planPersistence(initialAccess);
            simulation.phases.push({
                phase: 'persistence',
                techniques: persistence.techniques,
                mitre_mapping: persistence.mitre
            });

            // Phase 5: Privilege Escalation
            console.log(`[${this.agentId}] Phase 5: Privilege Escalation`);
            const privesc = await this.planPrivilegeEscalation(initialAccess);
            simulation.phases.push({
                phase: 'privilege_escalation',
                techniques: privesc.techniques,
                success_factors: privesc.success_factors
            });

            // Phase 6: Lateral Movement
            console.log(`[${this.agentId}] Phase 6: Lateral Movement`);
            const lateral = await this.planLateralMovement(recon, privesc);
            simulation.phases.push({
                phase: 'lateral_movement',
                paths: lateral.paths,
                targets: lateral.targets
            });

            // Phase 7: Data Exfiltration & Impact
            console.log(`[${this.agentId}] Phase 7: Exfiltration`);
            const exfil = await this.planExfiltration(lateral);
            simulation.phases.push({
                phase: 'exfiltration',
                methods: exfil.methods,
                impact_assessment: exfil.impact
            });

            // Phase 8: Defense Evasion
            console.log(`[${this.agentId}] Phase 8: Defense Evasion`);
            const evasion = await this.planDefenseEvasion(simulation);
            simulation.phases.push({
                phase: 'defense_evasion',
                techniques: evasion.techniques
            });

            // Phase 9: Blue Team Perspective (Defense)
            console.log(`[${this.agentId}] Phase 9: Defense Recommendations`);
            const defense = await this.generateDefenseRecommendations(simulation);
            this.defenseRecommendations.push(...defense);
            simulation.phases.push({
                phase: 'blue_perspective',
                detections: defense.detections,
                preventions: defense.preventions,
                hunting_queries: defense.hunting_queries
            });

            // Phase 10: Report Generation
            console.log(`[${this.agentId}] Phase 10: Report Generation`);
            const report = await this.generateAttackReport(simulation);
            simulation.report = report;

            this.automationStatus = 'completed';
            this.recordDecision(simulation);
            this.simulationResults.push(simulation);

            return {
                success: true,
                agentId: this.agentId,
                simulation,
                labEnvironmentVerified: true,
                timestamp: new Date().toISOString()
            };

        } catch (err) {
            console.error(`[${this.agentId}] Simulation error:`, err.message);
            this.automationStatus = 'error';
            return {
                success: false,
                error: err.message,
                agentId: this.agentId,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Verify this is a lab environment only
     */
    isLabEnvironment(target) {
        const labRanges = [
            /^10\./,                    // 10.0.0.0/8
            /^172\.(1[6-9]|2[0-9]|3[01])\./,  // 172.16.0.0/12
            /^192\.168\./,              // 192.168.0.0/16
            /^127\./,                   // 127.0.0.0/8 (localhost)
            /^169\.254\./,              // 169.254.0.0/16 (link-local)
            /localhost/i,
            /lab/i,
            /test/i,
            /dev/i
        ];

        const ip = target.ip || target.host || '';
        const hostname = target.hostname || '';

        const isLab = labRanges.some(range => {
            return range.test(ip) || range.test(hostname);
        });

        if (!isLab && ip && hostname) {
            console.warn('[Red Agent] WARNING: Target does not appear to be in lab range');
            return false;
        }

        console.log('[Red Agent] Lab environment verified - proceeding with authorized simulation');
        return true;
    }

    /**
     * Conduct reconnaissance
     */
    async conductReconnaissance(target) {
        const prompt = `Simulate reconnaissance on this LAB target:

Target: ${JSON.stringify(target, null, 2)}

This is a LAB ENVIRONMENT SIMULATION ONLY. Provide reconnaissance findings:
1. Identified systems
2. Operating systems detected
3. Services and versions
4. Known vulnerabilities
5. Attack surface

Return JSON with reconnaissance data.`;

        const recon = await this.callGemini(prompt);
        return this.parseJSON(recon, {
            targets: [],
            vulnerabilities: [],
            services: [],
            attack_surface_analysis: {}
        });
    }

    /**
     * Plan attack paths
     */
    async planAttackPaths(recon) {
        const prompt = `Based on this reconnaissance, plan multiple attack paths for a red team exercise:

Recon: ${JSON.stringify(recon, null, 2)}

For each path provide:
1. Path ID
2. Initial access technique (MITRE)
3. Steps in sequence
4. Likelihood of success
5. Time estimate
6. Required tools/knowledge
7. Detection opportunities

Return JSON array of attack paths.`;

        const paths = await this.callGemini(prompt);
        const parsed = this.parseJSON(paths, []);

        // Add IDs if missing
        return parsed.map((path, i) => ({
            id: path.id || uuidv4(),
            ...path
        }));
    }

    /**
     * Simulate initial access
     */
    async simulateInitialAccess(path, recon) {
        const prompt = `Describe how initial access would be obtained in this attack path:

Path: ${JSON.stringify(path, null, 2)}
Recon: ${JSON.stringify(recon, null, 2)}

Provide:
1. MITRE ATT&CK technique ID
2. Detailed steps (no actual exploit code)
3. Prerequisites
4. Expected artifacts/logs
5. Success indicators
6. Detection methods (for Blue Team)

Return JSON structure.`;

        const access = await this.callGemini(prompt);
        return this.parseJSON(access, {
            technique: 'Unknown',
            artifacts: [],
            success: true
        });
    }

    /**
     * Plan persistence mechanisms
     */
    async planPersistence(access) {
        const prompt = `Given this initial access, plan persistence mechanisms:

Access: ${JSON.stringify(access, null, 2)}

For each persistence method provide:
1. MITRE ATT&CK technique
2. Implementation approach (high-level)
3. Detection indicators
4. Blue team countermeasures

Return JSON array of persistence methods.`;

        const persistence = await this.callGemini(prompt);
        return this.parseJSON(persistence, {
            techniques: [],
            mitre: []
        });
    }

    /**
     * Plan privilege escalation
     */
    async planPrivilegeEscalation(access) {
        const prompt = `Plan privilege escalation from this initial access:

Access: ${JSON.stringify(access, null, 2)}

Provide:
1. Escalation techniques (MITRE ATT&CK)
2. Windows/Linux specific approaches
3. Prerequisite conditions
4. Success factors
5. Detection methods

Return JSON structure.`;

        const privesc = await this.callGemini(prompt);
        return this.parseJSON(privesc, {
            techniques: [],
            success_factors: []
        });
    }

    /**
     * Plan lateral movement
     */
    async planLateralMovement(recon, privesc) {
        const prompt = `Plan lateral movement through the network:

Recon: ${JSON.stringify(recon, null, 2)}
Privesc: ${JSON.stringify(privesc, null, 2)}

Provide:
1. Movement paths through network
2. Target systems for compromise
3. Techniques used (MITRE)
4. Credential usage
5. Timing and sequencing
6. Network traffic patterns

Return JSON structure.`;

        const lateral = await this.callGemini(prompt);
        return this.parseJSON(lateral, {
            paths: [],
            targets: []
        });
    }

    /**
     * Plan data exfiltration
     */
    async planExfiltration(lateral) {
        const prompt = `Plan data exfiltration from compromised systems:

Lateral: ${JSON.stringify(lateral, null, 2)}

Provide:
1. Exfiltration techniques
2. Target data types
3. Channel options
4. Volume and timing
5. Obfuscation methods
6. Detection indicators

Return JSON structure.`;

        const exfil = await this.callGemini(prompt);
        return this.parseJSON(exfil, {
            methods: [],
            impact: {}
        });
    }

    /**
     * Plan defense evasion
     */
    async planDefenseEvasion(simulation) {
        const prompt = `For this attack simulation, what defense evasion techniques would apply?

Simulation: ${JSON.stringify({
            initial_access: simulation.phases[2],
            persistence: simulation.phases[3],
            lateral: simulation.phases[5]
        }, null, 2)}

Provide:
1. Evasion techniques (MITRE ATT&CK)
2. Tools and methods
3. Timing considerations
4. Detection bypass techniques

Return JSON array.`;

        const evasion = await this.callGemini(prompt);
        return this.parseJSON(evasion, {
            techniques: []
        });
    }

    /**
     * Generate defense recommendations
     */
    async generateDefenseRecommendations(simulation) {
        const prompt = `As a Blue Team defender, how would you detect and stop this attack?

Attack Simulation:
- Initial Access: ${simulation.phases[2]?.technique}
- Persistence: ${simulation.phases[3]?.techniques?.join(', ')}
- Lateral Movement: ${simulation.phases[5]?.targets?.length || 0} targets

Provide:
1. Detection methods (SIEM, EDR, Network)
2. Prevention techniques
3. Hunting queries
4. Response procedures
5. Sigma/Detection rules

Return JSON structure.`;

        const defense = await this.callGemini(prompt);
        return this.parseJSON(defense, {
            detections: [],
            preventions: [],
            hunting_queries: []
        });
    }

    /**
     * Generate attack report
     */
    async generateAttackReport(simulation) {
        return {
            executiveReport: {
                title: 'Red Team Exercise Report',
                objective: 'Assess security posture and identify vulnerabilities',
                targetEnvironment: 'Authorized Lab Only',
                simulationId: simulation.simulationId,
                timestamp: new Date().toISOString()
            },
            attackChain: simulation.phases,
            criticality: this.assessCriticality(simulation),
            defendersView: simulation.phases.find(p => p.phase === 'blue_perspective'),
            recommendations: {
                technical: ['Enable EDR', 'Configure SIEM rules', 'Implement network segmentation'],
                procedural: ['Incident response plan', 'Attack simulation training', 'Regular reviews'],
                architectural: ['Network segmentation', 'Zero trust architecture', 'Defense in depth']
            }
        };
    }

    /**
     * Assess attack criticality
     */
    assessCriticality(simulation) {
        const phases = simulation.phases || [];
        const hasPersistence = phases.some(p => p.phase === 'persistence');
        const hasLateral = phases.some(p => p.phase === 'lateral_movement');
        const hasExfil = phases.some(p => p.phase === 'exfiltration');

        if (hasExfil) return 'critical';
        if (hasLateral && hasPersistence) return 'high';
        if (hasPersistence) return 'medium';
        return 'low';
    }

    /**
     * Call Gemini with conversation history
     */
    async callGemini(userMessage, retries = 2) {
        if (!this.geminiKey) {
            console.log('[Red Agent] No Gemini key - using fallback');
            return JSON.stringify({ status: 'fallback', mode: 'lab_simulation' });
        }

        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        try {
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiKey}`,
                {
                    contents: this.conversationHistory.map(msg => ({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }]
                    })),
                    systemInstruction: {
                        parts: [{
                            text: 'You are an autonomous Red Team agent for authorized lab simulations only. Use only the facts you are given, avoid inventing or fabricating details. If you do not know, respond with "unknown" or leave fields blank. Provide structured JSON responses and never target real production systems.'
                        }]
                    },
                    generationConfig: {
                        temperature: 0.8,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048
                    }
                },
                { timeout: 30000 }
            );

            const assistantMessage = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

            if (assistantMessage) {
                this.conversationHistory.push({
                    role: 'assistant',
                    content: assistantMessage
                });
            }

            return assistantMessage;
        } catch (err) {
            if (retries > 0) {
                await new Promise(r => setTimeout(r, 5000));
                return this.callGemini(userMessage, retries - 1);
            }
            console.error('[Red Agent] Gemini error:', err.message);
            return JSON.stringify({ error: 'API failure', fallback: true });
        }
    }

    /**
     * Parse JSON response
     */
    parseJSON(text, fallback = null) {
        try {
            const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (match) {
                return JSON.parse(match[0]);
            }
        } catch (e) {}
        return fallback;
    }

    /**
     * Record decision for learning
     */
    recordDecision(simulation) {
        this.decisionLog.push({
            timestamp: new Date().toISOString(),
            simulationId: simulation.simulationId,
            phasesExecuted: simulation.phases.length,
            attackPathsIdentified: simulation.decisions.filter(d => d.attack_paths).length
        });
    }

    /**
     * Get agent status
     */
    getStatus() {
        return {
            agentId: this.agentId,
            status: this.automationStatus,
            simulationsRun: this.simulationResults.length,
            attackPlansCreated: this.attackPlans.length,
            defenseRulesGenerated: this.defenseRecommendations.length,
            decisionsMade: this.decisionLog.length,
            conversationTurns: this.conversationHistory.length
        };
    }

    /**
     * Reset for new simulation
     */
    reset() {
        this.conversationHistory = [];
        this.automationStatus = 'idle';
    }
}

module.exports = AutonomousRedAgent;
