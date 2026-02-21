const express = require('express');
const Scan = require('../models/Scan');

const router = express.Router();

// GET /api/reports — list all scans with filters
router.get('/', async (req, res) => {
    const { page = 1, limit = 20, is_malware, malware_type, search, from, to } = req.query;
    const filter = {};

    if (is_malware !== undefined) filter.is_malware = is_malware === 'true';
    if (malware_type && malware_type !== 'all') filter.malware_type = malware_type;
    if (search) filter.filename = { $regex: search, $options: 'i' };
    if (from || to) {
        filter.timestamp = {};
        if (from) filter.timestamp.$gte = new Date(from);
        if (to) filter.timestamp.$lte = new Date(to);
    }

    try {
        const [scans, total] = await Promise.all([
            Scan.find(filter)
                .sort({ timestamp: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .lean(),
            Scan.countDocuments(filter)
        ]);
        res.json({ scans, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reports/:id — single scan
router.get('/:id', async (req, res) => {
    try {
        const scan = await Scan.findById(req.params.id).lean();
        if (!scan) return res.status(404).json({ error: 'Report not found' });
        res.json(scan);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/reports/:id
router.delete('/:id', async (req, res) => {
    try {
        await Scan.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reports/stats/overview — dashboard stats
router.get('/stats/overview', async (req, res) => {
    try {
        const [total, malware, byType, byDay] = await Promise.all([
            Scan.countDocuments(),
            Scan.countDocuments({ is_malware: true }),
            Scan.aggregate([
                { $match: { is_malware: true } },
                { $group: { _id: '$malware_type', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Scan.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                        total: { $sum: 1 },
                        malware: { $sum: { $cond: ['$is_malware', 1, 0] } }
                    }
                },
                { $sort: { _id: -1 } },
                { $limit: 30 }
            ])
        ]);

        res.json({
            total_scans: total,
            malware_detected: malware,
            clean_files: total - malware,
            detection_rate: total > 0 ? ((malware / total) * 100).toFixed(1) : 0,
            by_type: byType,
            by_day: byDay.reverse()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
