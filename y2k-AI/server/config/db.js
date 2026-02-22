const mongoose = require('mongoose');

let _connected = false;
let currentUri = process.env.MONGO_URI || 'mongodb://localhost:27017/cerebus';

const connectDB = async (uri = currentUri) => {
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }

        // disable buffering so queries fail fast if down
        mongoose.set('bufferCommands', false);
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 2000
        });
        currentUri = uri;
        console.log(`✅ MongoDB connected: ${conn.connection.host} (${uri})`);
        _connected = true;
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        console.log('⚠️  Running without database - reports will not be persisted');
        _connected = false;
    }
};

connectDB.isConnected = () => _connected;
connectDB.switchConnection = async (newUri) => {
    console.log(`[DB] Switching connection to: ${newUri}`);
    await connectDB(newUri);
};

module.exports = connectDB;
