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

// Vérifie si l'utilisateur est déjà connecté
function isAuthenticated(req) {
  const token = req.cookies.token || req.headers.authorization;
  if (!token) return false;

  try {
    const realToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const decoded = jwt.verify(realToken, SECRET_KEY);
    return decoded;
  } catch (err) {
    return false;
  }
}

// Page d'accueil
router.get('/', (req, res) => {
  const user = isAuthenticated(req);
  if (user) return res.redirect('/dashboard');

  res.render('pages/index', { error: null });
});


// Routes principales
router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/catways', catwayRoute);
router.use('/catways', reservationRoute);
router.use('/dashboard', dashboardRoute);
router.use('/reserver', reserverRoute);
router.use('/', docsRoute);
router.use('/user-dashboard', userDashboardRoute);

router.get('/healthz', (req, res) => res.status(200).json({ ok: true }));


module.exports = router;
