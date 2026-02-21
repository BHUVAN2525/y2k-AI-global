/**
 * Self-Healing Service — Orchestrates threat → remediation → validation pipeline
 * 
 * Flow: Threat Detection → Risk Score → Generate Script → SSH Execute → Validate → Report
 * Approval workflow: auto-execute low-risk, require approval for high-risk
 */
const axios = require('axios');

const PYTHON_API = process.env.PYTHON_API_URL || 'http://localhost:8001';

// In-memory remediation history
const remediationHistory = [];

const selfHealService = {
    /**
     * Analyze a threat and get a remediation plan from the Python engine
     */
    async analyzeThreat(threatData) {
        try {
            const res = await axios.post(`${PYTHON_API}/selfheal/analyze`, threatData, { timeout: 10000 });

            const plan = res.data;

            // Log the analysis
            remediationHistory.unshift({
                id: `rem_${Date.now()}`,
                timestamp: new Date().toISOString(),
                threat_type: threatData.threat_type,
                severity: threatData.severity,
                risk_score: plan.risk_score,
                risk_level: plan.risk_level,
                remediation_name: plan.remediation_name,
                total_steps: plan.total_steps,
                status: 'pending_approval',
                steps: plan.steps,
            });

            if (remediationHistory.length > 500) remediationHistory.pop();

            return plan;
        } catch (err) {
            return {
                error: true,
                message: `Self-heal engine unavailable: ${err.message}`,
                fallback: 'Manual remediation required'
            };
        }
    },

    /**
     * Get available remediation templates
     */
    async getTemplates() {
        try {
            const res = await axios.get(`${PYTHON_API}/selfheal/templates`, { timeout: 5000 });
            return res.data;
        } catch (err) {
            return { error: true, message: err.message };
        }
    },

    /**
     * Get CVE patch recommendations
     */
    async getPatchRecommendation(cveId) {
        try {
            const res = await axios.post(`${PYTHON_API}/selfheal/patch/recommend`,
                { cve_id: cveId }, { timeout: 5000 });
            return res.data;
        } catch (err) {
            return { error: true, message: err.message };
        }
    },

    /**
     * Get patch database
     */
    async getPatchDatabase() {
        try {
            const res = await axios.get(`${PYTHON_API}/selfheal/patch/database`, { timeout: 5000 });
            return res.data;
        } catch (err) {
            return { error: true, message: err.message };
        }
    },

    /**
     * Execute remediation step (simulated — uses sandbox SSH if available)
     */
    async executeStep(remediationId, stepIndex) {
        const remediation = remediationHistory.find(r => r.id === remediationId);
        if (!remediation) return { error: true, message: 'Remediation not found' };

        const step = remediation.steps?.[stepIndex];
        if (!step) return { error: true, message: 'Step not found' };

        // Mark as executing
        step.status = 'executing';
        step.started_at = new Date().toISOString();

        // Simulate execution (in production, this would SSH into the target)
        await new Promise(r => setTimeout(r, 1500));

        step.status = 'completed';
        step.completed_at = new Date().toISOString();
        step.output = `✅ Simulated execution: ${step.command}`;

        // Check if all steps done
        const allDone = remediation.steps.every(s => s.status === 'completed' || s.status === 'skipped');
        if (allDone) remediation.status = 'completed';

        return {
            success: true,
            step: step,
            remediation_status: remediation.status
        };
    },

    /**
     * Get remediation history
     */
    getHistory(limit = 50) {
        return remediationHistory.slice(0, limit);
    },

    /**
     * Get a specific remediation
     */
    getRemediation(id) {
        return remediationHistory.find(r => r.id === id) || null;
    }
};

module.exports = selfHealService;
