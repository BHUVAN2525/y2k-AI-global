const express = require('express');
const router = express.Router();
const grc = require('../services/grcService');

// Apply auth to all GRC routes
// router.use(authenticate); // REMOVED

// GET /api/grc/risk-matrix
router.get('/risk-matrix', (req, res) => {
    res.json(grc.getRiskMatrix());
});

// GET /api/grc/compliance/:framework
router.get('/compliance/:framework', (req, res) => {
    res.json(grc.getCompliance(req.params.framework));
});

// GET /api/grc/frameworks
router.get('/frameworks', (req, res) => {
    res.json(grc.getFrameworks());
});

// POST /api/grc/summary
router.post('/summary', async (req, res) => {
    const summary = await grc.generateExecutiveSummary(req.body);
    res.json(summary);
});

// GET /api/grc/report/pdf
router.get('/report/pdf', async (req, res) => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Y2K_Execution_Report.pdf');
    await grc.generatePDFReport(res);
});

module.exports = router;
