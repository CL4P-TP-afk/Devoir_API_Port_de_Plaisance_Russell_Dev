const express = require('express');
const router = express.Router();
const { checkJWT } = require('../middlewares/private');

router.get('/', checkJWT, (req, res) => {
  res.render('pages/user-dashboard', {
    title: 'Espace utilisateur',
    user: req.user,
    message: "👷‍♀️ En construction — contactez l’admin pour toute demande de réservation."
  });
});

module.exports = router;
