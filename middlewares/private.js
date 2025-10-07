/**
 * Middleware d'authentification (JWT requis).
 *
 * Vérifie le JWT depuis :
 *  - cookie "token"
 *  - en-tête "Authorization: Bearer <jwt>"
 *
 * En cas de succès :
 *   - injecte `req.user` et `res.locals.user` (utilisé par les vues EJS)
 * Sinon :
 *   - 401 'token_required' | 'token_not_valid'
 *
 * @typedef {Object} JwtUser
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {'admin'|'user'} role
 *
 */


const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

/**
 * Middleware Express qui vérifie le JWT.
 *
 * - Cherche le token dans `req.cookies.token` ou l'entête `Authorization: Bearer <jwt>`.
 * - Si valide : peuple `req.user` et `res.locals.user`, puis appelle `next()`.
 * - Si absent/invalide : répond `401` avec 'token_required' ou 'token_not_valid'.
 *
 * @returns {void}
 */

exports.checkJWT = (req, res, next) => {
  let token = req.cookies.token || req.headers['authorization'];

  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7);
  }

  if (!token) return res.status(401).json('token_required');

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    req.user = decoded.user;
    res.locals.user = decoded.user; // ✅ Utilisé dans layout.ejs

    next();
  } catch (err) {
    return res.status(401).json('token_not_valid');
  }
};
