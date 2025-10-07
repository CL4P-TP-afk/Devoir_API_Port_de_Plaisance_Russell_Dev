// routes/docs.js
const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY;

/**
 * Décode le JWT s'il est présent, sans lever d'erreur ni renvoyer 401.
 * Cherche le token dans :
 *  - cookie `token`
 *  - en-tête `Authorization: Bearer <jwt>`
 *
 * @param {*} req - Requête HTTP
 * @returns {Object|null} user - L'utilisateur du payload ({ id, name, email, role }) ou null
 */
function decodeUser(req) {
  try {
    let token = (req.cookies && req.cookies.token) || (req.headers && req.headers.authorization);
    if (!token) return null;
    if (typeof token === 'string' && token.startsWith('Bearer ')) token = token.slice(7);
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded && decoded.user ? decoded.user : null;
  } catch {
    return null;
  }
}

/**
 * GET /docs
 * Page intégrée affichant l'OpenAPI (Swagger UI) dans un iframe
 * avec un bouton “Retour” dont la destination dépend du rôle connecté :
 *  - admin  -> /dashboard
 *  - user   -> /user-dashboard
 *  - invité -> /
 *
 * Variables passées à la vue :
 *  - user {Object|null} : infos utilisateur issues du JWT (ou null)
 *  - swaggerUrl {string} : chemin de Swagger UI (par défaut /api-docs)
 *  - returnPath {string} : URL de retour calculée
 *
 * @param {*} req - Requête HTTP
 * @param {*} res - Réponse HTTP
 * @returns {void}
 */
router.get('/', (req, res) => {
  const user = decodeUser(req);

  const returnPath = user
    ? (user.role === 'admin' ? '/dashboard' : '/user-dashboard')
    : '/';

  res.render('pages/docs', {
    user,
    swaggerUrl: '/api-docs',
    returnPath
  });
});

module.exports = router;
