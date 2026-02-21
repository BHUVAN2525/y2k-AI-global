const mongoose = require('mongoose');

const AttackPathSchema = new mongoose.Schema({
    recon_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ReconResult' },
    target: { type: String, required: true },
    session_id: { type: String },
    nodes: [{
        id: String,
        label: String,
        type: { type: String, enum: ['entry', 'pivot', 'target', 'exfil'] },
        service: String,
        ip: String,
        port: Number,
        compromised: { type: Boolean, default: false }
    }],
    edges: [{
        from: String,
        to: String,
        technique: String,        // e.g. "Exploit CVE-2021-44228"
        mitre_id: String,         // e.g. T1190
        success_probability: Number,  // 0-1
        description: String
    }],
    attack_chain: [{
        step: Number,
        action: String,
        technique: String,
        mitre_id: String,
        target_node: String,
        success_probability: Number
    }],
    overall_risk: { type: String, enum: ['critical', 'high', 'medium', 'low'] },
    estimated_time: { type: String },  // e.g. "2-4 hours"
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('AttackPath', AttackPathSchema);
