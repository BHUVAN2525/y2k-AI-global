const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'agent'], required: true },
    content: { type: String, required: true },
    tool_calls: [{ type: mongoose.Schema.Types.Mixed }],
    tool_results: [{ type: mongoose.Schema.Types.Mixed }],
    timestamp: { type: Date, default: Date.now }
});

const AgentSessionSchema = new mongoose.Schema({
    session_id: { type: String, required: true, unique: true },
    title: { type: String, default: 'New Investigation' },
    messages: [MessageSchema],
    context: { type: mongoose.Schema.Types.Mixed, default: {} },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { timestamps: true });

// unique: true above already creates an index on session_id
AgentSessionSchema.index({ created_at: -1 });

module.exports = mongoose.model('AgentSession', AgentSessionSchema);
