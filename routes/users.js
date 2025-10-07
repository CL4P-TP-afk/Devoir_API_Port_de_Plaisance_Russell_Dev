const express = require('express');
const router = express.Router();

const userService = require('../services/users');
const { checkJWT } = require('../middlewares/private');
const isAdmin = require('../middlewares/isAdmin');

/**
 * Toutes les routes Users sont protégées :
 * - JWT requis (checkJWT)
 * - rôle admin requis (isAdmin)
 */
router.use(checkJWT, isAdmin);

/**
 * GET /users
 * Liste tous les utilisateurs (HTML).
 * Rend la vue `pages/users` avec :
 *  - users (triés par nom)
 *  - message (querystring)
 *  - searchedUser (null)
 *
 * @param {*} req
 * @param {*} res
 * @returns {void}
 */
router.get('/', (req, res) => userService.getAll(req, res));

/**
 * GET /users/search?name=...
 * Recherche d'un utilisateur par nom (insensible à la casse).
 * Ré-affiche `pages/users` avec :
 *  - users (liste complète)
 *  - searchedUser (résultat ou null)
 *  - message (si aucun résultat / pas de nom)
 *
 * @param {*} req
 * @param {*} res
 * @returns {void}
 */
router.get('/search', (req, res) => userService.searchByName(req, res));

/**
 * GET /users/:id
 * Détail d’un utilisateur par son ID.
 * Si introuvable : redirection /users avec message.
 *
 * @param {*} req - params.id : ObjectId user
 * @param {*} res
 * @returns {void}
 */
router.get('/:id', (req, res) => userService.getById(req, res));

/**
 * POST /users
 * Création d’un utilisateur (validations côté service).
 * - vérifie unicité de l'email
 * - hash via pre('save') du modèle
 *
 * @param {*} req
 * @param {*} res
 * @returns {void}
 */
router.post('/', ...userService.add);

/**
 * PUT /users/:id
 * Mise à jour d’un utilisateur (validations côté service).
 * - normalise l'email et vérifie l'unicité si modifié
 * - met à jour nom, email, rôle
 * - hash du mot de passe si fourni
 *
 * @param {*} req - params.id : ObjectId user
 * @param {*} res
 * @returns {void}
 */
router.put('/:id', ...userService.update);

/**
 * DELETE /users/:id
 * Suppression d’un utilisateur.
 * Redirige vers /users avec un message.
 *
 * @param {*} req - params.id : ObjectId user
 * @param {*} res
 * @returns {void}
 */
router.delete('/:id', (req, res) => userService.delete(req, res));

module.exports = router;
