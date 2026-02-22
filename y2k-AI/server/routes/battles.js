const express = require('express');
const router = express.Router();
const BattleRecord = require('../models/BattleRecord');

// GET /api/battles
router.get('/', async (req, res) => {
    try {
        const battles = await BattleRecord.find().sort({ timestamp: -1 }).limit(20);
        res.json(battles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/battles/:id
router.get('/:id', async (req, res) => {
    try {
        const battle = await BattleRecord.findOne({ battleId: req.params.id });
        if (!battle) return res.status(404).json({ error: 'Battle not found' });
        res.json(battle);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
