const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

exports.login = async (req, res) => {
    try {
        const { username, password, role } = req.body; // Accept role from frontend
        console.log('Login attempt:', { username, role }); // Debug log

        // Find user by username only
        const user = await User.findOne({ username });
        console.log('User found:', user ? 'Yes' : 'No'); // Debug log
        
        if (!user) {
            console.log('Login failed: User not found'); // Debug log
            return res.status(401).json({ 
                message: 'Invalid credentials' 
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch ? 'Yes' : 'No'); // Debug log
        
        if (!isMatch) {
            console.log('Login failed: Invalid password'); // Debug log
            return res.status(401).json({ 
                message: 'Invalid credentials' 
            });
        }

        // If no role is provided, allow faculty login if user has at least one faculty role
        if (!role) {
            const facultyRoles = user.roles.filter(r => ['guide', 'panel', 'coordinator'].includes(r.role));
            if (facultyRoles.length > 0) {
                // Create a token with no specific role/team
                const token = jwt.sign(
                    {
                        id: user._id,
                        username: user.username,
                        role: null,
                        team: null
                    },
                    JWT_SECRET,
                    { expiresIn: '1d' }
                );
                return res.json({
                    token,
                    user: {
                        id: user._id,
                        username: user.username,
                        name: user.name,
                        role: null,
                        team: null,
                        memberType: user.memberType || null,
                        roles: user.roles
                    }
                });
            }
        }
        // Find the selected role in the user's roles array
        const selectedRoleObj = user.roles.find(r => r.role === role);
        if (!selectedRoleObj) {
            return res.status(403).json({ message: 'You do not have the selected role.' });
        }

        // Create token (store selected role and team in token)
        const token = jwt.sign(
            { 
                id: user._id, 
                username: user.username,
                role: selectedRoleObj.role,
                team: selectedRoleObj.team || null
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        console.log('Login successful for user:', username, 'as', role); // Debug log
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                role: selectedRoleObj.role,
                team: selectedRoleObj.team || null,
                memberType: user.memberType || null,
                roles: user.roles // Return all roles for role switching
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Server error during login' 
        });
    }
};

exports.registerPanel = async (req, res) => {
    try {
        const { username, password, memberType } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new panel user
        const user = new User({
            username,
            password: hashedPassword,
            role: 'panel',
            memberType: memberType || null
        });

        await user.save();

        res.status(201).json({ message: 'Panel member created successfully!' });
    } catch (error) {
        console.error('Error registering panel member:', error);
        res.status(500).json({ message: 'Server error during panel member registration' });
    }
};

// Get faculty (guide and panel members)
exports.getFaculty = async (req, res) => {
    try {
        const faculty = await User.find({
            role: { $in: ['guide', 'panel'] }
        }).select('username role memberType name');

        res.json(faculty);
    } catch (error) {
        console.error('Error fetching faculty:', error);
        res.status(500).json({ message: 'Server error fetching faculty' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        // req.user is populated by the auth middleware
        const user = await User.findById(req.user.id).select('-password'); // Exclude password

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Exclude password
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
}; 