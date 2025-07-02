const mongoose = require('mongoose');
const Team = require('../models/Team');
const User = require('../models/User');
const connectDB = require('../config/db');
require('dotenv').config();

const createTestTeams = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await connectDB();
        console.log('Connected successfully!');

        // Clear existing teams
        console.log('Clearing existing teams...');
        await Team.deleteMany({});
        console.log('Existing teams cleared.');

        // Get all student users
        const students = await User.find({ role: 'student' });
        const guides = await User.find({ role: 'guide' });

        // Create teams
        const teams = [
            {
                teamName: 'Team Innovators',
                projectTitle: 'Smart Home Automation System',
                teamLeader: students[3]._id,
                members: [students[0]._id, students[2]._id],
                guide: guides[0]._id,
                status: 'approved',
                isGuideFinalized: true
            },
            {
                teamName: 'Team Beta',
                projectTitle: 'E-Commerce Platform with AI Recommendations',
                teamLeader: students[1]._id,
                members: [students[4]._id, students[5]._id],
                guide: guides[1]._id,
                status: 'approved',
                isGuideFinalized: true
            },
            {
                teamName: 'Team Gamma',
                projectTitle: 'Health Monitoring System',
                teamLeader: students[6]._id,
                members: [students[7]._id, students[8]._id],
                status: 'pending'
            },
            {
                teamName: 'Team Delta',
                projectTitle: 'Smart Parking System',
                teamLeader: students[9]._id,
                members: [students[10]._id, students[11]._id],
                status: 'rejected'
            },
            {
                teamName: 'Team Epsilon',
                projectTitle: 'Online Learning Platform',
                teamLeader: students[12]._id,
                members: [students[13]._id, students[14]._id],
                guide: guides[0]._id,
                status: 'approved',
                isGuideFinalized: true
            },
            {
                teamName: 'Team Zeta',
                projectTitle: 'Social Media Analytics Dashboard',
                teamLeader: students[15]._id,
                members: [students[16]._id],
                status: 'pending'
            }
        ];

        // Create teams
        for (const teamData of teams) {
            try {
                const team = new Team(teamData);
                await team.save();
                console.log(`Created team: ${teamData.teamName}`);

                // Update guide's assignedTeams if team has a guide
                if (teamData.guide) {
                    await User.findByIdAndUpdate(
                        teamData.guide,
                        { $push: { assignedTeams: team._id } }
                    );
                }
            } catch (error) {
                console.error(`Error creating team ${teamData.teamName}:`, error.message);
            }
        }

        console.log('All test teams created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createTestTeams();