const mongoose = require('mongoose');

const ScanSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    file_size: Number,
    file_category: String,
    hashes: {
        md5: String,
        sha1: String,
        sha256: String
    },
    is_malware: { type: Boolean, default: false },
    confidence: { type: Number, default: 0 },
    risk_score: { type: Number, default: 0 },
    malware_type: { type: String, default: 'Unknown' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    virustotal: { type: mongoose.Schema.Types.Mixed },
    explanation: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for fast queries
ScanSchema.index({ timestamp: -1 });
ScanSchema.index({ is_malware: 1 });
ScanSchema.index({ malware_type: 1 });
ScanSchema.index({ 'hashes.sha256': 1 });

module.exports = mongoose.model('Scan', ScanSchema);
