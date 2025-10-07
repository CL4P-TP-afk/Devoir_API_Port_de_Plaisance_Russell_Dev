const express = require('express');
const router = express.Router();

const service = require('../services/catways');

const { checkJWT } = require('../middlewares/private');
const isAdmin = require('../middlewares/isAdmin');

/**
 * Toutes les routes Catways sont protégées :
 * - JWT requis (checkJWT)
 * - rôle admin requis (isAdmin)
 */
router.use(checkJWT, isAdmin);

/**
 * GET /catways
 * Liste tous les catways (page HTML).
 *
 * Résultat :
 * - Rend `pages/catways` avec { catways, query, searchedCatway:null }
 *
 * @param {*} req
 * @param {*} res
 * @returns {void}
 */
router.get('/', (req, res) => service.getAll(req, res));

/**
 * GET /catways/:id
 * Récupère un catway par son **numéro** puis redirige vers la liste.
 * (Validation d’existence, pas de page de détail dédiée.)
 *
 * @param {*} req - params.id: numéro de catway (string/number)
 * @param {*} res
 * @returns {void}
 */
router.get('/:id', (req, res) => service.getById(req, res));

/**
 * POST /catways
 * Crée un catway.
 *
 * Body attendu :
 * - catwayNumber {number} (>=1)
 * - catwayType {"long"|"short"}
 * - catwayState {string} (optionnel)
 * - isReservable {"on"|undefined} (form HTML)
 *
 * @param {*} req
 * @param {*} res
 * @returns {void}
 */
router.post('/', ...service.add);

/**
 * PUT /catways/:id
 * Met à jour l’état et la réservabilité d’un catway.
 *
 * Body attendu :
 * - catwayState {string} (requis)
 * - isReservable {"true"|"false"} (string)
 *
 * @param {*} req - params.id: ObjectId du catway
 * @param {*} res
 * @returns {void}
 */
router.put('/:id', ...service.update);

/**
 * DELETE /catways/:id
 * Supprime un catway par son _id (Mongo).
 *
 * @param {*} req - params.id: ObjectId du catway
 * @param {*} res
 * @returns {void}
 */
router.delete('/:id', (req, res) => service.delete(req, res));

/**
 * POST /catways/search
 * Recherche un catway par son numéro et ré-affiche la page avec un bloc “résultat”.
 *
 * Body attendu :
 * - searchNumber {string|number}
 *
 * @param {*} req
 * @param {*} res
 * @returns {void}
 */
router.post('/search', (req, res) => service.searchByNumber(req, res));

module.exports = router;
