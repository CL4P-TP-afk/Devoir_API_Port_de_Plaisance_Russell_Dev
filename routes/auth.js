const express = require('express');
const router = express.Router();
const authService = require('../services/auth');

// Authentification depuis formulaire d’accueil
router.post('/login', authService.login);

// Déconnexion
router.get('/logout', authService.logout);

module.exports = router;
