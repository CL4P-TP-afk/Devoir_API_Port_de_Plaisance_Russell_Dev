const express = require('express');
const router = express.Router();
const { checkJWT } = require('../middlewares/private');

/**
 * GET /user-dashboard
 * Espace utilisateur (protégé par JWT).
 * Rend la vue `pages/user-dashboard` avec :
 *  - title {string}
 *  - user {Object} : infos injectées par `checkJWT`
 *  - message {string} : note d’information
 *
 * @param {*} req
 * @param {*} res
 * @returns {void}
 */
router.get('/', checkJWT, (req, res) => {
  res.render('pages/user-dashboard', {
    title: 'Espace utilisateur',
    user: req.user,
    message: "👷‍♀️ En construction — contactez l’admin pour toute demande de réservation."
  });
});

module.exports = router;
