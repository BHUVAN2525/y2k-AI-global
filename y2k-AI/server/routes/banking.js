const express = require('express');
const router = express.Router();
const banking = require('../services/bankingService');

// Apply auth to all banking routes
// router.use(authenticate); // REMOVED

// GET /api/banking/transactions
router.get('/transactions', (req, res) => {
    res.json(banking.getTransactions());
});

// GET /api/banking/alerts
router.get('/alerts', (req, res) => {
    res.json(banking.getAlerts());
});

// GET /api/banking/metrics
router.get('/metrics', (req, res) => {
    res.json(banking.getRiskMetrics());
});

// POST /api/banking/analyze
router.post('/analyze', async (req, res) => {
    const result = await banking.analyzeTransaction(req.body);
    res.json(result);
});

// GET /api/banking/compliance
router.get('/compliance', (req, res) => {
    res.json(banking.checkPCICompliance());
});

module.exports = router;
