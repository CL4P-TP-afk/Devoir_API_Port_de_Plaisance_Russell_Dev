// middlewares/isAdmin.js
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

/**
 * Représentation minimale d'un utilisateur injecté par le JWT.
 * @typedef {Object} JwtUser
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {"admin"|"user"} role
 */

/**
 * Payload JWT attendu (la propriété `user` peut être absente).
 * @typedef {Object} JwtPayload
 * @property {JwtUser} [user]
 */

/**
 * Locals de la réponse (optionnellement enrichis avec l'utilisateur).
 * @typedef {Object} Locals
 * @property {JwtUser} [user]
 */

/**
 * Représentation minimale d'une Request pour JSDoc (suffisant pour ce middleware).
 * @typedef {Object} Request
 * @property {Object.<string, string>} [headers]
 * @property {Object.<string, string>} [cookies]
 * @property {JwtUser} [user]
 */

/**
 * Représentation minimale d'une Response pour JSDoc (suffisant pour ce middleware).
 * @typedef {Object} Response
 * @property {function(number): Response} status
 * @property {function(Object): Response} json
 * @property {Locals} locals
 */

/**
 * Type fonction NextFunction (callback Express).
 * @callback NextFunction
 * @returns {void}
 */

/**
 * Middleware qui exige un utilisateur authentifié avec rôle **admin**.
 * - Cherche un JWT dans `cookie.token` ou l'en-tête `Authorization: Bearer <jwt>`.
 * - Décode le jeton avec `SECRET_KEY`.
 * - Vérifie `user.role === 'admin'`.
 * - Injecte `req.user` et `res.locals.user` si OK.
 *
 * Réponses d'erreur :
 * - `401 { message: 'Token manquant' }` si aucun jeton
 * - `401 { message: 'Token invalide' }` si vérification échoue
 * - `403 { message: 'Accès interdit : admin uniquement' }` si rôle ≠ admin
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {void}
 */
module.exports = function isAdmin(req, res, next) {
  /** @type {string|undefined} */
  let token = (req.cookies && req.cookies.token) || (req.headers && req.headers['authorization']);

  // Authorization: Bearer <jwt>
  if (token && typeof token === 'string' && token.startsWith('Bearer ')) {
    token = token.slice(7);
  }

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    /** @type {JwtPayload} */
    const payload = decoded;

    const user = payload && payload.user;

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès interdit : admin uniquement' });
    }

    // Injection dans req & res.locals (comme checkJWT)
    req.user = user;
    res.locals.user = user;

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide' });
  }
};
