/**
 * Self-Heal Routes — Remediation, patch recommendations, policy generation
 */
const express = require('express');
const router = express.Router();
const selfHealService = require('../services/selfHealService');
const policyGenerator = require('../services/policyGenerator');

// POST /api/selfheal/analyze — analyze threat and get remediation plan
router.post('/analyze', async (req, res) => {
    try {
        const result = await selfHealService.analyzeThreat(req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/selfheal/templates — get remediation templates
router.get('/templates', async (req, res) => {
    try {
        const result = await selfHealService.getTemplates();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/selfheal/execute — execute a remediation step
router.post('/execute', async (req, res) => {
    try {
        const { remediation_id, step_index } = req.body;
        const result = await selfHealService.executeStep(remediation_id, step_index);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/selfheal/history — remediation history
router.get('/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json({ history: selfHealService.getHistory(limit) });
});

// GET /api/selfheal/remediation/:id — specific remediation
router.get('/remediation/:id', (req, res) => {
    const remediation = selfHealService.getRemediation(req.params.id);
    if (!remediation) return res.status(404).json({ error: 'Not found' });
    res.json(remediation);
});

// POST /api/selfheal/patch — CVE patch recommendations
router.post('/patch', async (req, res) => {
    try {
        const result = await selfHealService.getPatchRecommendation(req.body.cve_id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/selfheal/patches — get full patch database
router.get('/patches', async (req, res) => {
    try {
        const result = await selfHealService.getPatchDatabase();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Policy Generation ───────────────────────────────────────────────────

// GET /api/selfheal/policies — list available policy types
router.get('/policies', (req, res) => {
    res.json({ policies: policyGenerator.getAvailablePolicies() });
});

// POST /api/selfheal/policies/generate — generate a specific policy
router.post('/policies/generate', (req, res) => {
    const { policy_type, options = {} } = req.body;
    if (!policy_type) return res.status(400).json({ error: 'policy_type required' });
    const result = policyGenerator.generatePolicy(policy_type, options);
    res.json(result);
});

// GET /api/selfheal/policies/all — generate all policies
router.get('/policies/all', (req, res) => {
    res.json({ policies: policyGenerator.generateAll() });
});

module.exports = router;
