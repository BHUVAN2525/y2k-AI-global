const mongoose = require('mongoose');

const LogEntrySchema = new mongoose.Schema({
    source: { type: String, enum: ['syslog', 'windows', 'linux', 'custom', 'agent'], default: 'custom' },
    level: { type: String, enum: ['debug', 'info', 'warning', 'error', 'critical'], default: 'info' },
    message: { type: String, required: true },
    raw: { type: String },
    host: { type: String },
    ip: { type: String },
    user: { type: String },
    process: { type: String },
    event_id: { type: String },
    // Threat analysis results
    threat_score: { type: Number, default: 0 },   // 0-100
    threat_flags: [{ type: String }],              // ['brute_force', 'malware', 'exfil']
    mitre_technique: { type: String },
    anomaly_score: { type: Number },               // Isolation Forest output
    incident_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

LogEntrySchema.index({ timestamp: -1, threat_score: -1, host: 1 });
module.exports = mongoose.model('LogEntry', LogEntrySchema);
