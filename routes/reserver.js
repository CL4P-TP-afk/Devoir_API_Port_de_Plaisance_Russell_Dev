const express = require('express');
const router = express.Router();
const { checkJWT } = require('../middlewares/private');
const isAdmin = require('../middlewares/isAdmin');
const reserverService = require('../services/reserver');

// Toutes les routes nécessitent une connexion
router.use(checkJWT, isAdmin);
// Formulaire + Listes
router.get('/', reserverService.showForm);
router.post('/', reserverService.listAvailableCatways);

// Création : Étape 2 (confirm)
router.get('/confirm', reserverService.confirmReservationPage);
router.post('/confirm', reserverService.finalizeReservation);

// 🔍 Recherche
router.get('/search', reserverService.searchReservationByClient);

// 📝 Modification
router.put('/:id', reserverService.updateReservation);

// 🗑 Suppression
router.delete('/:id', reserverService.deleteReservation);

module.exports = router;
