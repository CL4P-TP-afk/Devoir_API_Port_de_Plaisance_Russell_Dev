const express = require('express');
const router = express.Router();
const dashboardService = require('../services/dashboard');
const { checkJWT } = require('../middlewares/private');
const isAdmin = require('../middlewares/isAdmin');

/**
 * GET /dashboard
 * Affiche le tableau de bord administrateur.
 *
 * - Protégé par le middleware `checkJWT` (authentification JWT)
 * - Restreint au rôle **admin** (`isAdmin`)
 * - Rend la vue `pages/dashboard` avec :
 *    - currentReservations : réservations en cours
 *    - upcomingReservations : réservations à venir
 *    - expiredReservations : réservations expirées
 *    - today : date du jour formatée (fr-FR)
 *    - message : optionnel via querystring
 *
 * @param {*} req - Requête HTTP
 * @param {*} res - Réponse HTTP
 * @returns {void}
 */
router.get('/', checkJWT, isAdmin, (req, res) =>
  dashboardService.renderDashboard(req, res)
);

module.exports = router;
