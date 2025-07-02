const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false,
        unique: false  // Making it non-unique
    },
    password: {
        type: String,
        required: true
    },
    roles: [{
        role: {
            type: String,
            enum: ['admin', 'student', 'guide', 'panel', 'coordinator'],
            required: true
        },
        team: {
            type: String, // or ObjectId if you want to reference Team
            default: null
        }
    }],
    memberType: {
        type: String,
        enum: ['internal', 'external', null],
        validate: {
            validator: function(v) {
                // memberType is required only for panel members
                if (this.roles && this.roles.some(r => r.role === 'panel')) {
                    return v === 'internal' || v === 'external';
                }
                return v === null || v === undefined;
            },
            message: 'memberType must be either internal or external for panel members'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    reviewPeriodStartDate: {
        type: Date,
        default: null
    },
    reviewPeriodEndDate: {
        type: Date,
        default: null
    }
});

// Drop the unique index on email if it exists
userSchema.index({ email: 1 }, { unique: false });

module.exports = mongoose.model('User', userSchema); 