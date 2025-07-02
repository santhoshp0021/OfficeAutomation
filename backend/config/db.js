const mongoose = require('mongoose');
const path = require('path');

// Load env vars from root .env file
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = async () => {
    try {
        console.log('MONGO_URI:', process.env.MONGO_URI);
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        console.error('Connection String:', process.env.MONGO_URI.replace(/:[^:@]+@/, ':****@')); // Hide password in logs
        process.exit(1);
    }
};

module.exports = connectDB; 