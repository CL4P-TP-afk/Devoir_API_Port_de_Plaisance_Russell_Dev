const express = require('express');
const router = express.Router();
const authService = require('../services/auth');

/**
 * POST /auth/login
 * Authentifie un utilisateur à partir du formulaire de la page d’accueil.
 *
 * Body attendu :
 * - email {string}
 * - password {string}
 *
 * Résultats :
 * - OK : crée un cookie httpOnly `token` puis redirige
 *        (admin -> /dashboard, user -> /user-dashboard)
 * - KO : ré-affiche la page de login avec un message d’erreur
 *
 * @param {*} req - Requête HTTP
 * @param {*} res - Réponse HTTP
 * @returns {void}
 */
router.post('/login', (req, res) => authService.login(req, res));

/**
 * GET /auth/logout
 * Déconnecte l’utilisateur :
 * - supprime le cookie `token`
 * - redirige vers la page d’accueil `/`
 *
 * @param {*} req - Requête HTTP
 * @param {*} res - Réponse HTTP
 * @returns {void}
 */
router.get('/logout', (req, res) => authService.logout(req, res));

module.exports = router;
