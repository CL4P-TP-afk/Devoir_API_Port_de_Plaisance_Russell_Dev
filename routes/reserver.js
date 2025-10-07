const express = require('express');
const router = express.Router();
const { checkJWT } = require('../middlewares/private');
const isAdmin = require('../middlewares/isAdmin');
const reserverService = require('../services/reserver');

/**
 * Toutes les routes Reserver sont protégées :
 * - JWT requis (checkJWT)
 * - rôle admin requis (isAdmin)
 */
router.use(checkJWT, isAdmin);

/**
 * GET /reserver
 * Affiche le formulaire d’assistance + listes (En cours / À venir / Terminées).
 * Passe à la vue :
 *  - users, reservations, allCatways, allowedCatwaysByResId, etc.
 *
 * @param {*} req
 * @param {*} res
 * @returns {void}
 */
router.get('/', (req, res) => reserverService.showForm(req, res));

/**
 * POST /reserver
 * Recherche de disponibilités selon le formulaire :
 * - champs requis : clientName, boatName, catwayType, startDate, endDate, userId
 * - renvoie la même page avec `availableCatways`
 *
 * @param {*} req
 * @param {*} res
 * @returns {void}
 */
router.post('/', (req, res) => reserverService.listAvailableCatways(req, res));

/**
 * GET /reserver/confirm
 * Page de confirmation de réservation (récapitulatif).
 * Paramètres via querystring :
 * - clientName, boatName, startDate, endDate, userId, catwayNumber
 *
 * @param {*} req
 * @param {*} res
 * @returns {void}
 */
router.get('/confirm', (req, res) => reserverService.confirmReservationPage(req, res));

/**
 * POST /reserver/confirm
 * Création finale de la réservation après confirmation.
 * Re-vérifie l’absence de conflit avant insertion.
 *
 * @param {*} req
 * @param {*} res
 * @returns {void}
 */
router.post('/confirm', (req, res) => reserverService.finalizeReservation(req, res));

/**
 * GET /reserver/search?clientName=...
 * Recherche des réservations par client (insensible à la casse).
 * Ré-affiche la page /reserver avec `searchResults`.
 *
 * @param {*} req
 * @param {*} res
 * @returns {void}
 */
router.get('/search', (req, res) => reserverService.searchReservationByClient(req, res));

/**
 * PUT /reserver/:id
 * Met à jour une réservation :
 * - vérifie type identique du catway, réservabilité et absence de chevauchement
 * - met à jour boatName, startDate, endDate, catwayNumber
 *
 * @param {*} req - params.id : ObjectId réservation
 * @param {*} res
 * @returns {void}
 */
router.put('/:id', (req, res) => reserverService.updateReservation(req, res));

/**
 * DELETE /reserver/:id
 * Supprime une réservation par son `_id`.
 * Redirige vers /reserver avec un message.
 *
 * @param {*} req - params.id : ObjectId réservation
 * @param {*} res
 * @returns {void}
 */
router.delete('/:id', (req, res) => reserverService.deleteReservation(req, res));

module.exports = router;
