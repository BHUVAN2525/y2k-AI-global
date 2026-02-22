const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    operator: { type: String, default: 'Internal Agent' },
    mode: { type: String, enum: ['blue', 'red'], required: true },
    tool: { type: String, required: true },
    command: { type: String },
    target: { type: String }, // e.g., session ID or IP
    status: { type: String, enum: ['success', 'blocked', 'failed'], required: true },
    error: { type: String },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

AuditLogSchema.index({ timestamp: -1, tool: 1, status: 1 });
module.exports = mongoose.model('AuditLog', AuditLogSchema);
