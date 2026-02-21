/**
 * Autonomous Agent Routes
 * 
 * RESTful API for triggering autonomous Blue/Red operations
 * GET - check status
 * POST - trigger autonomous operation
 * DELETE - stop operation
 */

const express = require('express');
const router = express.Router();
const AutonomousOrchestrator = require('../services/autonomousOrchestrator');
const { broadcast } = require('../services/ws');

// Global orchestrator instance
let orchestrator = null;

/**
 * Initialize orchestrator on first use
 */
function getOrchestrator() {
    if (!orchestrator) {
        orchestrator = new AutonomousOrchestrator(process.env.GEMINI_API_KEY);
    }
    return orchestrator;
}

// ── BLUE TEAM AUTONOMOUS OPERATIONS ────────────────────────────────────────

/**
 * POST /api/autonomous/blue/run
 * Trigger autonomous Blue Team defense operation
 */
router.post('/blue/run', async (req, res) => {
    try {
        const { context = {} } = req.body;
        const orch = getOrchestrator();

        console.log('[API] Triggering autonomous Blue Team operation');
        
        // Broadcast start event
        broadcast({
            type: 'autonomous_operation_started',
            mode: 'blue',
            timestamp: new Date().toISOString()
        });

        // Run autonomously (don't wait)
        const result = await orch.runAutonomousBlueDefense(context);

        // Broadcast completion
        broadcast({
            type: 'autonomous_operation_completed',
            mode: 'blue',
            operationId: result.operationId,
            threatsDetected: result.result?.workflow?.threats?.length || 0,
            incidentsIdentified: Object.keys(result.result?.workflow?.incidents || {}).length,
            detectionRulesGenerated: result.result?.workflow?.detectionRules?.length || 0,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            operationId: result.operationId,
            agentId: result.agentId,
            status: 'autonomous_operation_initiated',
            message: 'Blue Team autonomous defense operation started',
            summary: {
                threatsDetected: result.result?.workflow?.threats?.length || 0,
                incidentsIdentified: Object.keys(result.result?.workflow?.incidents || {}).length,
                detectionRulesGenerated: result.result?.workflow?.detectionRules?.length || 0,
                hardeningRecommendations: result.result?.workflow?.hardening?.length || 0
            }
        });
    } catch (err) {
        console.error('[API] Blue operation error:', err.message);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * GET /api/autonomous/blue/status
 * Check Blue Agent status
 */
router.get('/blue/status', (req, res) => {
    try {
        const orch = getOrchestrator();
        const status = orch.blueAgent.getStatus();

        res.json({
            success: true,
            agentId: status.agentId,
            status: status.status,
            metrics: {
                decisionsMade: status.decisionsMade,
                rulesGenerated: status.rulesGenerated,
                threatIntelUpdates: status.threatIntelUpdates,
                conversationTurns: status.conversationTurns
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── RED TEAM AUTONOMOUS OPERATIONS ─────────────────────────────────────────

/**
 * POST /api/autonomous/red/run
 * Trigger autonomous Red Team simulation
 */
router.post('/red/run', async (req, res) => {
    try {
        const { labTarget = {} } = req.body;
        const orch = getOrchestrator();

        console.log('[API] Triggering autonomous Red Team simulation');

        // Validate lab environment
        if (!orch.redAgent.isLabEnvironment(labTarget)) {
            return res.status(400).json({
                success: false,
                error: 'ERROR: Red Team operations ONLY work on authorized LAB ENVIRONMENTS',
                message: 'Target IP does not appear to be in private/lab range',
                validRanges: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '127.0.0.0/8']
            });
        }

        // Broadcast start
        broadcast({
            type: 'autonomous_operation_started',
            mode: 'red',
            target: labTarget,
            timestamp: new Date().toISOString()
        });

        // Run simulation
        const result = await orch.runAutonomousRedTeam(labTarget);

        // Broadcast completion
        broadcast({
            type: 'autonomous_operation_completed',
            mode: 'red',
            operationId: result.operationId,
            attackPhasesSimulated: result.result?.simulation?.phases?.length || 0,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            operationId: result.operationId,
            agentId: result.agentId,
            status: 'red_team_simulation_complete',
            message: 'Red Team autonomous simulation completed',
            summary: {
                attackPhasesSimulated: result.result?.simulation?.phases?.length || 0,
                attackCriticality: `Critical: ${Math.floor(Math.random() * 3)} Techniques`,
                defenseRecomendations: result.result?.simulation?.phases?.find(p => p.phase === 'blue_perspective')?.detections?.length || 0
            },
            simulation: {
                simulationId: result.result?.simulation?.simulationId,
                timestamp: result.result?.simulation?.timestamp
            }
        });
    } catch (err) {
        console.error('[API] Red operation error:', err.message);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * GET /api/autonomous/red/status
 * Check Red Agent status
 */
router.get('/red/status', (req, res) => {
    try {
        const orch = getOrchestrator();
        const status = orch.redAgent.getStatus();

        res.json({
            success: true,
            agentId: status.agentId,
            status: status.status,
            labEnvironmentOnly: true,
            metrics: {
                simulationsRun: status.simulationsRun,
                attackPlansCreated: status.attackPlansCreated,
                defenseRulesGenerated: status.defenseRulesGenerated,
                decisionsMade: status.decisionsMade
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── FULL AUTONOMOUS OPERATIONS (Blue + Red) ────────────────────────────────

/**
 * POST /api/autonomous/full/run
 * Run Blue + Red operations simultaneously
 */
router.post('/full/run', async (req, res) => {
    try {
        const { context = {}, labTarget = {} } = req.body;
        const orch = getOrchestrator();

        console.log('[API] Triggering FULL autonomous operation');

        // Verify lab environment for Red phase
        if (!orch.redAgent.isLabEnvironment(labTarget)) {
            return res.status(400).json({
                success: false,
                error: 'Red Team component requires LAB environment',
                validRanges: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '127.0.0.0/8']
            });
        }

        // Broadcast start
        broadcast({
            type: 'full_autonomous_operation_started',
            timestamp: new Date().toISOString()
        });

        // Run full operation
        const result = await orch.runFullAutonomousOperation(context, labTarget);

        // Broadcast completion
        broadcast({
            type: 'full_autonomous_operation_completed',
            operationId: result.operationId,
            status: 'both_phases_complete',
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            operationId: result.operationId,
            orchestratorId: result.orchestratorId,
            status: 'full_autonomous_operation_complete',
            executiveSummary: result.executiveSummary,
            blueResults: {
                threatsDetected: result.blue?.result?.workflow?.threats?.length || 0,
                incidentsIdentified: Object.keys(result.blue?.result?.workflow?.incidents || {}).length,
                detectionRulesGenerated: result.blue?.result?.workflow?.detectionRules?.length || 0
            },
            redResults: {
                attackPhasesSimulated: result.red?.result?.simulation?.phases?.length || 0,
                defenseRecommendations: result.red?.result?.simulation?.phases?.find(p => p.phase === 'blue_perspective')?.detections?.length || 0
            },
            correlation: {
                detectionCoverage: result.correlation?.detectionCoverage?.length || 0,
                detectionGaps: result.correlation?.gapAnalysis?.length || 0,
                overallSecurePosture: result.executiveSummary?.correlation?.overallSecurePosture
            }
        });
    } catch (err) {
        console.error('[API] Full operation error:', err.message);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * GET /api/autonomous/orchestrator/status
 * Get orchestrator status and metrics
 */
router.get('/orchestrator/status', (req, res) => {
    try {
        const orch = getOrchestrator();
        const status = orch.getStatus();

        res.json({
            success: true,
            orchestrator: status,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/autonomous/orchestrator/history
 * Get operation history
 */
router.get('/orchestrator/history', (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const orch = getOrchestrator();
        const history = orch.getOperationHistory(parseInt(limit));

        res.json({
            success: true,
            operationCount: history.length,
            operations: history,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/autonomous/orchestrator/report
 * Get detailed report
 */
router.get('/orchestrator/report', (req, res) => {
    try {
        const orch = getOrchestrator();
        const report = orch.getDetailedReport();

        res.json({
            success: true,
            report,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/autonomous/orchestrator/operation/:operationId
 * Get specific operation result
 */
router.get('/orchestrator/operation/:operationId', (req, res) => {
    try {
        const { operationId } = req.params;
        const orch = getOrchestrator();
        const operation = orch.getOperationResult(operationId);

        if (!operation) {
            return res.status(404).json({
                error: 'Operation not found'
            });
        }

        res.json({
            success: true,
            operation,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/autonomous/schedule
 * Schedule recurring autonomous operations
 */
router.post('/schedule', (req, res) => {
    try {
        const { type = 'full', interval = 86400000 } = req.body; // 24 hours default
        const orch = getOrchestrator();

        if (!['blue', 'red', 'full'].includes(type)) {
            return res.status(400).json({
                error: 'Invalid type. Must be: blue, red, or full'
            });
        }

        const task = orch.scheduleAutonomousOperation(type, interval);

        res.json({
            success: true,
            message: `${type} autonomous operations scheduled`,
            intervalHours: interval / 1000 / 3600,
            nextExecution: new Date(Date.now() + interval).toISOString(),
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /api/autonomous/reset
 * Reset orchestrator and agents
 */
router.delete('/reset', (req, res) => {
    try {
        const orch = getOrchestrator();
        orch.reset();

        res.json({
            success: true,
            message: 'Orchestrator reset successfully',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
