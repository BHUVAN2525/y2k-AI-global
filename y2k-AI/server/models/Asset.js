const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    hostname: {
        type: String,
        required: true,
        unique: true
    },
    ip: {
        type: String,
        required: true
    },
    os: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['server', 'workstation', 'network_device', 'iot', 'cloud_instance'],
        default: 'server'
    },
    status: {
        type: String,
        enum: ['online', 'offline', 'maintenance'],
        default: 'online'
    },
    vulnerabilities: [{
        cve: String,
        severity: { type: String, enum: ['critical', 'high', 'medium', 'low'] },
        description: String,
        detectedAt: { type: Date, default: Date.now }
    }],
    patchLevel: {
        type: Number,
        min: 0,
        max: 100,
        default: 100
    },
    lastScan: {
        type: Date,
        default: Date.now
    },
    tags: [String]
}, {
    timestamps: true
});

module.exports = mongoose.model('Asset', assetSchema);
