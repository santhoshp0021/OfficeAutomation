// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
}));
app.use(express.json());

// Test PDF route without database dependency
const pdfRoutes = require('./routes/pdf');
app.use('/api/generate-pdf', pdfRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'PDF Server is running' });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`PDF Server running on port ${PORT}`);
});

module.exports = app;
