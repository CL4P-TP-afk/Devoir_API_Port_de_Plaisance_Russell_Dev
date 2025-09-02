const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({    
    name: {
        type: String,
        trim: true,
        required: [true, 'Le nom est requis']
    },
    email: {
        type: String,
        trim: true,
        required: [true, "L'email est requis"],
        unique: true, 
        lowercase: true
    },
    password: {
    type: String,
    trim: true,
    required: true
    },

    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    }

}, {
    // date de creation (createdAT) et date de modification (updatedAT)
    timestamps : true
});

//Hash le mdp quand il est modifié
userSchema.pre('save', function(next) {
    if (!this.isModified('password')) {
        return next();
    }

    this.password = bcrypt.hashSync(this.password, 10);

    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;