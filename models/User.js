const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please add a name"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Please add an email"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    preferences: {
        currency: {
            type: String,
            default: 'USD'
        },
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        },
        notifications: {
            type: Boolean,
            default: true
        }
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, {
    timestamps: true
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
