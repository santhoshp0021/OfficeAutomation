// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// Only connect to database if MONGO_URI is provided
if (process.env.MONGO_URI) {
    const connectDB = require('./config/db');
    connectDB();
} else {
    console.log('MONGO_URI not provided, running without database connection');
}

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
}));
app.use(express.json());

// General request logger
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
    next();
});

// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const teamRoutes = require('./routes/team');
const panelRoutes = require('./routes/panel');
const panelAssignmentRoutes = require('./routes/panelAssignment');
const guideRoutes = require('./routes/guide');
const studentRoutes = require('./routes/student');
const documentRoutes = require('./routes/document');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/panels', panelRoutes);
app.use('/api/panel-assignments', panelAssignmentRoutes);
app.use('/api/guide', guideRoutes);
app.use('/api/student', studentRoutes);
app.use('/api', documentRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    // ... existing code ...
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});