const mongoose = require('mongoose');

const ReconResultSchema = new mongoose.Schema({
    target: { type: String, required: true },
    scan_type: { type: String, enum: ['nmap', 'subdomain', 'banner', 'full'], default: 'full' },
    status: { type: String, enum: ['running', 'complete', 'failed'], default: 'running' },
    open_ports: [{
        port: Number,
        protocol: String,
        service: String,
        version: String,
        banner: String,
        cve_ids: [String],
        risk: { type: String, enum: ['critical', 'high', 'medium', 'low', 'info'] }
    }],
    subdomains: [{ host: String, ip: String, resolved: Boolean }],
    os_guess: { type: String },
    host_info: { type: mongoose.Schema.Types.Mixed },
    cve_summary: [{
        cve_id: String,
        description: String,
        cvss_score: Number,
        severity: String,
        affected_service: String,
        exploit_available: Boolean
    }],
    attack_paths: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AttackPath' }],
    session_id: { type: String },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

ReconResultSchema.index({ target: 1, timestamp: -1 });
module.exports = mongoose.model('ReconResult', ReconResultSchema);
