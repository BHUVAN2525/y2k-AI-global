const mongoose = require('mongoose');

let _connected = false;

const connectDB = async () => {
    try {
        // disable buffering so queries fail fast if down
        mongoose.set('bufferCommands', false);
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cerebus', {
            serverSelectionTimeoutMS: 2000
        });
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
        _connected = true;
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        console.log('⚠️  Running without database - reports will not be persisted');
        _connected = false;
    }
};

connectDB.isConnected = () => _connected;

module.exports = connectDB;
