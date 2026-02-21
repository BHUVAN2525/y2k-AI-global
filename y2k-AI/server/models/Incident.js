const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    severity: { type: String, enum: ['critical', 'high', 'medium', 'low', 'info'], default: 'medium' },
    status: { type: String, enum: ['open', 'investigating', 'contained', 'resolved'], default: 'open' },
    type: { type: String }, // brute_force, malware, anomaly, exfiltration, etc.
    mitre_technique: { type: String },   // e.g. T1110
    mitre_tactic: { type: String },      // e.g. Credential Access
    cvss_score: { type: Number },
    cve_ids: [{ type: String }],
    source_ip: { type: String },
    target: { type: String },
    description: { type: String },
    evidence: [{ type: String }],        // log line IDs or raw snippets
    soar_actions: [{
        action: String,
        timestamp: { type: Date, default: Date.now },
        result: String,
        automated: { type: Boolean, default: false }
    }],
    assignee: { type: String },
    timestamp: { type: Date, default: Date.now },
    resolved_at: { type: Date }
}, { timestamps: true });

IncidentSchema.index({ severity: 1, status: 1, timestamp: -1 });
module.exports = mongoose.model('Incident', IncidentSchema);
