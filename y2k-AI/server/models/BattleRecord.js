const mongoose = require('mongoose');

const battleRecordSchema = new mongoose.Schema({
    battleId: {
        type: String,
        required: true,
        unique: true
    },
    attacker: {
        type: String, // 'Red Agent'
        required: true
    },
    defender: {
        type: String, // 'Blue Agent'
        required: true
    },
    winner: {
        type: String,
        enum: ['red', 'blue', 'draw'],
        default: 'draw'
    },
    duration: Number, // in seconds
    rounds: [{
        round: Number,
        action: String,
        result: String,
        technique: String,
        severity: String
    }],
    metrics: {
        detectionTime: Number,
        containmentTime: Number,
        impactScore: Number
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('BattleRecord', battleRecordSchema);
