const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model

const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

module.exports = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Fetch the user from the database to get all current user data, including review period dates
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'User not found, authentication failed' });
        }

        // Attach the user object and ensure id is set correctly
        req.user = user;
        req.user.id = user._id;
        // Preserve selected role and team from JWT
        req.user.role = decoded.role;
        req.user.team = decoded.team;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Please authenticate' });
    }
}; 