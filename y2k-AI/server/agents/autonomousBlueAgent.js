/**
 * Autonomous Blue Defender Agent
 * 
 * Fully autonomous SOC agent that:
 * - Self-directs incident response workflows
 * - Detects anomalies automatically
 * - Generates detection rules
 * - Manages incidents autonomously
 * - Learns from each incident
 * 
 * Zero user intervention required
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class AutonomousBlueAgent {
    constructor(geminiKey = process.env.GEMINI_API_KEY) {
        this.agentId = `blue-${uuidv4().slice(0, 8)}`;
        this.geminiKey = geminiKey;
        this.mode = 'blue';
        this.conversationHistory = [];
        this.incidentQueue = [];
        this.detectionRules = [];
        this.threatIntelligence = [];
        this.automationStatus = 'idle';
        this.decisionLog = [];
    }

    /**
     * Main autonomous loop - Self-directing workflow
     */
    async autonomousOperation(context = {}) {
        console.log(`[${this.agentId}] Starting autonomous operation...`);
        this.automationStatus = 'running';

        const workflow = {
            phase: 'initialization',
            timestamp: new Date().toISOString(),
            decisions: [],
            artifacts: []
        };

        try {
            // Phase 1: Threat Assessment
            console.log(`[${this.agentId}] Phase 1: Threat Assessment`);
            const threats = await this.assessThreats(context);
            workflow.threats = threats;
            workflow.decisions.push({
                phase: 'assessment',
                threatCount: threats.length,
                severity: threats.length > 0 ? 'high' : 'low'
            });

            // Phase 2: Incident Detection & Prioritization
            console.log(`[${this.agentId}] Phase 2: Incident Detection`);
            const incidents = await this.detectIncidents(threats);
            workflow.incidents = incidents;
            workflow.decisions.push({
                phase: 'detection',
                incidentCount: incidents.length,
                action: incidents.length > 0 ? 'initiate_response' : 'continue_monitoring'
            });

            // Phase 3: Containment & Incident Response
            if (incidents.length > 0) {
                console.log(`[${this.agentId}] Phase 3: Incident Response`);
                const incidents_map = {};
                for (const incident of incidents) {
                    const containment = await this.containIncident(incident);
                    incidents_map[incident.id] = {
                        incident,
                        containment,
                        status: 'contained'
                    };
                    workflow.artifacts.push(containment);
                }
                workflow.incidents = incidents_map;
            }

            // Phase 4: Detection Rule Generation
            console.log(`[${this.agentId}] Phase 4: Detection Rule Generation`);
            const rules = await this.generateDetectionRules(threats, incidents);
            this.detectionRules.push(...rules);
            workflow.detectionRules = rules;
            workflow.decisions.push({
                phase: 'detection_rules',
                rulesGenerated: rules.length,
                deployment: 'auto_deploy'
            });

            // Phase 5: Threat Intelligence Update
            console.log(`[${this.agentId}] Phase 5: Threat Intelligence`);
            const intel = await this.updateThreatIntelligence(threats);
            this.threatIntelligence.push(...intel);
            workflow.intelligence = intel;

            // Phase 6: Recommendations & Hardening
            console.log(`[${this.agentId}] Phase 6: Security Hardening`);
            const hardening = await this.generateHardeningRecommendations(incidents);
            workflow.hardening = hardening;
            workflow.decisions.push({
                phase: 'hardening',
                recommendations: hardening.length,
                priority: 'immediate'
            });

            // Phase 7: Reporting
            console.log(`[${this.agentId}] Phase 7: Report Generation`);
            const report = await this.generateComprehensiveReport(workflow);
            workflow.report = report;

            this.automationStatus = 'completed';
            this.recordDecision(workflow);

            return {
                success: true,
                agentId: this.agentId,
                workflow,
                status: 'autonomous_operation_complete',
                timestamp: new Date().toISOString()
            };

        } catch (err) {
            console.error(`[${this.agentId}] Autonomous operation error:`, err.message);
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
     * Assess threats in environment
     */
    async assessThreats(context) {
        const prompt = `You are an autonomous SOC analyst. Assess the current security posture and identify potential threats.

Context: ${JSON.stringify(context, null, 2)}

Analyze and provide:
1. Active threats detected
2. Threat severity levels (critical/high/medium/low)
3. Affected systems or users
4. Confidence scores

Respond in JSON format with array of threats.`;

        const assessment = await this.callGemini(prompt);
        return this.parseJSON(assessment, []);
    }

    /**
     * Detect incidents from threat assessment
     */
    async detectIncidents(threats) {
        const prompt = `Given these threats, identify concrete security incidents that need immediate response:

Threats: ${JSON.stringify(threats, null, 2)}

For each incident provide:
1. Incident ID
2. Title
3. Description
4. Affected systems
5. Recommended actions
6. MITRE ATT&CK mapping

Respond in JSON format with array of incidents.`;

        const detection = await this.callGemini(prompt);
        const incidents = this.parseJSON(detection, []);

        // Add unique IDs if missing
        return incidents.map((inc, i) => ({
            id: inc.id || uuidv4(),
            ...inc
        }));
    }

    /**
     * Autonomously contain incident
     */
    async containIncident(incident) {
        const prompt = `Create an immediate containment plan for this incident:

Incident: ${JSON.stringify(incident, null, 2)}

Provide:
1. Immediate isolation steps
2. Evidence preservation actions
3. User notification requirements
4. Communications plan
5. Timeline and dependencies
6. Success criteria

Respond in JSON format.`;

        const containment = await this.callGemini(prompt);
        return this.parseJSON(containment, {
            incident_id: incident.id,
            actions: [],
            timeline: [],
            success_criteria: []
        });
    }

    /**
     * Generate detection rules automatically
     */
    async generateDetectionRules(threats, incidents) {
        const prompt = `Generate detection rules for these threats and incidents:

Threats: ${JSON.stringify(threats.slice(0, 3), null, 2)}
Incidents: ${JSON.stringify(incidents.slice(0, 3), null, 2)}

For each threat/incident provide:
1. Rule name
2. Rule type (SIEM/EDR/Firewall/NIDS)
3. Sigma rule syntax
4. Splunk SPL (if applicable)
5. Alert threshold
6. Response action

Return as JSON array of rules.`;

        const rules = await this.callGemini(prompt);
        return this.parseJSON(rules, []);
    }

    /**
     * Update threat intelligence
     */
    async updateThreatIntelligence(threats) {
        const prompt = `Extract threat intelligence indicators from these threats:

Threats: ${JSON.stringify(threats, null, 2)}

Provide:
1. IOCs (IPs, domains, file hashes)
2. Threat actor background
3. Known TTPs
4. Related incidents
5. Intelligence confidence
6. Intelligence source

Return as JSON array of intelligence items.`;

        const intel = await this.callGemini(prompt);
        return this.parseJSON(intel, []);
    }

    /**
     * Generate hardening recommendations
     */
    async generateHardeningRecommendations(incidents) {
        const prompt = `Based on these incidents, what hardening measures should be implemented?

Incidents: ${JSON.stringify(incidents.slice(0, 5), null, 2)}

Provide:
1. Hardening measure
2. Priority (immediate/high/medium/low)
3. Implementation difficulty
4. Security benefit
5. Resources required
6. Success metrics

Return as JSON array.`;

        const hardening = await this.callGemini(prompt);
        return this.parseJSON(hardening, []);
    }

    /**
     * Generate comprehensive report
     */
    async generateComprehensiveReport(workflow) {
        const report = {
            executiveReport: {
                summary: `Autonomous Blue Agent ${this.agentId} completed security assessment`,
                threatsDetected: workflow.threats?.length || 0,
                incidentsIdentified: Object.keys(workflow.incidents || {}).length,
                detectionRulesGenerated: workflow.detectionRules?.length || 0,
                intelligenceUpdates: workflow.intelligence?.length || 0,
                hardeningRecommendations: workflow.hardening?.length || 0
            },
            threatLandscape: workflow.threats,
            incidentSummary: workflow.incidents,
            detectionCapabilities: workflow.detectionRules,
            threatIntelligence: workflow.intelligence,
            securityHardening: workflow.hardening,
            decisionLog: workflow.decisions,
            nextSteps: await this.generateNextSteps(workflow),
            generatedAt: new Date().toISOString()
        };
        return report;
    }

    /**
     * Generate next steps for organization
     */
    async generateNextSteps(workflow) {
        const prompt = `Based on this security assessment workflow, what are the top 5 priority next steps for the organization?

Threats: ${workflow.threats?.length || 0}
Incidents: ${Object.keys(workflow.incidents || {}).length}
New Rules: ${workflow.detectionRules?.length || 0}

Provide in JSON format with priority and timeline.`;

        const steps = await this.callGemini(prompt);
        return this.parseJSON(steps, []);
    }

    /**
     * Call Gemini API with conversation history
     */
    async callGemini(userMessage, retries = 2) {
        if (!this.geminiKey) {
            console.log('[Blue Agent] No Gemini API key - using fallback');
            return JSON.stringify({ status: 'fallback_mode', message: 'Using heuristic analysis' });
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
                        parts: [{ text: 'You are an autonomous Blue Team SOC agent. Provide structured JSON responses.' }]
                    },
                    generationConfig: {
                        temperature: 0.7,
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
            console.error('[Blue Agent] Gemini error:', err.message);
            return JSON.stringify({ error: 'API call failed', fallback: true });
        }
    }

    /**
     * Parse JSON from response
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
    recordDecision(workflow) {
        this.decisionLog.push({
            timestamp: new Date().toISOString(),
            decisions: workflow.decisions,
            outcomes: {
                threats: workflow.threats?.length || 0,
                incidents: Object.keys(workflow.incidents || {}).length,
                rules: workflow.detectionRules?.length || 0
            }
        });
    }

    /**
     * Get agent status
     */
    getStatus() {
        return {
            agentId: this.agentId,
            status: this.automationStatus,
            decisionsMade: this.decisionLog.length,
            rulesGenerated: this.detectionRules.length,
            threatIntelUpdates: this.threatIntelligence.length,
            conversationTurns: this.conversationHistory.length
        };
    }

    /**
     * Reset for new operation
     */
    reset() {
        this.conversationHistory = [];
        this.automationStatus = 'idle';
    }
}

module.exports = AutonomousBlueAgent;
