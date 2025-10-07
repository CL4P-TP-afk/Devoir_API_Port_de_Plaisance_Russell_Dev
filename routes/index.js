const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

// Import des sous-routes
const userRoute = require('../routes/users');
const catwayRoute = require('../routes/catways');
const reservationRoute = require('../routes/reservations');
const authRoute = require('../routes/auth');
const dashboardRoute = require('./dashboard');
const reserverRoute = require('./reserver');
const docsRoute = require('./docs');
const userDashboardRoute = require('./user-dashboard');

/**
 * Vérifie si l'utilisateur est authentifié via JWT.
 * Cherche le token dans :
 *  - cookie `token`
 *  - en-tête `Authorization: Bearer <jwt>`
 *
 * Retourne le **payload décodé** si valide, sinon `false`.
 *
 * @param {*} req - Requête HTTP
 * @returns {object|false}
 */
function isAuthenticated(req) {
  const token = (req.cookies && req.cookies.token) || (req.headers && req.headers.authorization);
  if (!token) return false;

  try {
    const realToken = typeof token === 'string' && token.startsWith('Bearer ') ? token.slice(7) : token;
    const decoded = jwt.verify(realToken, SECRET_KEY);
    return decoded;
  } catch (err) {
    return false;
  }
}

/**
 * GET /
 * Page d'accueil (formulaire de connexion).
 * - Si l'utilisateur est déjà connecté -> redirection /dashboard
 * - Sinon, rend `pages/index`
 *
 * @param {*} req
 * @param {*} res
 * @returns {void}
 */
router.get('/', (req, res) => {
  const user = isAuthenticated(req);
  if (user) return res.redirect('/dashboard');
  res.render('pages/index', { error: null });
});

/**
 * Montage des sous-routeurs.
 * Remarque : `reservationRoute` est également monté sous `/catways`
 * pour gérer les routes de type `/catways/:id/reservations/...`.
 */
router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/catways', catwayRoute);
router.use('/catways', reservationRoute);
router.use('/dashboard', dashboardRoute);
router.use('/reserver', reserverRoute);
router.use('/', docsRoute);
router.use('/user-dashboard', userDashboardRoute);

/**
 * GET /healthz
 * Endpoint de liveness/readiness.
 *
 * @param {*} req
 * @param {*} res
 * @returns {void}
 */
router.get('/healthz', (req, res) => res.status(200).json({ ok: true }));

module.exports = router;
