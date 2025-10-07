/**
 * Modèle User (Mongoose)
 * ----------------------
 * Représente un utilisateur de l'application.
 *
 * Champs :
 * - name {string}          Nom complet
 * - email {string}         Email unique (stocké en minuscule)
 * - password {string}      Hash du mot de passe (jamais en clair)
 * - role {string}          Rôle applicatif ("admin" ou "user")
 *
 * Hook :
 * - pre('save') : hash du mot de passe si modifié (bcrypt, salt=10)
 *
 * @typedef {Object} UserDoc
 * @property {string} _id
 * @property {string} name
 * @property {string} email
 * @property {string} password
 * @property {string} role
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

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
  // dates de création (createdAT) et de modification (updatedAT)
  timestamps: true
});

// Hash le mot de passe quand il est modifié
userSchema.pre('save', function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = bcrypt.hashSync(this.password, 10);
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
