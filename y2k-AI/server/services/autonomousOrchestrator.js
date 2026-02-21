/**
 * Autonomous Agent Orchestrator
 * 
 * Manages both Blue and Red autonomous agents
 * - Schedules autonomous operations
 * - Coordinates workflows
 * - Stores results
 * - Generates reports
 * - Provides monitoring dashboard
 */

const AutonomousBlueAgent = require('../agents/autonomousBlueAgent');
const AutonomousRedAgent = require('../agents/autonomousRedAgent');
const { v4: uuidv4 } = require('uuid');

class AutonomousOrchestrator {
    constructor(geminiKey = process.env.GEMINI_API_KEY) {
        this.orchestratorId = `orchestrator-${uuidv4().slice(0, 8)}`;
        this.blueAgent = new AutonomousBlueAgent(geminiKey);
        this.redAgent = new AutonomousRedAgent(geminiKey);
        this.operationQueue = [];
        this.operationHistory = [];
        this.orchestrationStatus = 'ready';
        this.runningOperations = {};
        this.geminiKey = geminiKey;
    }

    /**
     * Run complete autonomous Blue Team operation
     */
    async runAutonomousBlueDefense(context = {}) {
        const operationId = uuidv4();
        
        console.log(`[ORCHESTRATOR] Starting Blue Team autonomous operation: ${operationId}`);
        
        try {
            this.orchestrationStatus = 'blue_running';
            this.runningOperations[operationId] = {
                type: 'blue',
                startTime: new Date(),
                status: 'in_progress'
            };

            // Execute autonomous Blue Agent
            const result = await this.blueAgent.autonomousOperation(context);

            this.runningOperations[operationId].status = 'completed';
            this.runningOperations[operationId].endTime = new Date();
            this.runningOperations[operationId].result = result;

            // Record in history
            this.operationHistory.push({
                operationId,
                type: 'blue',
                timestamp: new Date().toISOString(),
                duration: this.runningOperations[operationId].endTime - this.runningOperations[operationId].startTime,
                status: 'completed',
                result
            });

            this.orchestrationStatus = 'ready';

            return {
                success: true,
                operationId,
                orchestratorId: this.orchestratorId,
                agentId: this.blueAgent.agentId,
                result
            };
        } catch (err) {
            this.runningOperations[operationId].status = 'failed';
            this.runningOperations[operationId].error = err.message;
            this.orchestrationStatus = 'ready';

            return {
                success: false,
                operationId,
                error: err.message
            };
        }
    }

    /**
     * Run complete autonomous Red Team simulation
     */
    async runAutonomousRedTeam(labTarget = {}) {
        const operationId = uuidv4();
        
        console.log(`[ORCHESTRATOR] Starting Red Team autonomous simulation: ${operationId}`);
        
        try {
            this.orchestrationStatus = 'red_running';
            this.runningOperations[operationId] = {
                type: 'red',
                startTime: new Date(),
                status: 'in_progress',
                target: labTarget
            };

            // Execute autonomous Red Agent
            const result = await this.redAgent.autonomousAttackSimulation(labTarget);

            // Verify it's actually on lab environment
            if (!result.success && result.error?.includes('LAB')) {
                this.runningOperations[operationId].status = 'rejected';
                this.orchestrationStatus = 'ready';

                return {
                    success: false,
                    operationId,
                    reason: 'Not a lab environment',
                    message: result.error
                };
            }

            this.runningOperations[operationId].status = 'completed';
            this.runningOperations[operationId].endTime = new Date();
            this.runningOperations[operationId].result = result;

            // Record in history
            this.operationHistory.push({
                operationId,
                type: 'red',
                timestamp: new Date().toISOString(),
                duration: this.runningOperations[operationId].endTime - this.runningOperations[operationId].startTime,
                status: 'completed',
                target: labTarget,
                result
            });

            this.orchestrationStatus = 'ready';

            return {
                success: true,
                operationId,
                orchestratorId: this.orchestratorId,
                agentId: this.redAgent.agentId,
                result
            };
        } catch (err) {
            this.runningOperations[operationId].status = 'failed';
            this.runningOperations[operationId].error = err.message;
            this.orchestrationStatus = 'ready';

            return {
                success: false,
                operationId,
                error: err.message
            };
        }
    }

    /**
     * Run both Blue and Red autonomously in parallel
     */
    async runFullAutonomousOperation(context = {}, labTarget = {}) {
        console.log(`[ORCHESTRATOR] Starting FULL autonomous operation - Blue + Red`);

        const operationId = uuidv4();
        
        try {
            this.orchestrationStatus = 'full_operation';

            // Run both simultaneously
            const [blueResult, redResult] = await Promise.all([
                this.runAutonomousBlueDefense(context),
                this.runAutonomousRedTeam(labTarget)
            ]);

            // Correlate results
            const correlation = this.correlateResults(blueResult, redResult);

            this.operationHistory.push({
                operationId,
                type: 'full_operation',
                timestamp: new Date().toISOString(),
                status: 'completed',
                blue: blueResult,
                red: redResult,
                correlation
            });

            this.orchestrationStatus = 'ready';

            return {
                success: true,
                operationId,
                orchestratorId: this.orchestratorId,
                blue: blueResult,
                red: redResult,
                correlation,
                executiveSummary: this.generateExecutiveSummary(blueResult, redResult, correlation)
            };
        } catch (err) {
            this.orchestrationStatus = 'ready';

            return {
                success: false,
                operationId,
                error: err.message
            };
        }
    }

    /**
     * Correlate Blue and Red results
     */
    correlateResults(blueResult, redResult) {
        const correlation = {
            detectionCoverage: [],
            gapAnalysis: [],
            recommendations: [],
            timestamp: new Date().toISOString()
        };

        // Get Blue detected threats
        const blueThreats = blueResult?.result?.workflow?.threats || [];
        
        // Get Red attack paths
        const redPhases = redResult?.result?.simulation?.phases || [];

        // Correlate
        blueThreats.forEach(threat => {
            const relatedPhases = redPhases.filter(phase => 
                phase.mitre_mapping?.some(m => threat.title?.includes(m))
            );
            
            if (relatedPhases.length > 0) {
                correlation.detectionCoverage.push({
                    threat: threat.title,
                    detectedBy: 'Blue Agent',
                    correlatedWith: relatedPhases.map(p => p.phase),
                    coverage: 'detected'
                });
            } else {
                correlation.gapAnalysis.push({
                    threat: threat.title,
                    coverageGap: 'Not detected in Red Team exercise',
                    priority: 'high',
                    action: 'Implement detection rule'
                });
            }
        });

        return correlation;
    }

    /**
     * Generate executive summary
     */
    generateExecutiveSummary(blueResult, redResult, correlation) {
        return {
            title: 'Autonomous Security Operations Summary',
            timestamp: new Date().toISOString(),
            blueDefense: {
                status: blueResult?.success ? 'completed' : 'failed',
                threatsDetected: blueResult?.result?.workflow?.threats?.length || 0,
                incidentsIdentified: Object.keys(blueResult?.result?.workflow?.incidents || {}).length,
                detectionRulesGenerated: blueResult?.result?.workflow?.detectionRules?.length || 0
            },
            redTeam: {
                status: redResult?.success ? 'completed' : (redResult?.reason || 'failed'),
                attackPathsPlanned: redResult?.result?.simulation?.phases?.length || 0,
                defenseRecommendations: redResult?.result?.simulation?.phases?.find(p => p.phase === 'blue_perspective')?.detections?.length || 0
            },
            correlation: {
                detectionCoverage: correlation?.detectionCoverage?.length || 0,
                detectionGaps: correlation?.gapAnalysis?.length || 0,
                overallSecurePosture: this.assessSecurePosture(correlation)
            },
            nextActionsRecommended: [
                'Review detection gaps identified in correlation analysis',
                'Deploy new detection rules generated by Blue Agent',
                'Schedule security hardening based on Red Team findings',
                'Plan follow-up autonomous exercises in 30 days'
            ]
        };
    }

    /**
     * Assess overall security posture
     */
    assessSecurePosture(correlation) {
        const gaps = correlation?.gapAnalysis?.length || 0;
        const coverage = correlation?.detectionCoverage?.length || 0;
        const total = gaps + coverage;

        if (total === 0) return 'unknown';
        
        const percentage = (coverage / total) * 100;
        
        if (percentage >= 90) return 'strong';
        if (percentage >= 70) return 'adequate';
        if (percentage >= 50) return 'needs_improvement';
        return 'critical_gaps';
    }

    /**
     * Schedule autonomous operations
     */
    scheduleAutonomousOperation(type = 'blue', interval = 86400000) { // 24 hours default
        console.log(`[ORCHESTRATOR] Scheduling ${type} autonomous operation every ${interval / 1000 / 3600} hours`);

        const scheduledTask = setInterval(async () => {
            console.log(`[ORCHESTRATOR] Running scheduled ${type} operation`);
            
            if (type === 'blue') {
                await this.runAutonomousBlueDefense();
            } else if (type === 'red') {
                await this.runAutonomousRedTeam();
            } else if (type === 'full') {
                await this.runFullAutonomousOperation();
            }
        }, interval);

        return scheduledTask;
    }

    /**
     * Get orchestrator status and metrics
     */
    getStatus() {
        const blueStatus = this.blueAgent.getStatus();
        const redStatus = this.redAgent.getStatus();

        return {
            orchestratorId: this.orchestratorId,
            status: this.orchestrationStatus,
            timestamp: new Date().toISOString(),
            operationsExecuted: this.operationHistory.length,
            successfulOperations: this.operationHistory.filter(op => op.status === 'completed').length,
            failedOperations: this.operationHistory.filter(op => op.status === 'failed').length,
            blueAgent: blueStatus,
            redAgent: redStatus,
            runningOperations: Object.keys(this.runningOperations).length,
            detectionRulesGenerated: blueStatus.rulesGenerated,
            attackPlansSimulated: redStatus.simulationsRun,
            correlationAnalyses: this.operationHistory.filter(op => op.type === 'full_operation').length
        };
    }

    /**
     * Get operation history
     */
    getOperationHistory(limit = 10) {
        return this.operationHistory.slice(-limit).map(op => ({
            operationId: op.operationId,
            type: op.type,
            timestamp: op.timestamp,
            status: op.status,
            duration: op.duration
        }));
    }

    /**
     * Get detailed report
     */
    getDetailedReport() {
        return {
            orchestratorId: this.orchestratorId,
            status: this.getStatus(),
            operationHistory: this.getOperationHistory(50),
            blueAgentStats: this.blueAgent.getStatus(),
            redAgentStats: this.redAgent.getStatus(),
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Reset orchestrator
     */
    reset() {
        this.blueAgent.reset();
        this.redAgent.reset();
        this.runningOperations = {};
        this.orchestrationStatus = 'ready';
    }

    /**
     * Get operation result
     */
    getOperationResult(operationId) {
        return this.operationHistory.find(op => op.operationId === operationId);
    }
}

module.exports = AutonomousOrchestrator;
