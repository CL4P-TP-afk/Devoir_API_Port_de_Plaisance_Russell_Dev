const express = require('express');
const router = express.Router();

const service = require('../services/reservation');

const { checkJWT } = require('../middlewares/private');
const isAdmin = require('../middlewares/isAdmin');

/**
 * Toutes les routes Réservations sont protégées :
 * - JWT requis (checkJWT)
 * - rôle admin requis (isAdmin)
 */
router.use(checkJWT, isAdmin);

/**
 * GET /catways/:id/reservations
 * Liste les réservations d’un catway (_id Mongo).
 *
 * @param {*} req - params.id : ObjectId du catway
 * @param {*} res
 * @returns {void}
 */
router.get('/:id/reservations', (req, res) => service.getAll(req, res));

/**
 * GET /catways/:id/reservations/:idReservation
 * Affiche une réservation précise pour un catway donné.
 *
 * @param {*} req - params.id : ObjectId du catway ; params.idReservation : ObjectId réservation
 * @param {*} res
 * @returns {void}
 */
router.get('/:id/reservations/:idReservation', (req, res) => service.getById(req, res));

/**
 * POST /catways/:id/reservations
 * Création d’une réservation (validations dans le service).
 *
 * Body attendu :
 * - clientName {string} (existant dans Users)
 * - boatName {string} (>= 3)
 * - startDate {string|Date}
 * - endDate {string|Date}
 *
 * @param {*} req
 * @param {*} res
 * @returns {void}
 */
router.post('/:id/reservations', ...service.add);

/**
 * PATCH /catways/:id/reservations/:idReservation
 * Mise à jour partielle d’une réservation.
 * (Le service vérifie la validité et l’absence de chevauchement.)
 *
 * @param {*} req - params.id : ObjectId du catway ; params.idReservation : ObjectId réservation
 * @param {*} res
 * @returns {void}
 */
router.patch('/:id/reservations/:idReservation', ...service.update);

/**
 * DELETE /catways/:id/reservations/:idReservation
 * Supprime une réservation.
 *
 * @param {*} req - params.id : ObjectId du catway ; params.idReservation : ObjectId réservation
 * @param {*} res
 * @returns {void}
 */
router.delete('/:id/reservations/:idReservation', (req, res) => service.delete(req, res));

module.exports = router;
