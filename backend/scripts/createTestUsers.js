const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const connectDB = require('../config/db');
require('dotenv').config();

const testUsers = [
    {
        username: 'admin',
        name: 'admin',
        password: 'admin123',
        roles: [{ role: 'admin', team: null }]
    },
    // Students
    {
        username: 'student1',
        name: 'student1',
        password: 'student123',
        roles: [{ role: 'student', team: 'TEAM1' }]
    },
    {
        username: 'student2',
        name: 'student2',
        password: 'student123',
        roles: [{ role: 'student', team: 'TEAM1' }]
    },
    {
        username: 'student3',
        name: 'student3',
        password: 'student123',
        roles: [{ role: 'student', team: 'TEAM1' }]
    },
    {
        username: 'student4',
        name: 'student4',
        password: 'student123',
        roles: [{ role: 'student', team: 'TEAM1' }]
    },
    {
        username: 'student5',
        name: 'student5',
        password: 'student123',
        roles: [{ role: 'student', team: 'TEAM1' }]
    },
    {
        username: 'student6',
        name: 'student6',
        password: 'student123',
        roles: [{ role: 'student', team: 'TEAM1' }]
    },
    {
        username: 'student7',
        name: 'student7',
        password: 'student123',
        roles: [{ role: 'student', team: 'TEAM1' }]
    },
    {
        username: 'student8',
        name: 'student8',
        password: 'student123',
        roles: [{ role: 'student', team: 'TEAM1' }]
    },
    {
        username: 'student9',
        name: 'student9',
        password: 'student123',
        roles: [{ role: 'student', team: 'TEAM1' }]
    },
    {
        username: 'student10',
        name: 'student10',
        password: 'student123',
        roles: [{ role: 'student', team: 'TEAM1' }]
    },
    {
        username: 'student11',
        name: 'student11',
        password: 'student123',
        roles: [{ role: 'student', team: 'TEAM1' }]
    },
    {
        username: 'student12',
        name: 'student12',
        password: 'student123',
        roles: [{ role: 'student', team: 'TEAM1' }]
    },
    {
        username: 'student13',
        name: 'student13',
        password: 'student123',
        roles: [{ role: 'student', team: 'TEAM1' }]
    },
    {
        username: 'student14',
        name: 'student14',
        password: 'student123',
        roles: [{ role: 'student', team: 'TEAM1' }]
    },
    {
        username: 'student15',
        name: 'student15',
        password: 'student123',
        roles: [{ role: 'student', team: 'TEAM1' }]
    },
    {
        username: 'student16',
        name: 'student16',
        password: 'student123',
        roles: [{ role: 'student', team: 'TEAM1' }]
    },
    {
        username: 'student17',
        name: 'student17',
        password: 'student123',
        roles: [{ role: 'student', team: 'TEAM1' }]
    },
    // Guides
    {
        username: 'guide1',
        name: 'guide1',
        password: 'guide123',
        roles: [
            { role: 'guide', team: 'TEAM1' },
            { role: 'panel', team: 'TEAM2' },
            { role: 'coordinator', team: null }
        ]
    },
    {
        username: 'guide2',
        name: 'guide2',
        password: 'guide123',
        roles: [
            { role: 'guide', team: 'TEAM1' },
            { role: 'panel', team: 'TEAM2' },
            { role: 'coordinator', team: null }
        ]
    },
    // Panel Members
    {
        username: 'panel1',
        name: 'panel1',
        password: 'panel123',
        roles: [
            { role: 'panel', team: 'TEAM1', memberType: 'internal' },
            { role: 'panel', team: 'TEAM2', memberType: 'external' }
        ]
    },
    {
        username: 'panel2',
        name: 'panel2',
        password: 'panel123',
        roles: [
            { role: 'panel', team: 'TEAM1', memberType: 'internal' },
            { role: 'panel', team: 'TEAM2', memberType: 'external' }
        ]
    },
    {
        username: 'panel3',
        name: 'panel3',
        password: 'panel123',
        roles: [
            { role: 'panel', team: 'TEAM1', memberType: 'internal' },
            { role: 'panel', team: 'TEAM2', memberType: 'external' }
        ]
    },
    {
        username: 'panel4',
        name: 'panel4',
        password: 'panel123',
        roles: [
            { role: 'panel', team: 'TEAM1', memberType: 'internal' },
            { role: 'panel', team: 'TEAM2', memberType: 'external' }
        ]
    },
    {
        username: 'panel5',
        name: 'panel5',
        password: 'panel123',
        roles: [
            { role: 'panel', team: 'TEAM1', memberType: 'internal' },
            { role: 'panel', team: 'TEAM2', memberType: 'external' }
        ]
    },
    {
        username: 'panel6',
        name: 'panel6',
        password: 'panel123',
        roles: [
            { role: 'panel', team: 'TEAM1', memberType: 'internal' },
            { role: 'panel', team: 'TEAM2', memberType: 'external' }
        ]
    },
    {
        username: 'panel7',
        name: 'panel7',
        password: 'panel123',
        roles: [
            { role: 'panel', team: 'TEAM1', memberType: 'internal' },
            { role: 'panel', team: 'TEAM2', memberType: 'external' }
        ]
    },
    // Coordinators
    {
        username: 'coordinator1',
        name: 'Dr. Rajesh Kumar',
        password: 'coordinator123',
        roles: [
            { role: 'coordinator', team: 'TEAM1' },
            { role: 'coordinator', team: 'TEAM2' }
        ]
    },
    {
        username: 'coordinator2',
        name: 'Dr. Priya Sharma',
        password: 'coordinator123',
        roles: [
            { role: 'coordinator', team: 'TEAM1' },
            { role: 'coordinator', team: 'TEAM2' }
        ]
    },
    {
        username: 'coordinator3',
        name: 'Dr. Suresh Patel',
        password: 'coordinator123',
        roles: [
            { role: 'coordinator', team: 'TEAM1' },
            { role: 'coordinator', team: 'TEAM2' }
        ]
    },
    {
        username: 'coordinator4',
        name: 'Dr. Anita Rao',
        password: 'coordinator123',
        roles: [
            { role: 'coordinator', team: 'TEAM1' },
            { role: 'coordinator', team: 'TEAM2' }
        ]
    }
];

const createTestUsers = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await connectDB();
        console.log('Connected successfully!');

        // Clear existing users
        console.log('Clearing existing users...');
        await User.deleteMany({});
        console.log('Existing users cleared.');

        // Create users
        for (const userData of testUsers) {
            try {
                // Check if user already exists
                const existingUser = await User.findOne({ username: userData.username });
                if (existingUser) {
                    console.log(`User ${userData.username} already exists, skipping...`);
                    continue;
                }

                // Hash password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(userData.password, salt);
                console.log(`Password hashed for ${userData.username}`);

                // Create user
                const user = new User({
                    username: userData.username,
                    name: userData.name,
                    password: hashedPassword,
                    roles: userData.roles,
                    memberType: userData.memberType
                });

                await user.save();
                console.log(`Created ${userData.roles[0].role} user: ${userData.username}`);
            } catch (error) {
                console.error(`Error creating user ${userData.username}:`, error.message);
            }
        }

        console.log('All test users created successfully');
        
        // Display all login credentials
        console.log('\n=== LOGIN CREDENTIALS ===');
        console.log('\nADMIN:');
        console.log('Username: admin | Password: admin123');
        
        console.log('\nSTUDENTS:');
        testUsers.filter(u => u.roles[0].role === 'student').forEach(user => {
            console.log(`Username: ${user.username} | Password: ${user.password}`);
        });
        
        console.log('\nGUIDE FACULTY:');
        testUsers.filter(u => u.roles[0].role === 'guide').forEach(user => {
            console.log(`Username: ${user.username} | Password: ${user.password}`);
        });
        
        console.log('\nPANEL MEMBERS:');
        testUsers.filter(u => u.roles.some(r => r.role === 'panel')).forEach(user => {
            user.roles.filter(r => r.role === 'panel').forEach(panel => {
                console.log(`Username: ${user.username} | Password: ${user.password} | Type: ${panel.memberType}`);
            });
        });
        
        console.log('\nCOORDINATORS:');
        testUsers.filter(u => u.roles.some(r => r.role === 'coordinator')).forEach(user => {
            user.roles.filter(r => r.role === 'coordinator').forEach(coordinator => {
                console.log(`Username: ${user.username} | Password: ${user.password} | Name: ${user.name}`);
            });
        });
        console.log('\n=========================\n');
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createTestUsers(); 
